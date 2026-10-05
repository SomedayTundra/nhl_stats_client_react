// Published patch notes, bundled at build time from /patch-notes/*.md (repo root, not src/).
// Only files named YYYY-MM-DD.md count as published, which keeps helpers like STYLE.md off the
// page. There is one file per day: later changes that day are added to it, not given a second
// file. Drafts never reach this list: they live on the patch-notes/draft branch until their PR
// merges. See scripts/draft-patch-notes.mjs.

import {formatApiDateForDisplay} from '@/lib/date.ts'

export interface PatchNote {
    /** Filename without .md, unique, e.g. '2026-10-01'. */
    id: string
    title: string
    /** yyyy-mm-dd */
    date: string
    /** Markdown, frontmatter stripped. */
    body: string
}

const NOTE_FILE = /\/(\d{4}-\d{2}-\d{2})\.md$/

const files = import.meta.glob<string>('/patch-notes/*.md', {query: '?raw', import: 'default', eager: true})

function parse(id: string, text: string): PatchNote {
    const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
    const meta: Record<string, string> = {}
    for (const line of match?.[1].split(/\r?\n/) ?? []) {
        const pair = line.match(/^(\w+):\s*(.*)$/)
        if (pair) meta[pair[1]] = pair[2].replace(/^["']|["']$/g, '')
    }
    const date = meta.date ?? id
    // built from the date (shown MM-dd-yyyy) unless the file sets a hand-written title
    return {id, title: meta.title ?? `Patch notes for ${formatApiDateForDisplay(date)}`, date, body: match ? match[2] : text}
}

/** Newest first. */
export const patchNotes: PatchNote[] = Object.entries(files)
    .flatMap(([file, text]) => {
        const id = file.match(NOTE_FILE)?.[1]
        return id ? [parse(id, text)] : []
    })
    .sort((a, b) => b.id.localeCompare(a.id))
