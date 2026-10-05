// Drafts user-facing patch notes from commits that landed on main since the last published notes,
// for .github/workflows/patch-notes-draft.yml. Run from the client repo root.
//
// Published notes are patch-notes/YYYY-MM-DD.md files on main, at most one per day. Each one's
// frontmatter carries clientToSha/serverToSha: the last commit of each repo it covers. The next
// draft starts there. A draft made on a day that already has published notes edits that day's
// file rather than starting a second one, so the page shows one card per day.
//
// The draft lives on the patch-notes/draft branch (one open PR, updated in place). If that branch
// already holds a draft, it was probably hand-edited, so this script never rewrites its text.
// It only merges in notes for commits newer than the draft's own cursors and moves the cursors on.
// The same goes for a published file being added to: new bullets land under the matching
// heading, and existing text is left as written.
//
// Env: ANTHROPIC_API_KEY (required), SERVER_DIR (server repo checkout, default ../nhl_stats_server_fastapi),
//      DRAFT_REF (default origin/patch-notes/draft), PATCH_NOTES_MODEL (default claude-opus-5-5),
//      GITHUB_OUTPUT (set by Actions; receives changed=true|false).

import {execFileSync} from 'node:child_process'
import {appendFileSync, existsSync, readdirSync, readFileSync, writeFileSync} from 'node:fs'
import path from 'node:path'
import Anthropic from '@anthropic-ai/sdk'

const NOTES_DIR = 'patch-notes'
const SERVER_DIR = process.env.SERVER_DIR ?? '../nhl_stats_server_fastapi'
const DRAFT_REF = process.env.DRAFT_REF ?? 'origin/patch-notes/draft'
const MODEL = process.env.PATCH_NOTES_MODEL ?? 'claude-opus-5-5'
const NOTE_FILE = /^\d{4}-\d{2}-\d{2}\.md$/
const SECTION_ORDER = ['new', 'improved', 'fixed']

const git = (cwd, ...args) => execFileSync('git', args, {cwd, encoding: 'utf8'}).trim()

