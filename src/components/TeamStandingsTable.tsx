import * as React from 'react'
import 'react-calendar/dist/Calendar.css'
import type {TeamStatEntry} from '@/state/types'
import {DateContext} from '@/state/DateContext.tsx'
import DatePickerWithNav from '@/components/DatePickerWithNav.tsx'
import {SeasonSelect} from '@/components/SeasonSelect.tsx'
import TeamChooser from '@/components/TeamChooser.tsx'
import {deserializeDate, parseApiDate, serializeDate} from '@/lib/date.ts'
import {useLocalStorageState} from '@/lib/useLocalStorageState.ts'
import {useLatestSeasonId, useSeasonInfo} from '@/hooks/useSeasonInfo.ts'
import {useTeamStats} from '@/hooks/useTeamStats.ts'
import {getTeamLogoUrl} from '@/lib/teamLogo.ts'
import {
    createColumnHelper,
    createSortedRowModel,
    metaHelper,
    rowSortingFeature,
    sortFn_alphanumeric,
    tableFeatures,
    useTable,
    type SortingState,
} from '@tanstack/react-table'
import {cn} from '@/lib/utils.ts'

const CLASS_TD = 'p-2 align-middle'
const CLASS_TD_CENTER = `${CLASS_TD} text-center`
const CLASS_TH_LEFT = 'h-8 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground'
const CLASS_TH_CENTER = 'h-8 px-4 text-center align-middle font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground'

const features = tableFeatures({
    rowSortingFeature,
    sortedRowModel: createSortedRowModel(),
    sortFns: {alphanumeric: sortFn_alphanumeric},
    columnMeta: metaHelper<{align: 'left' | 'center'; cellClassName: string}>(),
})

const helper = createColumnHelper<typeof features, TeamStatEntry>()

const MISSING = '—'

// the last-10 record as wins-losses-(OT losses or ties), normally three numbers. Which of those
// two the third slot holds falls out of the era: pre-1999-2000 seasons have no OT losses, the
// post-lockout shootout era has no ties. `alwaysShowFour` is true for a season where the two ever
// overlapped for any team on any date (only possible 1999-2000 through 2003-04, the seasons where
// both existed) - every row in such a season gets all four numbers, even a row whose own OT losses
// or ties happens to be zero, so a team's format doesn't flip between three and four numbers as
// its last-10 window moves through the season
function formatLastTen({l10Wins, l10Losses, l10OtLosses, l10Ties}: TeamStatEntry, alwaysShowFour: boolean) {
    if (l10Wins == null || l10Losses == null || l10OtLosses == null || l10Ties == null) return null
    const record = alwaysShowFour
        ? `${l10Wins}-${l10Losses}-${l10OtLosses}-${l10Ties}`
        : `${l10Wins}-${l10Losses}-${l10Ties > 0 ? l10Ties : l10OtLosses}`
    return {
        record,
        breakdown: alwaysShowFour ? `${l10Wins}W ${l10Losses}L ${l10OtLosses}OTL ${l10Ties}T` : ''
    }
}

