import {type ReactNode, useEffect} from 'react'
import {useNavigate, useSearch} from '@tanstack/react-router'
import {useQueryClient} from '@tanstack/react-query'
import {
    createColumnHelper,
    createSortedRowModel,
    rowSortingFeature,
    sortFn_alphanumeric,
    sortFn_basic,
    tableFeatures,
    useTable,
    type SortingState,
} from '@tanstack/react-table'
import {format, parseISO} from 'date-fns'

import JiraIssueOverlay, {JiraIssueTypeIcon, JiraStatusPill} from '@/components/JiraIssueOverlay.tsx'
import {JiraStatusSelect} from '@/components/JiraStatusSelect.tsx'
import {jiraIssueQueryOptions, useJiraIssues, useJiraStatuses} from '@/hooks/useJiraIssues.ts'
import {compareStatuses, distinctStatuses, type JiraIssueSummary, type JiraStatus, priorityRank} from '@/lib/jira.ts'
import {useLocalStorageState} from '@/lib/useLocalStorageState.ts'
import {cn} from '@/lib/utils.ts'

const ALL_STATUSES = '__all__'

const CLASS_TH = 'h-8 px-4 text-left align-middle font-semibold text-[var(--table-header-fg)] cursor-pointer select-none hover:text-[var(--text-h)]'
const CLASS_TD = 'px-4 py-2 text-left align-middle'

const features = tableFeatures({
    rowSortingFeature,
    sortedRowModel: createSortedRowModel(),
    sortFns: {alphanumeric: sortFn_alphanumeric, basic: sortFn_basic},
})

const helper = createColumnHelper<typeof features, JiraIssueSummary>()

// a missing status sorts after every real one
const NO_STATUS: JiraStatus = {name: '￿', category: null}

const columns = helper.columns([
    // by issue number, so NHL-9 sorts before NHL-10
    helper.accessor(issue => Number(issue.key.split('-')[1]), {
        id: 'key',
        header: 'Key',
        sortFn: 'basic',
        sortDescFirst: true,
        cell: info => <span className='font-medium whitespace-nowrap text-(--navbar-fg)'>{info.row.original.key}</span>,
    }),
    helper.accessor(issue => issue.summary ?? '', {
        id: 'summary',
        header: 'Summary',
        sortFn: 'alphanumeric',
        cell: info => (
            <span className='inline-flex items-center gap-2'>
                <JiraIssueTypeIcon iconId={info.row.original.issueTypeIconId} typeName={info.row.original.issueType}/>
                {info.getValue()}
            </span>
        ),
    }),
    // in workflow order (to do -> in progress -> done) rather than alphabetically
    helper.accessor(issue => issue.status, {
        id: 'status',
        header: 'Status',
        sortFn: (rowA, rowB) => compareStatuses(rowA.original.status ?? NO_STATUS, rowB.original.status ?? NO_STATUS),
        // the table defaults non-string columns to descending first; a first click should read to do -> done
        sortDescFirst: false,
        cell: info => {
            const status = info.getValue()
            return status && <JiraStatusPill status={status}/>
        },
    }),
    helper.accessor(issue => issue.issueType ?? '', {
        id: 'type',
        header: 'Type',
        sortFn: 'alphanumeric',
        cell: info => (
            <span className='inline-flex items-center gap-2'>
                <JiraIssueTypeIcon iconId={info.row.original.issueTypeIconId} typeName={info.row.original.issueType}/>
                {info.getValue()}
            </span>
        ),
    }),
    // by rank (Highest -> Lowest), so ascending reads most important first
    helper.accessor(issue => priorityRank(issue.priority), {
        id: 'priority',
        header: 'Priority',
        sortFn: 'basic',
        sortDescFirst: false,
        cell: info => info.row.original.priority,
    }),
    helper.accessor(issue => issue.updated ? parseISO(issue.updated).getTime() : 0, {
        id: 'updated',
        header: 'Updated',
        sortFn: 'basic',
        sortDescFirst: true,
        cell: info => info.row.original.updated && format(parseISO(info.row.original.updated), 'MMM d, yyyy'),
    }),
])

const EMPTY_ISSUES: JiraIssueSummary[] = []

