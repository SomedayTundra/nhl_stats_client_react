import type {Element, ElementContent, Root, RootContent} from 'hast'
import Markdown, {type Components} from 'react-markdown'
import {patchNotes} from '@/lib/patchNotes.ts'

// The notes mark which repo a change came from with an inline-code label at the start of a bullet
// (`client`, `server`, `client + server`). Those exact labels render as grey pills, and a code span
// holding only a ticket id renders as a ticket pill; any other inline code is left as ordinary code.
const REPO_LABELS = new Set(['client', 'server', 'client + server'])
const CATEGORIES = new Set(['new', 'improved', 'fixed', 'misc'])

// Jira ticket ids, bare (NHL-86) or bracketed ([NHL-86]), render as orange pills showing the bare id.
const TICKET = /\[NHL-\d+]|\bNHL-\d+\b/g
const NO_TICKET_PILLS = new Set(['code', 'pre', 'a'])

function ticketPills(text: string): ElementContent[] {
    const out: ElementContent[] = []
    let last = 0
    for (const match of text.matchAll(TICKET)) {
        if (match.index > last) out.push({type: 'text', value: text.slice(last, match.index)})
        out.push({
            type: 'element',
            tagName: 'span',
            properties: {className: ['patch-notes-ticket']},
            children: [{type: 'text', value: match[0].replace(/^\[|]$/g, '')}],
        })
        last = match.index + match[0].length
    }
    if (last < text.length) out.push({type: 'text', value: text.slice(last)})
    return out
}

// Rehype plugin: splits ticket ids out of text nodes, leaving code and links alone.
function rehypeTicketPills() {
    const visit = (node: Root | Element) => {
        const children: RootContent[] = node.children
        node.children = children.flatMap((child): RootContent[] => {
            if (child.type === 'text') return ticketPills(child.value)
            if (child.type === 'element' && !NO_TICKET_PILLS.has(child.tagName)) visit(child)
            return [child]
        }) as Element['children']
    }
    return (tree: Root) => visit(tree)
}
const rehypePlugins = [rehypeTicketPills]

const markdownComponents: Components = {
    code({children, className}) {
        if (typeof children === 'string') {
            if (REPO_LABELS.has(children)) return <span className='patch-notes-tag'>{children}</span>
            if (/^\[?NHL-\d+]?$/.test(children)) {
                return <span className='patch-notes-ticket'>{children.replace(/^\[|]$/g, '')}</span>
            }
        }
        return <code className={className}>{children}</code>
    },
    h2({children}) {
        const text = (typeof children === 'string') ? children.toLocaleLowerCase() : ''
        return <h2 data-category={CATEGORIES.has(text) ? text : undefined}>{children}</h2>
    }
}

// One card per day of published notes, newest first; the title carries the date. The notes are bundled at build time (see
// patchNotes.ts), so there's nothing to fetch and nothing that can fail to load.
export default function PatchNotes() {
    return (
        <div className='patch-notes mx-auto max-w-3xl px-4 py-6 flex flex-col gap-6'>
            {patchNotes.length === 0 && <p>No patch notes have been published yet.</p>}
            {patchNotes.map(note => (
                <article key={note.id} className='patch-notes-release'>
                    <header className='patch-notes-release-header'>
                        <h2>{note.title}</h2>
                    </header>
                    <div className='patch-notes-body'>
                        <Markdown components={markdownComponents} rehypePlugins={rehypePlugins}>{note.body}</Markdown>
                    </div>
                </article>
            ))}
        </div>
    )
}
