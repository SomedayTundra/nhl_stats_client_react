import {type ReactNode, useEffect} from 'react'
import {createPortal} from 'react-dom'
import {format, parseISO} from 'date-fns'
import {ChevronDown, ChevronUp} from 'lucide-react'

import {useJiraIssue} from '@/hooks/useJiraIssues.ts'
import {API_BASE_URL} from '@/lib/apiConfig.ts'
import {type JiraIssueRef, type JiraIssueSummary, type JiraStatus, type JiraUser, sanitizeJiraHtml} from '@/lib/jira.ts'

type JiraIssueOverlayProps = {
    issueKey: string
    // the issue's row from the list, if it has one - shown straight away so the header isn't blank while the full
    // detail loads
    listEntry?: JiraIssueSummary
    onClose: () => void
    // undefined when there's no issue in that direction, which disables the button
    onPrevious?: () => void
    onNext?: () => void
}

function formatTimestamp(iso: string | null) {
    return iso ? format(parseISO(iso), 'MMM d, yyyy h:mm a') : ''
}

export function JiraStatusPill({status}: { status: JiraStatus }) {
    return <span className='jira-status' data-category={status.category ?? undefined}>{status.name}</span>
}

// Jira's own icon for an issue type, proxied by the backend since Jira only serves it to a logged-in user. If it
// can't be loaded it just disappears, leaving the type's name to stand on its own.
export function JiraIssueTypeIcon({iconId, typeName}: { iconId: string | null, typeName: string | null }) {
    if (!iconId) {
        return null
    }
    return (
        <img
            src={`${API_BASE_URL}/jira/issuetype-icons/${iconId}`}
            alt=''
            title={typeName ?? undefined}
            className='inline-block h-4 w-4 shrink-0'
            onError={(event) => {
                event.currentTarget.style.display = 'none'
            }}
        />
    )
}

function UserChip({user}: { user: JiraUser | null }) {
    if (!user) {
        return <span className='text-muted-foreground'>Unassigned</span>
    }
    return (
        <span className='inline-flex items-center gap-2'>
            {user.avatarUrl && <img src={user.avatarUrl} alt='' className='h-6 w-6 rounded-full'/>}
            {user.displayName}
        </span>
    )
}

function IssueRefLine({issue}: { issue: JiraIssueRef }) {
    return (
        <span className='inline-flex items-center gap-2'>
            <span className='font-medium text-[var(--navbar-fg)]'>{issue.key}</span>
            <span>{issue.summary}</span>
            {issue.status && <JiraStatusPill status={issue.status}/>}
        </span>
    )
}

function DetailRow({label, children}: { label: string, children: ReactNode }) {
    return (
        <>
            <dt className='text-muted-foreground'>{label}</dt>
            <dd>{children}</dd>
        </>
    )
}

function listOrNone(values: string[]) {
    return values.length > 0 ? values.join(', ') : <span className='text-muted-foreground'>None</span>
}

