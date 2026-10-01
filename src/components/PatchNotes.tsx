import Markdown from 'react-markdown'
import {formatApiDateForDisplay} from '@/lib/date.ts'
import {patchNotes} from '@/lib/patchNotes.ts'

// One card per published release, newest first. The notes are bundled at build time (see
// patchNotes.ts), so there's nothing to fetch and nothing that can fail to load.
export default function PatchNotes() {
    return (
        <div className='patch-notes mx-auto max-w-3xl px-4 py-6 flex flex-col gap-6'>
            <h1 className='patch-notes-heading'>Patch Notes</h1>
            {patchNotes.length === 0 && <p>No patch notes have been published yet.</p>}
            {patchNotes.map(note => (
                <article key={note.id} className='patch-notes-release'>
                    <header className='patch-notes-release-header'>
                        <h2>{note.title}</h2>
                        <time dateTime={note.date}>{formatApiDateForDisplay(note.date)}</time>
                    </header>
                    <div className='patch-notes-body'>
                        <Markdown>{note.body}</Markdown>
                    </div>
                </article>
            ))}
        </div>
    )
}
