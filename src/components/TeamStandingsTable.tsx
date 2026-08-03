import * as React from 'react'
import '@wojtekmaj/react-daterange-picker/dist/DateRangePicker.css'
import 'react-calendar/dist/Calendar.css'
import type TeamStatEntry from '@/components/TeamStatEntry.tsx'

// FIXME: sort out what isn't configured properly so i can stop ignoring the
//        'cannot find module react-calender/dist/shared/types' error that
//        IDEA is giving me, even though the code itself *can* find that module
// @ts-ignore
import type {Value} from 'react-calendar/dist/shared/types'
import type {DateRange, OnSelectHandler} from 'react-day-picker'
import {DateRangeContext} from '@/state/DateRangeContext.tsx'
import DatePickerWithRange from '@/components/DatePickerWithRange.tsx'
import {useQuery} from '@tanstack/react-query'

const SERVER = 'localhost:8000'

const CLASS_TD = "p-4 align-middle"
const CLASS_TD_LEFT = `${CLASS_TD} text-left`;
const CLASS_TD_CENTER = `${CLASS_TD} text-center`;


const TeamStat: React.FC<TeamStatEntry> = ({date, goalDiff, goalsAgainst, goalsFor, logo, losses, teamName, teamCommonName, teamAbbrev, otLosses, points, wins}: TeamStatEntry) => (
    <tr className="p-0 transition-colors data-[state=selected]:bg-muted">
        <td className={CLASS_TD_LEFT}>{date}</td>
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
    const [date, setDate] = React.useState<DateRange>({from: new Date('2025-12-02'), to: new Date('2025-12-02')})

    const handleDateSelect: OnSelectHandler<DateRange> = (selected) => {
        if(selected === undefined) {
            selected = {
                from: new Date(),
                to: new Date(),
            }
        }

        if(selected.from === undefined) {
            selected.from = new Date();
        }

        if(selected.to === undefined) {
            selected.to = new Date();
        }

        setDate(selected);
    };

    const dateRangeContextValue = {
        dateRange: date,
        setDateRange: handleDateSelect
    };

    // this method fetches the NHL stats from the database.
    const {data: teamStats, isPending, error} = useQuery({
        queryKey: ['teamStats', dateRangeContextValue.dateRange],
        queryFn: async() => {
            const prettyStartDate: string|undefined = changeDateToMyPreferredStringFormat(date.from as Date);
            const prettyEndDate: string|undefined = changeDateToMyPreferredStringFormat(date.to as Date);

            const response = await fetch(`http://${SERVER}/api/nhl_standings/?start_date=${prettyStartDate}&end_date=${prettyEndDate}`);
            return await response.json();
        }
    })

    if(isPending) return 'Loading...'

    if(error) return 'An error occurred: ' + error.message

    // this method will map out the team stats on the table
    function teamStatsList() {
        return teamStats.map((teamStat: TeamStatEntry) => {
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
    const CLASS_TH_LEFT = "h-12 px-4 text-left align-middle font-medium text-muted-foreground";
    const CLASS_TH_CENTER = "h-12 px-4 text-center align-middle font-medium text-muted-foreground";

    return (
        <DateRangeContext value={dateRangeContextValue}>
            <div className="flex justify-start">
                <DatePickerWithRange/>
            </div>
            <div className="border rounded-lg overflow-hidden">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&amp;_tr]:border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <th className={CLASS_TH_LEFT}>Date</th>
                            <th className={CLASS_TH_LEFT}>Team</th>
                            <th className={CLASS_TH_CENTER}>Wins</th>
                            <th className={CLASS_TH_CENTER}>Losses</th>
                            <th className={CLASS_TH_CENTER}>OT Losses</th>
                            <th className={CLASS_TH_CENTER}>Points</th>
                            <th className={CLASS_TH_CENTER}>Goals For</th>
                            <th className={CLASS_TH_CENTER}>Goals Against</th>
                            <th className={CLASS_TH_CENTER}>Goal Diff</th>
                        </tr>
                        </thead>
                        <tbody className="[&amp;_tr:last-child]:border-0">
                        {teamStatsList()}
                        </tbody>
                    </table>
                </div>
            </div>
        </DateRangeContext>
    );
}