// The detail view for one issue, laid over the list. Its only controls are previous/next; a click anywhere else -
// the backdrop or the panel itself - closes it, as does Escape. The one exception is a click that ends a text
// selection, so that text can be selected and copied out of the panel without it vanishing.
export default function JiraIssueOverlay({issueKey, listEntry, onClose, onPrevious, onNext}: JiraIssueOverlayProps) {
    const {data: detail, isPending, error} = useJiraIssue(issueKey)

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose()
            }
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [onClose])

    const handleClick = () => {
        if (window.getSelection()?.toString()) {
            return
        }
        onClose()
    }

    const navButton = (label: string, onStep: (() => void) | undefined, icon: ReactNode) => (
        <button
            type='button'
            aria-label={label}
            title={label}
            disabled={!onStep}
            onClick={(event) => {
                event.stopPropagation()
                onStep?.()
            }}
            className='jira-overlay-nav-button'
        >
            {icon}
        </button>
    )

    const header = detail ?? listEntry

    return createPortal(
        <div className='jira-overlay-backdrop' onClick={handleClick}>
            <div className='jira-overlay-panel' role='dialog' aria-modal='true' aria-label={issueKey}>
                <div className='flex shrink-0 items-center justify-between gap-4 border-b px-6 py-3'>
                    <span className='inline-flex items-center gap-2 text-sm text-muted-foreground'>
                        <JiraIssueTypeIcon iconId={header?.issueTypeIconId ?? null} typeName={header?.issueType ?? null}/>
                        {header?.issueType && `${header.issueType} / `}
                        <span className='font-medium text-[var(--navbar-fg)]'>{issueKey}</span>
                    </span>
                    <div className='flex items-center gap-1'>
                        {navButton('Previous issue', onPrevious, <ChevronUp className='h-5 w-5'/>)}
                        {navButton('Next issue', onNext, <ChevronDown className='h-5 w-5'/>)}
                    </div>
                </div>

                <div className='flex-1 min-h-0 overflow-y-auto px-6 py-5'>
                    {header?.summary && <h1 className='mb-5 text-2xl font-semibold text-[var(--text-h)]'>{header.summary}</h1>}

                    {error && <p>An error occurred: {error.message}</p>}
                    {isPending && !error && <p className='text-muted-foreground'>Loading...</p>}

                    {detail && (
                        <div className='grid gap-8 md:grid-cols-[minmax(0,1fr)_20rem]'>
                            <div className='flex flex-col gap-6 min-w-0'>
                                <section>
                                    <h2 className='jira-overlay-section-heading'>Description</h2>
                                    {detail.descriptionHtml
                                        ? <div className='jira-rich-text' dangerouslySetInnerHTML={{__html: sanitizeJiraHtml(detail.descriptionHtml)}}/>
                                        : <p className='text-muted-foreground'>No description</p>}
                                </section>

                                {detail.subtasks.length > 0 && (
                                    <section>
                                        <h2 className='jira-overlay-section-heading'>Subtasks</h2>
                                        <ul className='flex flex-col gap-1'>
                                            {detail.subtasks.map(subtask => <li key={subtask.key}><IssueRefLine issue={subtask}/></li>)}
                                        </ul>
                                    </section>
                                )}

                                {detail.links.length > 0 && (
                                    <section>
                                        <h2 className='jira-overlay-section-heading'>Linked work items</h2>
                                        <ul className='flex flex-col gap-1'>
                                            {detail.links.map(link => (
                                                <li key={`${link.relation}-${link.issue.key}`}>
                                                    <span className='mr-2 text-muted-foreground'>{link.relation}</span>
                                                    <IssueRefLine issue={link.issue}/>
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                )}

                                <section>
                                    <h2 className='jira-overlay-section-heading'>Comments ({detail.comments.length})</h2>
                                    {detail.comments.length === 0 && <p className='text-muted-foreground'>No comments</p>}
                                    <ol className='flex flex-col gap-4'>
                                        {detail.comments.map(comment => (
                                            <li key={comment.id} className='jira-comment'>
                                                <div className='mb-1 flex items-center gap-3 text-sm'>
                                                    <span className='font-medium'><UserChip user={comment.author}/></span>
                                                    <span className='text-muted-foreground'>{formatTimestamp(comment.created)}</span>
                                                </div>
                                                <div className='jira-rich-text' dangerouslySetInnerHTML={{__html: sanitizeJiraHtml(comment.bodyHtml)}}/>
                                            </li>
                                        ))}
                                    </ol>
                                </section>
                            </div>

                            <aside className='flex flex-col gap-3 self-start'>
                                {detail.status && <div><JiraStatusPill status={detail.status}/></div>}
                                <dl className='jira-overlay-details'>
                                    <DetailRow label='Assignee'><UserChip user={detail.assignee}/></DetailRow>
                                    <DetailRow label='Reporter'><UserChip user={detail.reporter}/></DetailRow>
                                    <DetailRow label='Priority'>{detail.priority ?? <span className='text-muted-foreground'>None</span>}</DetailRow>
                                    <DetailRow label='Labels'>{listOrNone(detail.labels)}</DetailRow>
                                    <DetailRow label='Components'>{listOrNone(detail.components)}</DetailRow>
                                    <DetailRow label='Fix versions'>{listOrNone(detail.fixVersions)}</DetailRow>
                                    <DetailRow label='Parent'>
                                        {detail.parent ? <IssueRefLine issue={detail.parent}/> : <span className='text-muted-foreground'>None</span>}
                                    </DetailRow>
                                </dl>
                                <div className='px-1 text-xs text-muted-foreground'>
                                    <div>Created {formatTimestamp(detail.created)}</div>
                                    <div>Updated {formatTimestamp(detail.updated)}</div>
                                    {detail.resolved && <div>Resolved {formatTimestamp(detail.resolved)}</div>}
                                </div>
                            </aside>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body,
    )
}
