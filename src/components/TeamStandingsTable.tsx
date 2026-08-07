import * as React from 'react'
import '@wojtekmaj/react-daterange-picker/dist/DateRangePicker.css'
import 'react-calendar/dist/Calendar.css'
import type TeamStatEntry from '@/components/TeamStatEntry.tsx'

// FIXME: sort out what isn't configured properly so i can stop ignoring the
//        'cannot find module react-calender/dist/shared/types' error that
//        IDEA is giving me, even though the code itself *can* find that module
// @ts-ignore
import type {Value} from 'react-calendar/dist/shared/types'
import type {OnSelectHandler} from 'react-day-picker'
import {DateContext} from '@/state/DateContext.tsx'
import DatePicker from '@/components/DatePicker.tsx'
import {useQuery} from '@tanstack/react-query'

const SERVER = 'localhost:8000'

const CLASS_TD = "p-4 align-middle"
const CLASS_TD_LEFT = `${CLASS_TD} text-left`;
const CLASS_TD_CENTER = `${CLASS_TD} text-center`;

type SortKey = 'teamName' | 'wins' | 'losses' | 'otLosses' | 'points' | 'goalsFor' | 'goalsAgainst' | 'goalDiff';
type SortDirection = 'asc' | 'desc';

const COLUMNS: {key: SortKey; label: string; align: 'left' | 'center'}[] = [
    {key: 'teamName', label: 'Team', align: 'left'},
    {key: 'wins', label: 'Wins', align: 'center'},
    {key: 'losses', label: 'Losses', align: 'center'},
    {key: 'otLosses', label: 'OT Losses', align: 'center'},
    {key: 'points', label: 'Points', align: 'center'},
    {key: 'goalsFor', label: 'Goals For', align: 'center'},
    {key: 'goalsAgainst', label: 'Goals Against', align: 'center'},
    {key: 'goalDiff', label: 'Goal Diff', align: 'center'},
];


const TeamStat: React.FC<TeamStatEntry> = ({goalDiff, goalsAgainst, goalsFor, logo, losses, teamName, teamCommonName, teamAbbrev, otLosses, points, wins}: TeamStatEntry) => (
    <tr className="p-0 transition-colors data-[state=selected]:bg-muted">
        <td className={`flex`}>
            <img className="h-16 w-16 align-middle justify-center" src={`http://localhost:8000/api/nhl_team_info/logo?logo_filename=${logo}`} alt="logo"></img>
            <p className={CLASS_TD}>{teamName} ({teamCommonName}) [{teamAbbrev}]</p>
        </td>
        <td className={CLASS_TD_CENTER}>{wins}</td>
        <td className={CLASS_TD_CENTER}>{losses}</td>
        <td className={CLASS_TD_CENTER}>{otLosses}</td>
        <td className={CLASS_TD_CENTER}>{points}</td>
        <td className={CLASS_TD_CENTER}>{goalsFor}</td>
        <td className={CLASS_TD_CENTER}>{goalsAgainst}</td>
        <td className={CLASS_TD_CENTER}>{goalDiff}</td>
    </tr>
);


export default function TeamStandingsTable() {
    // const [teamStats, setTeamStats] = useState<TeamStatEntry[]>([]);
    const [date, setDate] = React.useState<Date>(new Date('2025-12-02'))
    const [sortKey, setSortKey] = React.useState<SortKey | null>(null);
    const [sortDirection, setSortDirection] = React.useState<SortDirection>('asc');

    function handleSort(key: SortKey) {
        if (sortKey === key) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    }

    const handleDateSelect: OnSelectHandler<Date | undefined> = (selected) => {
        setDate(selected ?? new Date());
    };

    const dateContextValue = {
        date: date,
        setDate: handleDateSelect
    };

    // this method fetches the NHL stats from the database.
    const {data: teamStats, isPending, error} = useQuery<TeamStatEntry[]>({
        queryKey: ['teamStats', dateContextValue.date],
        queryFn: async() => {
            const prettyDate: string|undefined = changeDateToMyPreferredStringFormat(date);

            const response = await fetch(`http://${SERVER}/api/nhl_standings/?start_date=${prettyDate}&end_date=${prettyDate}`);
            if (!response.ok) {
                throw new Error(`An error occurred: ${response.statusText}`);
            }
            return (await response.json()) as TeamStatEntry[];
        }
    })

    if(isPending) return 'Loading...'

    if(error) return 'An error occurred: ' + error.message

    // this method sorts the team stats by the currently selected column, if any
    function sortedTeamStats(): TeamStatEntry[] {
        if (!sortKey) return teamStats;

        const sorted = [...teamStats].sort((a: TeamStatEntry, b: TeamStatEntry) => {
            const aValue = a[sortKey];
            const bValue = b[sortKey];

            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return aValue - bValue;
            }
            return String(aValue).localeCompare(String(bValue));
        });

        return sortDirection === 'asc' ? sorted : sorted.reverse();
    }

    // this method will map out the team stats on the table
    function teamStatsList() {
        return sortedTeamStats().map((teamStat: TeamStatEntry) => {
            console.debug(teamStat);
            const id_key = teamStat.date + '_' + teamStat.teamName;
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
            );
        });
    }

    function changeDateToMyPreferredStringFormat(originalDate: Date) {
        function join(date: Date, options: any[], separator: string) {
            function format(option: Intl.DateTimeFormatOptions | undefined) {
                let formatter = new Intl.DateTimeFormat('en', option);
                return formatter.format(date);
            }

            return options.map(format).join(separator);
        }

        if (originalDate === null) {
            return;
        }

        const options = [{year: 'numeric'}, {month: '2-digit'}, {day: '2-digit'}];
        return join(originalDate, options, '-');
    }

    // @ts-ignore
    function ShowToast(msg: String) {
        return (
            <div className="grid grid-cols-2 w-full">
                <h3 className="text-zinc-800 text-sm font-bold col-span-2">{msg}</h3>
            </div>
        );
    }

    // this following section will display the table with the team standings stats
    const CLASS_TH_LEFT = "h-12 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground";
    const CLASS_TH_CENTER = "h-12 px-4 text-center align-middle font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground";

    function sortIndicator(key: SortKey) {
        if (sortKey !== key) return null;
        return sortDirection === 'asc' ? ' ▲' : ' ▼';
    }

    return (
        <DateContext value={dateContextValue}>
            <div className="flex justify-start">
                <DatePicker/>
            </div>
            <div className="border rounded-lg overflow-hidden">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&amp;_tr]:border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
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
                        <tbody className="[&amp;_tr:last-child]:border-0">
                        {teamStatsList()}
                        </tbody>
                    </table>
                </div>
            </div>
        </DateContext>
    );
}