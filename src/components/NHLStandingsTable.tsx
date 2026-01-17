import {useEffect, useState} from "react";
// import {toast} from "react-toastify";
import Calendar from 'react-calendar';
import * as React from "react";
// @ts-ignore
import type {Value} from "react-calendar/dist/shared/types";
// import type {Value} from "react-calendar/dist/shared/types";

const CLASS_TD = "p-4 align-middle"
const CLASS_TD_LEFT = `${CLASS_TD} text-left`;
const CLASS_TD_CENTER = `${CLASS_TD} text-center`;

interface TeamStatEntry {
    date: string,
    goal_diff: number,
    goals_against: number,
    goals_for: number,
    local_logo: string,
    losses: number,
    team_name: string,
    ot_losses: number,
    points: number,
    wins: string,
    _id: string,
}

const TeamStat: React.FC<TeamStatEntry> = ({date, goal_diff, goals_against, goals_for, local_logo, losses, team_name, ot_losses, points, wins}: TeamStatEntry) => (
    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
        <td className={CLASS_TD_LEFT}>{date}</td>
        <td className={`flex ${CLASS_TD_LEFT}`}>
            <img className="h-16 w-16" src={`src/assets/logos/${local_logo}`} alt="logo"></img>
            <p className={CLASS_TD_LEFT}>{team_name}</p>
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

type DateValue = DateValuePiece;// | [DateValuePiece, DateValuePiece];

export default function TeamStatList() {
    const [teamStats, setTeamStats] = useState<TeamStatEntry[]>([]);
    // const [startDate, setStartDate] = useState<DateValue>(changeDateToMyPreferredStringFormat(new Date()));
    // const [endDate, setEndDate] = useState<DateValue>(changeDateToMyPreferredStringFormat(new Date()));
    const [startDate, setStartDate] = useState<DateValue>(new Date());
    const [endDate, setEndDate] = useState<DateValue>(new Date());

    // this method fetches the NHL stats from the database.
    useEffect(() => {
        async function getTeamStats() {
            const prettyStartDate = changeDateToMyPreferredStringFormat(startDate);
            const prettyEndDate = changeDateToMyPreferredStringFormat(endDate);

            const response = await fetch(`http://localhost:5050/api/nhl_standings/?startDate=${prettyStartDate}&endDate=${prettyEndDate}`);
            if (!response.ok) {
                const message = `An error occurred: ${response.statusText}`;
                console.error(message);
                return;
            }
            const team_stats = await response.json();
            setTeamStats(team_stats);
        }

        getTeamStats();
    }, [startDate, endDate]);

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
                    local_logo={team_stat.local_logo}
                    losses={team_stat.losses}
                    team_name={team_stat.team_name}
                    ot_losses={team_stat.ot_losses}
                    points={team_stat.points}
                    wins={team_stat.wins}
                    _id= {id_key}
                />
            );
        });
    }

    // FIXME: THE REACT-CALENDAR COMPONENT SEEMS TO ALLOW FOR THIS TO BE INTRINSICALLY CONFIGURED
    function changeDateToMyPreferredStringFormat(inputDate: DateValue) {
        if(inputDate === null) {
            return;
        }
        const monthDigits: string = ('0'+(inputDate.getMonth()+1)).slice(-2);
        const dayDigits: string = ('0'+inputDate.getDate()).slice(-2);
        return `${inputDate.getFullYear()}-${monthDigits}-${dayDigits}`;
    }

    // function onChangeStart(newStartDate: DateValue) {
    //     // const simpleStartDate = changeDateToMyPreferredStringFormat(newStartDate);
    //     // const msg = `onChangeStart(${newStartDate}) => ${simpleStartDate}`;
    //     // toast.info(msg);
    //     // console.log(msg);
    //     setStartDate(newStartDate);
    // }
    //
    // function onChangeEnd(newEndDate: DateValue) {
    //     // const simpleEndDate = changeDateToMyPreferredStringFormat(newEndDate);
    //     // toast.info(`onChangeEnd(${newEndDate}) => ${simpleEndDate}`);
    //     setEndDate(newEndDate);
    // }

    // this following section will display the table with the team standings stats
    const CLASS_TH_LEFT = "h-12 px-4 text-left align-middle font-medium text-muted-foreground";
    const CLASS_TH_CENTER = "h-12 px-4 text-center align-middle font-medium text-muted-foreground";

    const onChangeStart2 = (value: Value)=> {
        setStartDate(value);
    }

    const onChangeEnd2 = (value: Value) => {
        setEndDate(value);
    }

    return (
        <>
            <h3 className="text-lg font-semibold p-4">Team Standings</h3>
            <div className="flex justify-start">
                <div>
                    <div className="text-blue-800 bg-blue-200 font-bold">
                        Start
                        <Calendar onChange={onChangeStart2} value={startDate}/>
                        {/*<Calendar onChange={onChangeStart} value={startDate}/>*/}
                    </div>
                </div>
                <div>
                    <div className="text-blue-800 bg-blue-200 font-bold">
                        End
                        <Calendar onChange={onChangeEnd2} value={endDate}/>
                        {/*<Calendar onChange={onChangeEnd} value={endDate}/>*/}
                    </div>
                </div>
            </div>
            <div className="border rounded-lg overflow-hidden">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&amp;_tr]:border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <th className={CLASS_TH_LEFT}>Date</th>
                            <th className={CLASS_TH_LEFT}>Name</th>
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