// A read-only window onto the NHL Stats Jira space, served through the backend's /api/jira proxy (the Jira token
// lives there, never in this bundle). Clicking a row opens that issue in JiraIssueOverlay; the open issue's key is
// carried in the URL (?issue=NHL-86) so an open issue can be linked to directly.
export default function JiraIssues() {
    const {data: issues, isPending, error} = useJiraIssues()
    const {data: workflowStatuses} = useJiraStatuses()
    const [statusFilter, setStatusFilter] = useLocalStorageState<string>('nhlStats.jira.status', ALL_STATUSES)
    const [sorting, setSorting] = useLocalStorageState<SortingState>('nhlStats.jira.sorting', [{id: 'updated', desc: true}])

    const {issue: selectedKey} = useSearch({strict: false})
    const navigate = useNavigate()
    const selectIssue = (key: string | undefined) => navigate({to: '/jira', search: {issue: key}, replace: true})

    // every status the workflow defines, so an empty one still shows with a zero count, plus any status an issue is
    // in that the workflow lookup didn't return (or hasn't returned yet)
    const allIssues = issues ?? EMPTY_ISSUES
    const statuses = distinctStatuses([...(workflowStatuses ?? []), ...allIssues.map(issue => issue.status)])
    // a remembered status that no longer exists (renamed or removed from the workflow) shows everything instead
    const resolvedFilter = statuses.some(s => s.name === statusFilter) ? statusFilter : ALL_STATUSES
    const filteredIssues = allIssues.filter(issue => resolvedFilter === ALL_STATUSES || issue.status?.name === resolvedFilter)

    const statusOptions = [
        {value: ALL_STATUSES, label: `All statuses (${allIssues.length})`},
        ...statuses.map(status => ({
            value: status.name,
            label: `${status.name} (${allIssues.filter(issue => issue.status?.name === status.name).length})`,
        })),
    ]

    const table = useTable({
        features,
        columns,
        data: filteredIssues,
        getRowId: issue => issue.key,
        state: {sorting},
        onSortingChange: setSorting,
        enableMultiSort: false,
        enableSortingRemoval: false,
    })
    const rows = table.getRowModel().rows

    // prev/next walk the list exactly as it's currently shown - filtered and sorted; an issue opened from a link that
    // the filter hides has no place in that list, so it gets neither
    const selectedIndex = rows.findIndex(row => row.original.key === selectedKey)
    const previousKey = selectedIndex > 0 ? rows[selectedIndex - 1].original.key : undefined
    const nextKey = selectedIndex >= 0 && selectedIndex < rows.length - 1 ? rows[selectedIndex + 1].original.key : undefined

    // warm the neighbours so stepping through issues doesn't wait on Jira each time
    const queryClient = useQueryClient()
    useEffect(() => {
        for (const key of [previousKey, nextKey]) {
            if (key) {
                void queryClient.prefetchQuery(jiraIssueQueryOptions(key))
            }
        }
    }, [queryClient, previousKey, nextKey])

    let tableBody: ReactNode
    if (isPending) {
        tableBody = <tr><td colSpan={columns.length} className='p-4 text-center'>Loading...</td></tr>
    } else if (error) {
        tableBody = <tr><td colSpan={columns.length} className='p-4 text-center'>An error occurred: {error.message}</td></tr>
    } else if (rows.length === 0) {
        tableBody = <tr><td colSpan={columns.length} className='p-4 text-center'>No issues</td></tr>
    } else {
        tableBody = rows.map(row => (
            <tr
                key={row.id}
                onClick={() => selectIssue(row.original.key)}
                className={cn('cursor-pointer border-t transition-colors hover:bg-muted', row.original.key === selectedKey && 'bg-muted')}
            >
                {row.getAllCells().map(cell => (
                    <td key={cell.id} className={cn(CLASS_TD, cell.column.id !== 'summary' && 'whitespace-nowrap')}>
                        <table.FlexRender cell={cell}/>
                    </td>
                ))}
            </tr>
        ))
    }

    return (
        <div className='h-full flex flex-col'>
            <div className='top-controls-container shrink-0 w-full flex flex-row items-center gap-4 py-2 px-4'>
                <JiraStatusSelect options={statusOptions} value={resolvedFilter} onChange={setStatusFilter}/>
            </div>
            <div className='border rounded-lg overflow-hidden mx-4 mb-4 flex-1 min-h-0 flex flex-col'>
                <div className='relative w-full overflow-auto flex-1 min-h-0'>
                    <table className='w-full text-sm'>
                        <thead className='sticky top-0 bg-(--table-header-bg)'>
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <th key={header.id} className={CLASS_TH} onClick={header.column.getToggleSortingHandler()}>
                                        {!header.isPlaceholder && <table.FlexRender header={header}/>}
                                        {header.column.getIsSorted() === 'asc' ? ' ▲' : header.column.getIsSorted() === 'desc' ? ' ▼' : null}
                                    </th>
                                ))}
                            </tr>
                        ))}
                        </thead>
                        <tbody>{tableBody}</tbody>
                    </table>
                </div>
            </div>
            {selectedKey && (
                <JiraIssueOverlay
                    issueKey={selectedKey}
                    listEntry={allIssues.find(issue => issue.key === selectedKey)}
                    onClose={() => selectIssue(undefined)}
                    onPrevious={previousKey ? () => selectIssue(previousKey) : undefined}
                    onNext={nextKey ? () => selectIssue(nextKey) : undefined}
                />
            )}
        </div>
    )
}
