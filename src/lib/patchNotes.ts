// Published patch notes, bundled at build time from /patch-notes/*.md (repo root, not src/).
// Only files named YYYY-MM-DD.md (optionally -N for a second release that day) count as
// published, which keeps helpers like STYLE.md off the page. Drafts never reach this list: they
// live on the patch-notes/draft branch until their PR merges. See scripts/draft-patch-notes.mjs.

export interface PatchNote {
    /** Filename without .md, unique, e.g. '2026-10-01' or '2026-10-01-2'. */
    id: string
    title: string
    /** yyyy-mm-dd */
    date: string
    /** Markdown, frontmatter stripped. */
    body: string
}

const NOTE_FILE = /\/(\d{4}-\d{2}-\d{2}(?:-\d+)?)\.md$/

const files = import.meta.glob<string>('/patch-notes/*.md', {query: '?raw', import: 'default', eager: true})

function parse(id: string, text: string): PatchNote {
    const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
    const meta: Record<string, string> = {}
    for (const line of match?.[1].split(/\r?\n/) ?? []) {
        const pair = line.match(/^(\w+):\s*(.*)$/)
        if (pair) meta[pair[1]] = pair[2].replace(/^["']|["']$/g, '')
    }
    const date = meta.date ?? id.slice(0, 10)
    return {id, title: meta.title ?? `Patch notes for ${date}`, date, body: match ? match[2] : text}
}

/** Newest first. */
export const patchNotes: PatchNote[] = Object.entries(files)
    .flatMap(([file, text]) => {
        const id = file.match(NOTE_FILE)?.[1]
        return id ? [parse(id, text)] : []
    })
    .sort((a, b) => b.id.localeCompare(a.id))
