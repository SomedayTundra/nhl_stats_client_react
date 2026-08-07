import * as React from 'react'
import '@wojtekmaj/react-daterange-picker/dist/DateRangePicker.css'
import 'react-calendar/dist/Calendar.css'
import type TeamStatEntry from '@/components/TeamStatEntry.tsx'
import type {OnSelectHandler} from 'react-day-picker'
import {DateContext} from '@/state/DateContext.tsx'
import DatePicker from '@/components/DatePicker.tsx'
import TeamChooser from '@/components/TeamChooser.tsx'
import {useQuery} from '@tanstack/react-query'
import {formatDateForApi} from '@/lib/date.ts'

const SERVER = 'localhost:8000'

const CLASS_TD = 'p-2 align-middle'
const CLASS_TD_CENTER = `${CLASS_TD} text-center`

type SortKey = 'teamName' | 'wins' | 'losses' | 'otLosses' | 'points' | 'goalsFor' | 'goalsAgainst' | 'goalDiff';
type SortDirection = 'asc' | 'desc';

const COLUMNS: { key: SortKey; label: string; align: 'left' | 'center' }[] = [
    {key: 'teamName', label: 'Team', align: 'left'},
    {key: 'wins', label: 'Wins', align: 'center'},
    {key: 'losses', label: 'Losses', align: 'center'},
    {key: 'otLosses', label: 'OT Losses', align: 'center'},
    {key: 'points', label: 'Points', align: 'center'},
    {key: 'goalsFor', label: 'Goals For', align: 'center'},
    {key: 'goalsAgainst', label: 'Goals Against', align: 'center'},
    {key: 'goalDiff', label: 'Goal Diff', align: 'center'},
]


const TeamStat: React.FC<TeamStatEntry> = ({goalDiff, goalsAgainst, goalsFor, logo, losses, teamName, otLosses, points, wins}: TeamStatEntry) => (
    <tr className='p-0 transition-colors data-[state=selected]:bg-muted'>
        <td className={`flex`}>
            <img className='h-[48px] w-[48px] align-middle justify-center' src={`http://localhost:8000/api/nhl_team_info/logo?logo_filename=${logo}`} alt='logo'></img>
            <p className={CLASS_TD}>{teamName}</p>
        </td>
        <td className={CLASS_TD_CENTER}>{wins}</td>
        <td className={CLASS_TD_CENTER}>{losses}</td>
        <td className={CLASS_TD_CENTER}>{otLosses}</td>
        <td className={CLASS_TD_CENTER}>{points}</td>
        <td className={CLASS_TD_CENTER}>{goalsFor}</td>
        <td className={CLASS_TD_CENTER}>{goalsAgainst}</td>
        <td className={CLASS_TD_CENTER}>{goalDiff}</td>
    </tr>
)


