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

const HARDCODED_TEAM_COLORS = {
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

// teams without a hardcoded color above get a random one, stable for the life of the page
// (a placeholder until real colors are picked for every team)
const randomColorCache = new Map<string, string>()

function randomColorForTeam(abbrev: string): string {
    let color = randomColorCache.get(abbrev)
    if (!color) {
        const hue = Math.floor(Math.random() * 360)
        color = `hsl(${hue}, 70%, 50%)`
        randomColorCache.set(abbrev, color)
    }
    return color
}

function colorForTeam(abbrev: string): string {
    return HARDCODED_TEAM_COLORS[abbrev as keyof typeof HARDCODED_TEAM_COLORS]?.color ?? randomColorForTeam(abbrev)
}

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

    // the controls below stay mounted regardless of loading/error state, so TeamChooser never
    // remounts (and loses its committed selection) on refetch; only the chart area swaps out
    let chartArea: React.ReactNode
    if (isPending) {
        chartArea = <p className="p-4 text-center">Loading...</p>
    } else if (error) {
        chartArea = <p className="p-4 text-center">An error occurred: {error.message}</p>
    } else {
        // clear out any old data
        const chartData: Record<string, string | number>[] = []
        const teamNameByAbbrev = new Map<string, string>()

        teamStats.forEach((teamStatEntry: TeamStatEntry) => {
            // get data entry for the given date
            let existingDate = chartData.find((entry) => entry["date"] == teamStatEntry.date)
            if (!existingDate) {
                existingDate = {date: teamStatEntry.date}
                chartData.push(existingDate)
            }

            // add an entry associating this team's abbreviation with this team's points
            existingDate[teamStatEntry.teamAbbrev] = teamStatEntry.points
            teamNameByAbbrev.set(teamStatEntry.teamAbbrev, teamStatEntry.teamName)
        })

        // only show teams currently selected in the TeamChooser (an empty selection is
        // treated as "no filter applied yet" rather than "show nothing")
        const teamAbbrevsInData = Array.from(teamNameByAbbrev.keys())
        const visibleTeamAbbrevs = selectedTeams.length === 0
            ? teamAbbrevsInData
            : teamAbbrevsInData.filter((abbrev) => selectedTeams.includes(abbrev))

        const chartConfig: ChartConfig = {}
        visibleTeamAbbrevs.forEach((abbrev) => {
            chartConfig[abbrev] = HARDCODED_TEAM_COLORS[abbrev as keyof typeof HARDCODED_TEAM_COLORS] ?? {
                label: teamNameByAbbrev.get(abbrev) ?? abbrev,
                color: colorForTeam(abbrev),
            }
        })

        chartArea = (
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
                    {visibleTeamAbbrevs.map((abbrev) => (
                        <Line
                            key={abbrev}
                            dataKey={abbrev}
                            type={lineType}
                            stroke={colorForTeam(abbrev)}
                            strokeWidth={2}
                            dot={showDots}
                        />
                    ))}
                </LineChart>
            </ChartContainer>
        )
    }

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
                            {chartArea}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DateRangeContext>
    );
}
