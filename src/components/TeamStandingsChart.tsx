'use client'

import * as React from 'react'
import {useState} from 'react'
import 'react-calendar/dist/Calendar.css'
import type TeamStatEntry from '@/components/TeamStatEntry.tsx'

// FIXME: sort out what isn't configured properly so i can stop ignoring the
//        'cannot find module react-calender/dist/shared/types' error that
//        IDEA is giving me, even though the code itself *can* find that module
// @ts-ignore
import type {Value} from 'react-calendar/dist/shared/types'
import {CartesianGrid, Line, LineChart, XAxis} from 'recharts'
import {Card, CardContent, CardDescription, CardHeader, CardTitle,} from './ui/card'
import {type ChartConfig, ChartContainer, ChartTooltip} from './ui/chart'

import {Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList,} from './ui/combobox'
import type {DateRange, OnSelectHandler} from 'react-day-picker'
import {DateRangeContext} from '@/state/DateRangeContext.tsx'
import DatePickerWithRange from '@/components/DatePickerWithRange.tsx'
import {Checkbox} from '@/components/ui/checkbox'
import {Field, FieldGroup, FieldLabel} from '@/components/ui/field.tsx'
import {useQuery} from '@tanstack/react-query'

const lineTypes = [
    'basis', 'bump', 'linear', 'natural', 'monotone', 'step',
] as const

const SERVER = 'localhost:8000'

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

export default function TeamStandingsChart() {
    const [lineType, setLineType] = useState("monotone");
    const [showDots, setShowDots] = React.useState<boolean>(true);
    const [date, setDate] = React.useState<DateRange>({from: new Date('2025-10-08'), to: new Date('2026-04-18')});

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

    function changeDateToMyPreferredStringFormat(originalDate: Date) {
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
        else {
            const options = [{year: 'numeric'}, {month: '2-digit'}, {day: '2-digit'}];
            return join(originalDate, options, '-');
        }
    }

    // @ts-ignore
    function ShowToast(msg: String) {
        return (
            <div className="grid grid-cols-2 w-full">
                <h3 className="text-zinc-800 text-sm font-bold col-span-2">{msg}</h3>
            </div>
        );
    }

    // this method fetches the NHL stats from the database.
    const {data: teamStats, isPending, error} = useQuery({
        queryKey: ['teamStats', dateRangeContextValue.dateRange],
        queryFn: async() => {
            const prettyStartDate: string | undefined = changeDateToMyPreferredStringFormat(date.from as Date);
            const prettyEndDate: string | undefined = changeDateToMyPreferredStringFormat(date.to as Date);

            const response = await fetch(`http://${SERVER}/api/nhl_standings/?start_date=${prettyStartDate}&end_date=${prettyEndDate}`);
            if (!response.ok) {
                const message = `An error occurred: ${response.statusText}`;
                console.error(message);
                return;
            }
            return await response.json();
        }
    })

    if(isPending) return 'Loading...'

    if(error) return 'An error occurred: ' + error.message

    // clear out any old data
    const chartData: Record<string, string | number>[] = []
    // chartConfig.clear()

    teamStats.map((teamStatEntry: TeamStatEntry) => {
        // get data entry for the given date
        let existingDate = chartData.find((entry) => entry["date"] == teamStatEntry.date);
        if (!existingDate) {
            existingDate = {date: teamStatEntry.date}
            chartData.push(existingDate);
        }

        // add an entry associating this team's abbreviation with this team's points
        existingDate[teamStatEntry.teamAbbrev] = teamStatEntry.points

        // make sure there is a chart config entry for this team's abbreviation
        // const existingConfig = chartConfig.get(team_stat.team_abbrev)
        // if(!existingConfig) {
        //     const configEntry: LineDescriptor = {label: team_stat.team_common_name, color: "var(--chart-1)"};
        //     chartConfig.set(team_stat.team_abbrev, configEntry)
        // }
    });

    return (
        <DateRangeContext value={dateRangeContextValue}>
            <div className="flex flex-row items-center">
                <DatePickerWithRange/>
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
                <FieldGroup className='mx-auto w-56'>
                    <Field orientation='horizontal'>
                        <Checkbox id='show-dots-checkbox-basic' name='show-dots-checkbox-basic' checked={showDots} onCheckedChange={setShowDots}/>
                        <FieldLabel htmlFor='show-dots-checkbox-basic'>
                            Show Dots
                        </FieldLabel>
                    </Field>
                </FieldGroup>

            </div>
            <Card className="h-9/12 w-9/12">
                <CardHeader>
                    <CardTitle>Team Standings Over Time</CardTitle>
                    <CardDescription>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig}>
                        <LineChart
                            accessibilityLayer
                            data={chartData}
                            margin={{
                                top: 12,
                                bottom: 12,
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
                            <ChartTooltip cursor={true}
                                          itemSorter={(item) => {return (200 - (item.value as number)) as number;} }
                                          // content={<ChartTooltipContent />}
                            />
                            <Line
                                dataKey="TBL"
                                type={lineType}
                                stroke="var(--chart-3)"
                                strokeWidth={2}
                                dot={showDots}
                            />
                            <Line
                                dataKey="BUF"
                                type={lineType}
                                stroke="var(--chart-2)"
                                strokeWidth={2}
                                dot={showDots}
                            />
                            <Line
                                dataKey="DET"
                                type={lineType}
                                stroke="var(--chart-1)"
                                strokeWidth={2}
                                dot={showDots}
                            />
                            <Line
                                dataKey="MTL"
                                type={lineType}
                                stroke="var(--chart-4)"
                                strokeWidth={2}
                                dot={showDots}
                            />
                            <Line
                                dataKey="BOS"
                                type={lineType}
                                stroke="var(--chart-5)"
                                strokeWidth={2}
                                dot={showDots}
                            />
                            <Line
                                dataKey="OTT"
                                type={lineType}
                                stroke="var(--chart-6)"
                                strokeWidth={2}
                                dot={showDots}
                            />
                            <Line
                                dataKey="FLA"
                                type={lineType}
                                stroke="var(--chart-7)"
                                strokeWidth={2}
                                dot={showDots}
                            />
                            <Line
                                dataKey="TOR"
                                type={lineType}
                                stroke="var(--chart-8)"
                                strokeWidth={2}
                                dot={showDots}
                            />
                        </LineChart>
                    </ChartContainer>
                </CardContent>
                {/*<CardFooter>*/}
                {/*    <div className="flex w-full items-start gap-2 text-sm">*/}
                {/*        <div className="grid gap-2">*/}
                {/*            <div className="flex items-center gap-2 leading-none font-medium">*/}
                {/*                THIS IS THE FOOTER <TrendingUp className="h-4 w-4"/>*/}
                {/*            </div>*/}
                {/*        </div>*/}
                {/*    </div>*/}
                {/*</CardFooter>*/}
            </Card>
        </DateRangeContext>
    );
}