export default function TeamStandingsTable() {
    // const [teamStats, setTeamStats] = useState<TeamStatEntry[]>([]);
    const [date, setDate] = React.useState<Date>(new Date('2025-12-02'))
    const [selectedTeams, setSelectedTeams] = React.useState<string[]>([])
    const [sortKey, setSortKey] = React.useState<SortKey | null>('points')
    const [sortDirection, setSortDirection] = React.useState<SortDirection>('desc')

    function handleSort(key: SortKey) {
        if (sortKey === key) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
        } else {
            setSortKey(key)
            setSortDirection('asc')
        }
    }

    const handleDateSelect: OnSelectHandler<Date | undefined> = (selected) => {
        setDate(selected ?? new Date())
    }

    const dateContextValue = {
        date: date,
        setDate: handleDateSelect
    }

    // this method fetches the NHL stats from the database.
    const {data: teamStats, isPending, error} = useQuery<TeamStatEntry[]>({
        queryKey: ['teamStats', dateContextValue.date],
        queryFn: async () => {
            const prettyDate: string = formatDateForApi(date)

            const response = await fetch(`http://${SERVER}/api/nhl_standings/?start_date=${prettyDate}&end_date=${prettyDate}`)
            if (!response.ok) {
                throw new Error(`An error occurred: ${response.statusText}`)
            }
            return (await response.json()) as TeamStatEntry[]
        }
    })

    // this method filters the team stats down to the teams currently selected in the TeamChooser
    // (an empty selection is treated as "no filter applied yet" rather than "show nothing")
    function visibleTeamStats(allTeamStats: TeamStatEntry[]): TeamStatEntry[] {
        if (selectedTeams.length === 0) return allTeamStats
        return allTeamStats.filter((teamStat) => selectedTeams.includes(teamStat.teamAbbrev))
    }

    // this method sorts the team stats by the currently selected column, if any
    function sortedTeamStats(allTeamStats: TeamStatEntry[]): TeamStatEntry[] {
        const visible = visibleTeamStats(allTeamStats)
        if (!sortKey) return visible

        const sorted = [...visible].sort((a: TeamStatEntry, b: TeamStatEntry) => {
            const aValue = a[sortKey]
            const bValue = b[sortKey]

            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return aValue - bValue
            }
            return String(aValue).localeCompare(String(bValue))
        })

        return sortDirection === 'asc' ? sorted : sorted.reverse()
    }

    // this method will map out the team stats on the table
    function teamStatsList(allTeamStats: TeamStatEntry[]) {
        return sortedTeamStats(allTeamStats).map((teamStat: TeamStatEntry) => {
            console.debug(teamStat)
            const id_key = teamStat.date + '_' + teamStat.teamName
            return (
                <TeamStat
                    date={teamStat.date}
                    goalDiff={teamStat.goalDiff}
                    goalsAgainst={teamStat.goalsAgainst}
                    goalsFor={teamStat.goalsFor}
                    logo={teamStat.logo}
                    losses={teamStat.losses}
                    teamName={teamStat.teamName}
                    teamCommonName={teamStat.teamCommonName}
                    teamAbbrev={teamStat.teamAbbrev}
                    otLosses={teamStat.otLosses}
                    points={teamStat.points}
                    wins={teamStat.wins}
                    key={id_key}
                />
            )
        })
    }

    // this following section will display the table with the team standings stats
    const CLASS_TH_LEFT = 'h-12 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground'
    const CLASS_TH_CENTER = 'h-12 px-4 text-center align-middle font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground'

    function sortIndicator(key: SortKey) {
        if (sortKey !== key) return null
        return sortDirection === 'asc' ? ' ▲' : ' ▼'
    }

    // the table body alone reflects loading/error state; the controls above it stay mounted
    // regardless, so TeamChooser never remounts (and loses its committed selection) on refetch
    let tableBody: React.ReactNode
    if (isPending) {
        tableBody = <tr><td colSpan={COLUMNS.length} className='p-4 text-center'>Loading...</td></tr>
    } else if (error) {
        tableBody = <tr><td colSpan={COLUMNS.length} className='p-4 text-center'>An error occurred: {error.message}</td></tr>
    } else {
        tableBody = teamStatsList(teamStats)
    }

    return (
        <DateContext value={dateContextValue}>
            <div className='w-9/12 mx-auto flex flex-row items-center gap-4 top-controls-container'>
                <div className='flex justify-start'>
                    <DatePicker/>
                </div>
                <div className='flex justify-start'>
                    <TeamChooser selected={selectedTeams} onChange={setSelectedTeams}/>
                </div>
            </div>
            <div className='w-9/12 mx-auto border rounded-lg overflow-hidden'>
                <div className='relative w-full overflow-auto'>
                    <table className='w-full caption-bottom text-sm'>
                        <thead className='[&amp;_tr]:border-b'>
                        <tr className='border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'>
                            {COLUMNS.map((column) => (
                                <th
                                    key={column.key}
                                    className={column.align === 'left' ? CLASS_TH_LEFT : CLASS_TH_CENTER}
                                    onClick={() => handleSort(column.key)}
                                >
                                    {column.label}{sortIndicator(column.key)}
                                </th>
                            ))}
                        </tr>
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