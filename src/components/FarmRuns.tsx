import type {ReactNode} from 'react'
import {format, parseISO} from 'date-fns'

import {type FarmRun, useFarmRuns} from '@/hooks/useFarmRuns.ts'
import {cn} from '@/lib/utils.ts'

const CLASS_TH = 'h-8 px-4 text-left align-middle font-semibold hover:bg-accent hover:text-accent-foreground whitespace-nowrap'
const CLASS_TD = 'px-4 py-2 text-left align-middle whitespace-nowrap'

const formatTime = (iso: string | null) => iso ? format(parseISO(iso), 'MMM d, yyyy h:mm:ss a') : '—'

// "20242025" -> "2024-25"
const formatSeason = (seasonId: number | null) => {
    if (seasonId === null) {
        return 'Current'
    }
    const id = String(seasonId)
    return `${id.slice(0, 4)}-${id.slice(6)}`
}

const columns: { header: string, cell: (run: FarmRun) => ReactNode, align?: 'right' }[] = [
    {header: 'Started', cell: run => formatTime(run.startedAt)},
    {header: 'Ended', cell: run => formatTime(run.endedAt)},
    // the server rounds to tenths; toFixed(1) shows a whole number as 5.0 so the column's decimals line up
    {header: 'Duration', cell: run => run.durationS === null ? '—' : `${run.durationS.toFixed(1)}s`, align: 'right'},
    {
        header: 'Status',
        cell: run => (
            <span className={cn(run.status && run.status !== 'success' && 'text-destructive')}>{run.status ?? '—'}</span>
        ),
    },
    {header: 'Trigger', cell: run => run.trigger ?? '—'},
    {header: 'Triggered By', cell: run => run.triggeredBy ?? '—'},
    {header: 'Season', cell: run => formatSeason(run.seasonArg)},
    {header: 'GitHub Actor', cell: run => run.githubActor ?? '—'},
    {
        header: 'GitHub Run',
        cell: run => run.githubRunUrl
            ? <a href={run.githubRunUrl} target='_blank' rel='noreferrer' className='underline text-st-accent'>{run.githubRunId ?? 'run'}</a>
            : '—',
    },
]

// the server's most recent update_mongodb.py runs (as many as its FARM_RUNS_TO_KEEP), newest first - the server
// already returns them in that order
export default function FarmRuns() {
    const {data, isPending, error} = useFarmRuns()
    const runs = data?.runs ?? []

    let tableBody: ReactNode
    if (isPending) {
        tableBody = <tr><td colSpan={columns.length} className='p-4 text-center'>Loading...</td></tr>
    } else if (error) {
        tableBody = <tr><td colSpan={columns.length} className='p-4 text-center'>An error occurred: {error.message}</td></tr>
    } else if (runs.length === 0) {
        tableBody = <tr><td colSpan={columns.length} className='p-4 text-center'>No farm runs recorded</td></tr>
    } else {
        tableBody = runs.map(run => (
            <tr key={`${run.startedAt}-${run.githubRunId ?? ''}`} className='border-t border-row-number'>
                {columns.map(column => <td key={column.header} className={cn(CLASS_TD, column.align === 'right' && 'text-right')}>{column.cell(run)}</td>)}
            </tr>
        ))
    }

    return (
        <div className='h-full flex flex-col'>
            {data && <div className='shrink-0 py-3 px-4'>These are the {data.farmRunsToKeep} most recent data farming runs.</div>}
            <div className='border rounded-lg overflow-hidden mx-4 mb-4 flex-1 min-h-0 flex flex-col'>
                <div className='relative w-full overflow-auto flex-1 min-h-0'>
                    <table className='w-full text-sm'>
                        <thead className='sticky top-0 bg-(--table-header-bg)'>
                        <tr>{columns.map(column => <th key={column.header} className={cn(CLASS_TH, column.align === 'right' && 'text-right')}>{column.header}</th>)}</tr>
                        </thead>
                        <tbody>{tableBody}</tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