function buildColumns(alwaysShowFourL10: boolean) {
    return helper.columns([
        helper.accessor('teamName', {
            header: 'Team',
            sortFn: 'alphanumeric',
            sortDescFirst: false,
            meta: {align: 'left', cellClassName: 'flex items-center'},
            cell: (info) => (
                <>
                    <img className='h-[48px] w-[48px] align-middle justify-center' src={getTeamLogoUrl(info.row.original.logo, '2x')} alt='logo'/>
                    <p className={CLASS_TD}>{info.getValue()}</p>
                </>
            ),
        }),
        helper.accessor('wins', {header: 'Wins', meta: {align: 'center', cellClassName: CLASS_TD_CENTER}}),
        helper.accessor('losses', {header: 'Losses', meta: {align: 'center', cellClassName: CLASS_TD_CENTER}}),
        helper.accessor('otLosses', {header: 'OT Losses', meta: {align: 'center', cellClassName: CLASS_TD_CENTER}}),
        helper.accessor('points', {header: 'Points', meta: {align: 'center', cellClassName: CLASS_TD_CENTER}}),
        helper.accessor('goalsFor', {header: 'Goals For', meta: {align: 'center', cellClassName: CLASS_TD_CENTER}}),
        helper.accessor('goalsAgainst', {header: 'Goals Against', meta: {align: 'center', cellClassName: CLASS_TD_CENTER}}),
        helper.accessor('goalDiff', {header: 'Goal Diff', meta: {align: 'center', cellClassName: CLASS_TD_CENTER}}),
        // sorts on the wins of that record, the one number a "who's hot right now" sort wants
        helper.accessor('l10Wins', {
            header: 'Last 10',
            meta: {align: 'center', cellClassName: CLASS_TD_CENTER},
            cell: (info) => {
                const lastTen = formatLastTen(info.row.original, alwaysShowFourL10)
                return lastTen ? <span title={lastTen.breakdown}>{lastTen.record}</span> : MISSING
            },
        }),
        helper.accessor('l10GoalsFor', {
            header: 'Last 10 GF',
            meta: {align: 'center', cellClassName: CLASS_TD_CENTER},
            cell: (info) => info.getValue() ?? MISSING,
        }),
        helper.accessor('l10GoalsAgainst', {
            header: 'Last 10 GA',
            meta: {align: 'center', cellClassName: CLASS_TD_CENTER},
            cell: (info) => info.getValue() ?? MISSING,
        }),
        helper.accessor('l10GoalDiff', {
            header: 'Last 10 GDiff',
            meta: {align: 'center', cellClassName: CLASS_TD_CENTER},
            cell: (info) => info.getValue() ?? MISSING,
        }),
    ])
}

const EMPTY_DATA: TeamStatEntry[] = []

// a standings fetch still running past this is almost certainly the backend farming an uncached
// season from the NHL API (a normal cached fetch returns in well under a second), so we swap the
// table for a "loading uncached data" notice
const SLOW_FETCH_MS = 1500


