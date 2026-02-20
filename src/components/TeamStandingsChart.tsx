import * as React from "react";
import {useEffect, useState} from "react";
// import {toast} from "react-toastify";
import DateRangePicker from '@wojtekmaj/react-daterange-picker';
import '@wojtekmaj/react-daterange-picker/dist/DateRangePicker.css';
import 'react-calendar/dist/Calendar.css';

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

"use client"

import {GitCommitVertical, TrendingUp} from "lucide-react"
import {CartesianGrid, Line, LineChart, XAxis} from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "./ui/card"

import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "./ui/chart"

export const description = "A multiple line chart"

const chartData = [
    {month: "Oct 21", ducks: 186, wild: 80},
    {month: "Oct 22", ducks: 305, wild: 200},
    {month: "Oct 23", ducks: 237, wild: 120},
    {month: "Oct 24", ducks: 73, wild: 190},
    {month: "Oct 25", ducks: 209, wild: 130},
    {month: "Oct 26", ducks: 214, wild: 140},
]

const chartConfig = {
    ducks: {
        label: "Ducks",
        color: "var(--chart-1)",
    },
    wild: {
        label: "Wild",
        color: "var(--chart-2)",
    },
} satisfies ChartConfig


export default function TeamStatList() {
    const [teamStats, setTeamStats] = useState<TeamStatEntry[]>([]);
    const [dateRange, setDateRange] = useState<Value>([new Date(), new Date()]);

    // this method fetches the NHL stats from the database.
    useEffect(() => {
        async function getTeamStats() {
            const prettyStartDate: string|undefined = changeDateToMyPreferredStringFormat(dateRange[0]);
            const prettyEndDate: string|undefined = changeDateToMyPreferredStringFormat(dateRange[1]);

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
        return teamStats.map((team_stat: TeamStatEntry) => {
            console.debug(team_stat);
            const id_key = team_stat.date + '_' + team_stat.team_name;
            return (
                <TeamStat
                    date={team_stat.date}
                    goal_diff={team_stat.goal_diff}
                    goals_against={team_stat.goals_against}
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

        if (originalDate === null) {
            return;
        }

        const options = [{year: 'numeric'}, {month: '2-digit'}, {day: '2-digit'}];

        // EXAMPLE OF HOW TO SHOW A TOAST IN THE <TOASTCONTAINER/> OVER IN App.tsx
        // toast.info(DateTranslationToast(originalDate, prettyDate));

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

    return (
        <Card className="w-1/2">
            <CardHeader>
                <CardTitle>Team Standings Per Day</CardTitle>
                <CardDescription>
                    <div className="flex justify-start">
                        <div>
                            <div className="text-blue-800 bg-blue-200 font-bold p-1">
                                <span className="pr-2">Date Range:</span>
                                <DateRangePicker onChange={setDateRange} value={dateRange} format="yyyy-MM-dd"/>
                            </div>
                        </div>
                    </div>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig}>
                    <LineChart
                        accessibilityLayer
                        data={chartData}
                        margin={{
                            left: 12,
                            right: 12,
                        }}
                    >
                        <CartesianGrid vertical={false}/>
                        <XAxis
                            dataKey="month"
                            tickLine={true}
                            axisLine={true}
                            tickMargin={8}
                        />
                        <ChartTooltip cursor={true} content={<ChartTooltipContent/>}/>
                        <Line
                            dataKey="ducks"
                            type="monotone"
                            stroke="var(--chart-1)"
                            strokeWidth={2}
                            dot={{
                                fill: "var(--chart-1)",
                            }}
                        />
                        <Line
                            dataKey="wild"
                            type="monotone"
                            stroke="var(--chart-2)"
                            strokeWidth={2}
                            dot={{
                                fill: "var(--chart-2)",
                            }}
                        />
                    </LineChart>
                </ChartContainer>
            </CardContent>
            <CardFooter>
                <div className="flex w-full items-start gap-2 text-sm">
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2 leading-none font-medium">
                            THIS IS THE FOOTER <TrendingUp className="h-4 w-4"/>
                        </div>
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
}