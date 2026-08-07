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

// colors below were picked the same way as the rest of this map: rendering each team's logo
// and measuring which non-white color covers the most pixel area, nudging a couple of teams
// slightly apart from a very close sibling so lines stay readable on the chart
const HARDCODED_TEAM_COLORS = {
    TBL: {
        label: "Lightning",
        color: "#1E5AA8",
    },
    BUF: {
        label: "Sabres",
        color: "#003088",
    },
    DET: {
        label: "Red Wings",
        color: "#9E1B32",
    },
    MTL: {
        label: "Canadiens",
        color: "#A81830",
    },
    BOS: {
        label: "Bruins",
        color: "#FFB820",
    },
    OTT: {
        label: "Senators",
        color: "#D2232C",
    },
    FLA: {
        label: "Panthers",
        color: "#C9A227",
    },
    TOR: {
        label: "Maple Leafs",
        color: "#003E7E",
    },
    // colors below were picked by rendering each team's logo and measuring which non-white
    // color covers the most pixel area (a couple were nudged slightly apart from a very close
    // sibling team so lines stay readable on the chart; LAK's logo has no color at all, so it
    // gets their well-known "Forum Blue" instead)
    CAR: {
        label: "Hurricanes",
        color: "#D00018",
    },
    NJD: {
        label: "Devils",
        color: "#B8001C",
    },
    CBJ: {
        label: "Blue Jackets",
        color: "#002654",
    },
    NYI: {
        label: "Islanders",
        color: "#003087",
    },
    NYR: {
        label: "Rangers",
        color: "#0038A8",
    },
    PHI: {
        label: "Flyers",
        color: "#F74902",
    },
    PIT: {
        label: "Penguins",
        color: "#FFB81C",
    },
    WSH: {
        label: "Capitals",
        color: "#041E42",
    },
    CHI: {
        label: "Blackhawks",
        color: "#D8A810",
    },
    COL: {
        label: "Avalanche",
        color: "#206090",
    },
    DAL: {
        label: "Stars",
        color: "#008840",
    },
    MIN: {
        label: "Wild",
        color: "#184838",
    },
    NSH: {
        label: "Predators",
        color: "#E8A415",
    },
    STL: {
        label: "Blues",
        color: "#0068C8",
    },
    UTA: {
        label: "Mammoth",
        color: "#70B0E8",
    },
    WPG: {
        label: "Jets",
        color: "#10284B",
    },
    ANA: {
        label: "Ducks",
        color: "#886050",
    },
    CGY: {
        label: "Flames",
        color: "#C81030",
    },
    EDM: {
        label: "Oilers",
        color: "#002058",
    },
    LAK: {
        label: "Kings",
        color: "#6F9BD1",
    },
    SJS: {
        label: "Sharks",
        color: "#007888",
    },
    SEA: {
        label: "Kraken",
        color: "#68A8B8",
    },
    VAN: {
        label: "Canucks",
        color: "#143C64",
    },
    VGK: {
        label: "Golden Knights",
        color: "#B89858",
    },
} satisfies ChartConfig

// safety net only: every team above now has a real color, so this should never actually run
// unless a new team appears in the API before this map is updated for it
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