function setOutput(name, value) {
    if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`)
    console.log(`${name}=${value}`)
}

// Minimal frontmatter: `key: value` lines between leading `---` fences.
function parseNote(text) {
    const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
    if (!match) return {meta: {}, body: text}
    const meta = Object.fromEntries(match[1].split(/\r?\n/)
        .map(line => line.match(/^(\w+):\s*(.*)$/))
        .filter(Boolean)
        .map(([, key, value]) => [key, value.replace(/^["']|["']$/g, '')]))
    return {meta, body: match[2]}
}

const formatNote = (meta, body) =>
    `---\n${Object.entries(meta).map(([key, value]) => `${key}: ${value}`).join('\n')}\n---\n\n${body.trim()}\n`

// Newest published note on main (the working tree is main's checkout).
function latestPublished() {
    const names = readdirSync(NOTES_DIR).filter(name => NOTE_FILE.test(name)).sort()
    if (names.length === 0) throw new Error(`no published notes in ${NOTES_DIR}/ to take cursors from`)
    const name = names.at(-1)
    return {name, ...parseNote(readFileSync(path.join(NOTES_DIR, name), 'utf8'))}
}

// The note the draft branch adds or changes relative to main, if a draft PR is open. A draft can
// edit an existing day's file, so "main doesn't have it" isn't enough: a file that differs from
// main's copy counts too, unless the branch has already been merged into main (a stale branch
// whose file main has since edited would otherwise look like a draft).
function existingDraft() {
    try {
        git('.', 'rev-parse', '--verify', '--quiet', DRAFT_REF)
    } catch {
        return null
    }
    try {
        git('.', 'merge-base', '--is-ancestor', DRAFT_REF, 'HEAD')
        return null
    } catch {
        // not merged yet, so whatever it changes is still a draft
    }
    const names = git('.', 'ls-tree', '--name-only', `${DRAFT_REF}:${NOTES_DIR}`).split('\n')
    for (const name of names.filter(n => NOTE_FILE.test(n))) {
        const text = git('.', 'show', `${DRAFT_REF}:${NOTES_DIR}/${name}`)
        const local = path.join(NOTES_DIR, name)
        if (!existsSync(local) || readFileSync(local, 'utf8').trim() !== text.trim()) {
            return {name, ...parseNote(text)}
        }
    }
    return null
}

// Splits a note body into the text before the first `## ` heading and its sections, in order.
function parseSections(body) {
    const sections = []
    let preamble = ''
    for (const line of body.trim().split(/\r?\n/)) {
        const heading = line.match(/^##\s+(.*?)\s*$/)
        if (heading) sections.push({heading: heading[1], lines: []})
        else if (sections.length) sections.at(-1).lines.push(line)
        else preamble += `${line}\n`
    }
    return {preamble: preamble.trim(), sections}
}

// Adds `added`'s bullets under the matching headings of `existing`, which is kept verbatim. A
// heading `existing` lacks is inserted in New, Improved, Fixed order.
function mergeNotes(existing, added) {
    const base = parseSections(existing)
    const extra = parseSections(added)
    const key = heading => heading.toLowerCase()
    const rank = heading => {
        const index = SECTION_ORDER.indexOf(key(heading))
        return index === -1 ? SECTION_ORDER.length : index
    }
    for (const section of extra.sections) {
        const match = base.sections.find(s => key(s.heading) === key(section.heading))
        if (match) {
            match.lines = [...match.lines.join('\n').trimEnd().split('\n'), ...section.lines.join('\n').trim().split('\n')]
        } else {
            const at = base.sections.findIndex(s => rank(s.heading) > rank(section.heading))
            base.sections.splice(at === -1 ? base.sections.length : at, 0, section)
        }
    }
    const preamble = [base.preamble, extra.preamble].filter(Boolean).join('\n\n')
    return [preamble, ...base.sections.map(s => `## ${s.heading}\n\n${s.lines.join('\n').trim()}`)]
        .filter(Boolean).join('\n\n')
}

// Non-merge commits after `since`, oldest first, with duplicate subjects collapsed (this history
// has several commits cherry-picked onto main under a second SHA). Client commits that only touch
// patch-notes/ are left out so a merged draft is never summarized into the next one.
function commitsSince(cwd, since, excludeNotes) {
    const args = ['log', '--no-merges', '--reverse', '--format=%as %s%n%b%x1e', `${since}..HEAD`]
    if (excludeNotes) args.push('--', '.', `:!${NOTES_DIR}`)
    const seen = new Set()
    return git(cwd, ...args).split('\x1e').map(entry => entry.trim()).filter(entry => {
        const subject = entry.split('\n')[0].slice(11)
        if (!entry || seen.has(subject)) return false
        seen.add(subject)
        return true
    })
}

async function summarize(clientCommits, serverCommits, voiceExample) {
    const style = existsSync(path.join(NOTES_DIR, 'STYLE.md'))
        ? readFileSync(path.join(NOTES_DIR, 'STYLE.md'), 'utf8') : ''
    const system = [
        'You write patch notes for NHL Stats, a web app for browsing NHL standings tables, standings',
        'charts, playoff brackets, and a "league shape" quiz. The audience is people using the app,',
        'not its developer.',
        '',
        'Turn the commit messages you are given into Markdown patch notes:',
        '- Use only these second-level headings, in this order, and omit any with nothing under them:',
        '  "## New", "## Improved", "## Fixed".',
        '- One bullet per user-visible change, in plain language. Merge related commits into one bullet.',
        '- Server and client commits that implement the same feature become one bullet.',
        '- Leave out changes users cannot see: CI, build tooling, dependency bumps, refactors, renames,',
        '  lint and type fixes, internal docs, and deployment plumbing.',
        '- Drop ticket prefixes such as [NHL-55] or [no JIRA].',
        '- Output only the Markdown. No title, no frontmatter, no preamble.',
        '- If nothing in the list is user-visible, output exactly: NONE',
        style && `\nHouse style, which overrides the above where they disagree:\n${style}`,
        voiceExample && `\nThe most recently published notes, for voice and level of detail:\n${voiceExample}`,
    ].filter(Boolean).join('\n')

    const list = (label, commits) => commits.length
        ? `${label} commits (date, then message):\n${commits.map(c => `- ${c.replace(/\n+/g, ' ')}`).join('\n')}`
        : ''
    const client = new Anthropic()
    const response = await client.beta.messages.create({
        model: MODEL,
        max_tokens: 16000,
        output_config: {effort: 'medium'},
        // On a safety-classifier decline, the API reruns the request on a fallback model.
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        system,
        messages: [{
            role: 'user',
            content: [list('Client (web app)', clientCommits), list('Server (API and data)', serverCommits)]
                .filter(Boolean).join('\n\n'),
        }],
    })
    if (response.stop_reason === 'refusal') {
        throw new Error(`model declined: ${response.stop_details?.explanation ?? 'no explanation'}`)
    }
    if (response.stop_reason === 'max_tokens') throw new Error('response hit max_tokens')
    const text = response.content.filter(block => block.type === 'text').map(block => block.text).join('').trim()
    return text === 'NONE' ? '' : text
}

const published = latestPublished()
const draft = existingDraft()
const base = draft ?? published

const clientHead = git('.', 'rev-parse', 'HEAD')
const serverHead = git(SERVER_DIR, 'rev-parse', 'HEAD')
const clientCommits = commitsSince('.', base.meta.clientToSha, true)
const serverCommits = commitsSince(SERVER_DIR, base.meta.serverToSha, false)
console.log(`base ${base.name}: ${clientCommits.length} client, ${serverCommits.length} server commits`)

if (clientCommits.length === 0 && serverCommits.length === 0) {
    setOutput('changed', 'false')
    process.exit(0)
}

const notes = await summarize(clientCommits, serverCommits, published.body)
if (!draft && !notes) {
    // Nothing user-visible and no PR open: don't open one just to move cursors.
    setOutput('changed', 'false')
    process.exit(0)
}
const today = new Date().toISOString().slice(0, 10)
// An open draft is added to; otherwise today's published file is, if there is one already.
const target = draft ?? (published.name === `${today}.md` ? published : null)
const name = target?.name ?? `${today}.md`

// With an open draft, cursors advance even when nothing user-visible was added.
const body = target && notes ? mergeNotes(target.body, notes) : target?.body ?? notes
// The page builds the title from the date, so only a hand-written title is carried forward.
const meta = {
    ...(target?.meta.title ? {title: target.meta.title} : {}),
    date: target?.meta.date ?? today,
    clientToSha: clientHead,
    serverToSha: serverHead,
}
writeFileSync(path.join(NOTES_DIR, name), formatNote(meta, body))
setOutput('changed', 'true')
setOutput('file', `${NOTES_DIR}/${name}`)
