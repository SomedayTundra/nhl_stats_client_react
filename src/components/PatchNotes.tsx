import Markdown, {type Components} from 'react-markdown'
import {patchNotes} from '@/lib/patchNotes.ts'

// The notes mark which repo a change came from with an inline-code label at the start of a bullet
// (`client`, `server`, `client + server`). Those exact labels render as grey pills; any other
// inline code is left as ordinary code.
const REPO_LABELS = new Set(['client', 'server', 'client + server'])
const CATEGORIES = new Set(['new', 'improved', 'fixed'])

const markdownComponents: Components = {
    code({children, className}) {
        if (typeof children === 'string' && REPO_LABELS.has(children)) {
            return <span className='patch-notes-tag'>{children}</span>
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
                        <Markdown components={markdownComponents}>{note.body}</Markdown>
                    </div>
                </article>
            ))}
        </div>
    )
}