export default function TeamStandingsTable() {
    const [date, setDate] = useLocalStorageState<Date>('nhlStats.table.date', new Date('2025-12-02'), {
        serialize: serializeDate,
        deserialize: deserializeDate,
    })
    const [selectedTeams, setSelectedTeams] = useLocalStorageState<string[]>('nhlStats.selectedTeams', [])    // NHL-49: have table, chart, and playoffs all sync to the same teams and season
    const [sorting, setSorting] = useLocalStorageState<SortingState>('nhlStats.table.sorting', [{id: 'points', desc: true}])

    // '' until we've resolved a default; persisted on every change (useLocalStorageState writes back)
    const [season, setSeason] = useLocalStorageState<string>('nhlStats.season', '') // NHL-49: have table, chart, and playoffs all sync to the same teams and season
    const defaultSeason = useLatestSeasonId()
    const resolvedSeason = season || defaultSeason
    const {data: selectedSeason} = useSeasonInfo(resolvedSeason || undefined)
    const columns = React.useMemo(
        () => buildColumns(selectedSeason?.l10OtAndTieOverlap ?? false),
        [selectedSeason?.l10OtAndTieOverlap],
    )

    const minDate = selectedSeason ? parseApiDate(selectedSeason.startDate) : undefined
    const maxDate = selectedSeason ? parseApiDate(selectedSeason.endDate) : undefined

    // when the selected season changes, default the picked date to the end of the new season.
    // Adjusted during render (React's recommended way to derive state from a changing value).
    const [clampedSeasonId, setClampedSeasonId] = React.useState<number | null>(null)
    if (selectedSeason && selectedSeason.seasonId !== clampedSeasonId) {
        setClampedSeasonId(selectedSeason.seasonId)
        setDate(parseApiDate(selectedSeason.endDate))
    }

    const handleDateSelect = (selected: Date | undefined) => {
        setDate(selected ?? new Date())
    }

    const dateContextValue = {
        date: date,
        setDate: handleDateSelect
    }

    const {data: teamStats, isPending, isFetching, error} = useTeamStats(date, date, resolvedSeason || undefined)

    // flip on once a fetch has been running longer than SLOW_FETCH_MS; reset the moment fetching
    // stops (adjust-state-during-render, so no synchronous setState inside an effect)
    const [fetchIsSlow, setFetchIsSlow] = React.useState(false)
    const [slowTrackedFetching, setSlowTrackedFetching] = React.useState(isFetching)
    if (slowTrackedFetching !== isFetching) {
        setSlowTrackedFetching(isFetching)
        if (!isFetching) {
            setFetchIsSlow(false)
        }
    }
    React.useEffect(() => {
        if (!isFetching) return
        const timer = window.setTimeout(() => setFetchIsSlow(true), SLOW_FETCH_MS)
        return () => window.clearTimeout(timer)
    }, [isFetching])

    // this method filters the team stats down to the teams currently selected in the TeamChooser;
    // an empty selection is handled separately, in `tableBody`, before this is ever used
    const filteredTeamStats = (teamStats ?? EMPTY_DATA).filter((teamStat) =>
        selectedTeams.includes(teamStat.teamAbbrev)
    )

    const table = useTable({
        features,
        columns,
        data: filteredTeamStats,
        getRowId: (row) => `${row.date}_${row.teamName}`,
        state: {sorting},
        onSortingChange: setSorting,
        sortDescFirst: true,
        enableMultiSort: false,
        enableSortingRemoval: false,
    })

    // the table body alone reflects loading/error/selection state; the controls above it stay
    // mounted regardless, so TeamChooser never remounts (and loses its committed selection) on refetch
    let tableBody: React.ReactNode
    if (selectedTeams.length === 0) {
        tableBody = <tr><td colSpan={columns.length} className='p-4 text-center'>No teams selected</td></tr>
    } else if (fetchIsSlow) {
        tableBody = <tr><td colSpan={columns.length} className='p-4 text-center'>Loading uncached data...</td></tr>
    } else if (isPending) {
        tableBody = <tr><td colSpan={columns.length} className='p-4 text-center'>Loading...</td></tr>
    } else if (error) {
        tableBody = <tr><td colSpan={columns.length} className='p-4 text-center'>An error occurred: {error.message}</td></tr>
    } else {
        tableBody = table.getRowModel().rows.map((row) => (
            <tr key={row.id} className='p-0 transition-colors hover:bg-muted data-[state=selected]:bg-muted'>
                {row.getAllCells().map((cell) => (
                    <td key={cell.id} className={cn("cursor-default", cell.column.columnDef.meta?.cellClassName ?? CLASS_TD)}>
                        <table.FlexRender cell={cell}/>
                    </td>
                ))}
            </tr>
        ))
    }

    return (
        <DateContext value={dateContextValue}>
            <div className='w-full flex flex-row items-center gap-4 py-2 top-controls-container'>
                <SeasonSelect value={resolvedSeason} onChange={setSeason}/>
                <div className='flex justify-start items-center'>
                    <DatePickerWithNav id="date-picker" label="Date" tooltip="Date" minDate={minDate} maxDate={maxDate}/>
                </div>
                <div className='flex justify-start'>
                    <TeamChooser season={resolvedSeason} selected={selectedTeams} onChange={setSelectedTeams}/>
                </div>
            </div>
            <div className='w-full border rounded-lg overflow-hidden'>
                <div className='relative w-full overflow-auto'>
                    <table className='w-full caption-bottom text-sm'>
                        <thead className='[&amp;_tr]:border-b'>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id} className='border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'>
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        className={header.column.columnDef.meta?.align === 'left' ? CLASS_TH_LEFT : CLASS_TH_CENTER}
                                        onClick={header.column.getToggleSortingHandler()}
                                    >
                                        {!header.isPlaceholder && <table.FlexRender header={header}/>}
                                        {header.column.getIsSorted() === 'asc' ? ' ▲' : header.column.getIsSorted() === 'desc' ? ' ▼' : null}
                                    </th>
                                ))}
                            </tr>
                        ))}
                        </thead>
                        <tbody className='[&amp;_tr:last-child]:border-0'>
                        {tableBody}
                        </tbody>
                    </table>
                </div>
            </div>
        </DateContext>
    )
}