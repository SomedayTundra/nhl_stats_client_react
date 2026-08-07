'use client'

import * as React from 'react'
import {useState} from 'react'
import 'react-calendar/dist/Calendar.css'
import type TeamStatEntry from '@/components/TeamStatEntry.tsx'
import {CartesianGrid, Line, LineChart, XAxis} from 'recharts'
import {Card, CardContent, CardDescription, CardHeader, CardTitle,} from './ui/card'
import {type ChartConfig, ChartContainer, ChartTooltip} from './ui/chart'

import {Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList,} from './ui/combobox'
import type {DateRange, OnSelectHandler} from 'react-day-picker'
import {DateRangeContext} from '@/state/DateRangeContext.tsx'
import DatePickerWithRange from '@/components/DatePickerWithRange.tsx'
import TeamChooser from '@/components/TeamChooser.tsx'
import {Checkbox} from '@/components/ui/checkbox'
import {Field, FieldGroup, FieldLabel} from '@/components/ui/field.tsx'
import {useQuery} from '@tanstack/react-query'
import {formatDateForApi} from '@/lib/date.ts'

const lineTypes = [
    'basis', 'bump', 'linear', 'natural', 'monotone', 'step',
] as const

type LineType = typeof lineTypes[number]

function isLineType(value: string): value is LineType {
    return (lineTypes as readonly string[]).includes(value)
}

const SERVER = 'localhost:8000'

type ResolvedDateRange = {
    from: Date;
    to: Date;
}

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
    const [lineType, setLineType] = useState<LineType>("monotone");
    const [showDots, setShowDots] = React.useState<boolean>(false);
    const [selectedTeams, setSelectedTeams] = React.useState<string[]>([]);
    const [date, setDate] = React.useState<ResolvedDateRange>({from: new Date('2025-10-08'), to: new Date('2026-04-18')});

    const handleDateSelect: OnSelectHandler<DateRange | undefined> = (selected) => {
        setDate({
            from: selected?.from ?? new Date(),
            to: selected?.to ?? new Date(),
        });
    };

    const handleLineTypeChange = (value: string) => {
        if (isLineType(value)) {
            setLineType(value);
        }
    };

    const dateRangeContextValue = {
        dateRange: date,
        setDateRange: handleDateSelect
    };

    // this method fetches the NHL stats from the database.
    const {data: teamStats, isPending, error} = useQuery<TeamStatEntry[]>({
        queryKey: ['teamStats', dateRangeContextValue.dateRange],
        queryFn: async() => {
            const prettyStartDate: string = formatDateForApi(date.from);
            const prettyEndDate: string = formatDateForApi(date.to);

            const response = await fetch(`http://${SERVER}/api/nhl_standings/?start_date=${prettyStartDate}&end_date=${prettyEndDate}`);
            if (!response.ok) {
                throw new Error(`An error occurred: ${response.statusText}`);
            }
            return (await response.json()) as TeamStatEntry[];
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
            <div className="h-full flex flex-col">
                <div className="w-9/12 mx-auto flex flex-row items-center gap-4 shrink-0">
                    <DatePickerWithRange/>
                    <TeamChooser selected={selectedTeams} onChange={setSelectedTeams}/>
                    <Combobox items={lineTypes} defaultValue={lineTypes[4]} onInputValueChange={handleLineTypeChange} autoHighlight>
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
                    <FieldGroup className="w-auto shrink-0">
                        <Field orientation='horizontal'>
                            <Checkbox id='show-dots-checkbox-basic' name='show-dots-checkbox-basic' checked={showDots} onCheckedChange={setShowDots}/>
                            <FieldLabel htmlFor='show-dots-checkbox-basic' className="whitespace-nowrap">
                                Show Dots
                            </FieldLabel>
                        </Field>
                    </FieldGroup>
                </div>
                <div className="flex-1 min-h-0 flex justify-center">
                    <Card className="w-9/12 flex flex-col overflow-hidden">
                        <CardHeader className="shrink-0">
                            <CardTitle>Team Standings Over Time</CardTitle>
                            <CardDescription>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 min-h-0 overflow-hidden">
                            <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
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
                                        tickFormatter={(value: string) => value.slice(5)}
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
                    </Card>
                </div>
            </div>
        </DateRangeContext>
    );
}