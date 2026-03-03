import * as React from "react";
import {useEffect, useState} from "react";
import DateRangePicker from '@wojtekmaj/react-daterange-picker';
import '@wojtekmaj/react-daterange-picker/dist/DateRangePicker.css';
import 'react-calendar/dist/Calendar.css';
import type TeamStatEntry from "@/components/TeamStatEntry.tsx";

// FIXME: sort out what isn't configured properly so i can stop ignoring the
//        'cannot find module react-calender/dist/shared/types' error that
//        IDEA is giving me, even though the code itself *can* find that module
// @ts-ignore
import type {Value} from "react-calendar/dist/shared/types";
import {TrendingUp} from "lucide-react"
import {CartesianGrid, Line, LineChart, XAxis} from "recharts"
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,} from "./ui/card"
import {type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent,} from "./ui/chart"

import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "./ui/combobox"

const lineTypes = [
    'basis', 'bump', 'linear', 'natural', 'monotone', 'step',
] as const

const SERVER = 'localhost:8000'
type DateValuePiece = Date | null;

"use client"

export const description = "A multiple line chart"

let chartConfig = {
    TBL: {
        label: "Lightning",
        color: "var(--chart-3)",
    },
    BUF: {
        label: "Sabres",
        color: "var(--chart-2)",
    },
    DET: {
        label: "Red Wings",
        color: "var(--chart-1)",
    },
    MTL: {
        label: "Canadiens",
        color: "var(--chart-4)",
    },
    BOS: {
        label: "Bruins",
        color: "var(--chart-5)",
    },
    OTT: {
        label: "Senators",
        color: "var(--chart-6)",
    },
    FLA: {
        label: "Panthers",
        color: "var(--chart-7)",
    },
    TOR: {
        label: "Maple Leafs",
        color: "var(--chart-8)",
    },
} satisfies ChartConfig

// type LineDescriptor = { label: string, color: string }
// let chartData: Record<string,string|number>[] = []
// let chartConfig: Map<[k in string], LineDescriptor> = new Map() satisfies ChartConfig;

export default function TeamStandingsChart() {
    // const [teamStats, setTeamStats] = useState<TeamStatEntry[]>([]);
    const [dateRange, setDateRange] = useState<Value>([new Date(), new Date()]);
    const [chartData, setChartData] = useState<Record<string, string | number>[]>([]);
    const [lineType, setLineType] = useState("monotone")

    // this method fetches the NHL stats from the database.
    useEffect(() => {
        async function getTeamStats() {
            const prettyStartDate = "2025-12-01"
            const prettyEndDate = "2026-03-02"
            // const prettyStartDate: string|undefined = changeDateToMyPreferredStringFormat(dateRange[0]);
            // const prettyEndDate: string|undefined = changeDateToMyPreferredStringFormat(dateRange[1]);

            const response = await fetch(`http://${SERVER}/api/nhl_standings/?start_date=${prettyStartDate}&end_date=${prettyEndDate}`);
            if (!response.ok) {
                const message = `An error occurred: ${response.statusText}`;
                console.error(message);
                return;
            }
            const teamStats = await response.json();

            // setTeamStats(teamStats);

            // clear out any old data
            let newChartData: Record<string, string | number>[] = []
            // chartConfig.clear()

            teamStats.map((team_stat: TeamStatEntry) => {
                // get data entry for the given date
                let existingDate = newChartData.find((entry) => entry["date"] == team_stat.date);
                if (!existingDate) {
                    existingDate = {date: team_stat.date}
                    newChartData.push(existingDate);
                }

                // add an entry associating this team's abbreviation with this team's points
                existingDate[team_stat.team_abbrev] = team_stat.points

                // make sure there is a chart config entry for this team's abbreviation
                // const existingConfig = chartConfig.get(team_stat.team_abbrev)
                // if(!existingConfig) {
                //     const configEntry: LineDescriptor = {label: team_stat.team_common_name, color: "var(--chart-1)"};
                //     chartConfig.set(team_stat.team_abbrev, configEntry)
                // }
            });

            setChartData(newChartData);
        }

        getTeamStats();
    }, dateRange);

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

        const options = [{year: 'numeric'}, {date: '2-digit'}, {day: '2-digit'}];
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
        <Card className="h-9/12 w-9/12">
            <CardHeader>
                <CardTitle>Team Standings Per Day</CardTitle>
                <CardDescription>
                    <div className="flex justify-start">
                        <div className="text-blue-800 bg-blue-200 font-bold p-1">
                            <span className="pr-2">Date Range:</span>
                            <DateRangePicker onChange={setDateRange} value={dateRange} format="yyyy-MM-dd"/>
                        </div>
                        <Combobox items={lineTypes} defaultValue={lineTypes[4]} onInputValueChange={setLineType} autoHighlight>
                            <ComboboxInput placeholder="Select a line type"/>
                            <ComboboxContent>
                                <ComboboxEmpty>No items found.</ComboboxEmpty>
                                <ComboboxList>
                                    {(item) => (
                                        <ComboboxItem key={item} value={item}>
                                            {item}
                                        </ComboboxItem>
                                    )}
                                </ComboboxList>
                            </ComboboxContent>
                        </Combobox>
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
                            dataKey="date"
                            tickLine={true}
                            axisLine={true}
                            tickMargin={8}
                        />
                        <ChartTooltip cursor={true} content={<ChartTooltipContent/>}/>
                        <Line
                            dataKey="TBL"
                            type={lineType}
                            stroke="var(--chart-3)"
                            strokeWidth={2}
                            dot={false}
                        />
                        <Line
                            dataKey="BUF"
                            type={lineType}
                            stroke="var(--chart-2)"
                            strokeWidth={2}
                            dot={false}
                        />
                        <Line
                            dataKey="DET"
                            type={lineType}
                            stroke="var(--chart-1)"
                            strokeWidth={2}
                            dot={false}
                        />
                        <Line
                            dataKey="MTL"
                            type={lineType}
                            stroke="var(--chart-4)"
                            strokeWidth={2}
                            dot={false}
                        />
                        <Line
                            dataKey="BOS"
                            type={lineType}
                            stroke="var(--chart-5)"
                            strokeWidth={2}
                            dot={false}
                        />
                        <Line
                            dataKey="OTT"
                            type={lineType}
                            stroke="var(--chart-6)"
                            strokeWidth={2}
                            dot={false}
                        />
                        <Line
                            dataKey="FLA"
                            type={lineType}
                            stroke="var(--chart-7)"
                            strokeWidth={2}
                            dot={false}
                        />
                        <Line
                            dataKey="TOR"
                            type={lineType}
                            stroke="var(--chart-8)"
                            strokeWidth={2}
                            dot={false}
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