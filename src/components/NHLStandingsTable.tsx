import {useEffect, useState} from "react";
// import {toast} from "react-toastify";
import DateRangePicker from '@wojtekmaj/react-daterange-picker';
import '@wojtekmaj/react-daterange-picker/dist/DateRangePicker.css';
import 'react-calendar/dist/Calendar.css';
import * as React from "react";

// FIXME: sort out what isn't configured properly so i can stop ignoring the
//        'cannot find module react-calender/dist/shared/types' error that
//        IDEA is giving me, even though the code itself *can* find that module
// @ts-ignore
import type {Value} from "react-calendar/dist/shared/types";

const SERVER = 'localhost:8000'

const CLASS_TD = "p-4 align-middle"
const CLASS_TD_LEFT = `${CLASS_TD} text-left`;
const CLASS_TD_CENTER = `${CLASS_TD} text-center`;

interface TeamStatEntry {
    date: string,
    goal_diff: number,
    goals_against: number,
    goals_for: number,
    logo: string,
    losses: number,
    team_name: string,
    ot_losses: number,
    points: number,
    wins: string,
    key: string,
}

// TODO: FIGURE OUT IF IMAGES FETCHED VIA localhost:8000/.../logos/{name} ARE DEFINITELY CACHED BY THE BROWSER
const TeamStat: React.FC<TeamStatEntry> = ({date, goal_diff, goals_against, goals_for, logo, losses, team_name, ot_losses, points, wins}: TeamStatEntry) => (
    <tr className="p-0 transition-colors data-[state=selected]:bg-muted">
        <td className={CLASS_TD_LEFT}>{date}</td>
        <td className={`flex`}>
            <img className="h-16 w-16 align-middle justify-center" src={`http://localhost:8000/api/nhl_standings/logos?logo_filename=${logo}`} alt="logo"></img>
            <p className={CLASS_TD}>{team_name}</p>
        </td>
        <td className={CLASS_TD_CENTER}>{wins}</td>
        <td className={CLASS_TD_CENTER}>{losses}</td>
        <td className={CLASS_TD_CENTER}>{ot_losses}</td>
        <td className={CLASS_TD_CENTER}>{points}</td>
        <td className={CLASS_TD_CENTER}>{goals_for}</td>
        <td className={CLASS_TD_CENTER}>{goals_against}</td>
        <td className={CLASS_TD_CENTER}>{goal_diff}</td>
    </tr>
);

type DateValuePiece = Date | null;

export default function TeamStatList() {
    const [teamStats, setTeamStats] = useState<TeamStatEntry[]>([]);
    const [dateRange, setDateRange] = useState<Value>([new Date(), new Date()]);

    // this method fetches the NHL stats from the database.
    useEffect(() => {
        async function getTeamStats() {
            const prettyStartDate = changeDateToMyPreferredStringFormat(dateRange[0]);
            const prettyEndDate = changeDateToMyPreferredStringFormat(dateRange[1]);

            const response = await fetch(`http://${SERVER}/api/nhl_standings/?start_date=${prettyStartDate}&end_date=${prettyEndDate}`);
            if (!response.ok) {
                const message = `An error occurred: ${response.statusText}`;
                console.error(message);
                return;
            }
            const team_stats = await response.json();
            setTeamStats(team_stats);
        }

        getTeamStats();
    }, dateRange);

    // this method will map out the team stats on the table
    function teamStatsList() {
        return teamStats.map((team_stat) => {
            console.debug(team_stat);
            const id_key = team_stat.date + '_' + team_stat.team_name;
            return (
                <TeamStat
                    date={team_stat.date}
                    goal_diff= {team_stat.goal_diff}
                    goals_against= {team_stat.goals_against}
                    goals_for={team_stat.goals_for}
                    logo={team_stat.logo}
                    losses={team_stat.losses}
                    team_name={team_stat.team_name}
                    ot_losses={team_stat.ot_losses}
                    points={team_stat.points}
                    wins={team_stat.wins}
                    key={id_key}
                />
            );
        });
    }

    function changeDateToMyPreferredStringFormat(originalDate: DateValuePiece) {
        function join(date: Date, options: any[], separator: string) {
            function format(option: Intl.DateTimeFormatOptions | undefined) {
                let formatter = new Intl.DateTimeFormat('en', option);
                return formatter.format(date);
            }
            return options.map(format).join(separator);
        }

        if(originalDate === null) {
            return;
        }

        const options = [{year: 'numeric'}, {month: '2-digit'}, {day: '2-digit'}];
        const prettyDate = join(originalDate, options, '-');
        // toast.info(DateTranslationToast(originalDate, prettyDate));
        return prettyDate;
    }

    // function DateTranslationToast(originalDate: Date, prettyDate: String) {
    //     return (
    //         <div className="grid grid-cols-2 w-full">
    //             <h3 className="text-zinc-800 text-sm font-bold col-span-2">DATE PRETTIFIED!</h3>
    //             <p className="p-2 text-sm">Original</p><p>{originalDate.toISOString()}</p>
    //             <p className="p-2 text-sm">Pretty</p><p>{prettyDate}</p>
    //         </div>
    //     );
    // }

    // this following section will display the table with the team standings stats
    const CLASS_TH_LEFT = "h-12 px-4 text-left align-middle font-medium text-muted-foreground";
    const CLASS_TH_CENTER = "h-12 px-4 text-center align-middle font-medium text-muted-foreground";

    return (
        <>
            <h3 className="text-lg font-semibold p-4">Team Standings</h3>
            <div className="flex justify-start">
                <div>
                    <div className="text-blue-800 bg-blue-200 font-bold p-1">
                        <span className="pr-2">Date Range:</span>
                        <DateRangePicker onChange={setDateRange} value={dateRange} format="yyyy-MM-dd"/>
                    </div>
                </div>
            </div>
            <div className="border rounded-lg overflow-hidden">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&amp;_tr]:border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <th className={CLASS_TH_LEFT}>Date</th>
                            <th className={CLASS_TH_CENTER}>Team</th>
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
        </>
    );
}