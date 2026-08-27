'use client'

import * as React from 'react'
import {createPortal} from 'react-dom'
import 'react-calendar/dist/Calendar.css'
import type {TeamStatEntry} from '@/state/types'
import {CartesianGrid, Dot, Line, LineChart, XAxis, YAxis} from 'recharts'
import {Card, CardContent, CardDescription, CardHeader, CardTitle,} from './ui/card'
import {type ChartConfig, ChartContainer, ChartTooltip} from './ui/chart'

import {Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList,} from './ui/combobox'
import {ArrowRightLeftIcon} from 'lucide-react'
import {DateContext} from '@/state/DateContext.tsx'
import DatePickerWithNav from '@/components/DatePickerWithNav.tsx'
import TeamChooser from '@/components/TeamChooser.tsx'
import {Button} from '@/components/ui/button'
import {Checkbox} from '@/components/ui/checkbox'
import {Field, FieldGroup, FieldLabel} from '@/components/ui/field.tsx'
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip'
import {deserializeDate, formatApiDateForDisplay, serializeDate} from '@/lib/date.ts'
import {useLocalStorageState} from '@/lib/useLocalStorageState.ts'
import {useTeamStats} from '@/hooks/useTeamStats.ts'
import {getTeamLogoUrl} from '@/lib/teamLogo.ts'
import {addDays, isAfter, isBefore, isSameDay, subDays} from 'date-fns'

const lineTypes = [
    'basis', 'bump', 'linear', 'natural', 'monotone', 'step',
] as const

type LineType = typeof lineTypes[number]

function isLineType(value: string): value is LineType {
    return (lineTypes as readonly string[]).includes(value)
}

// size (in px) of the team logo rendered at the end of each line, adjustable via the "Logos"
// control in the docked tooltip panel
const MIN_LOGO_SIZE = 32
const MAX_LOGO_SIZE = 64
const LOGO_SIZE_STEP = 8
const DEFAULT_LOGO_SIZE = 48

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

type ChartTooltipPayloadItem = {
    dataKey?: string | number
    value?: number | string
    color?: string
    name?: string | number
}

type DockedTooltipPanelProps = {
    payload: ChartTooltipPayloadItem[] | null
    label?: string
    logoSize: number
    onDecreaseLogoSize: () => void
    onIncreaseLogoSize: () => void
}

// docked along the chart's right edge instead of following the cursor, stretched to the chart's
// full height; rows always start at the top and stack downward in a single column (the panel's
// own height/scroll - not a fixed row/column grid - is what keeps a full 32-team list readable).
// the "Logos" size control is a persistent chart setting rather than tooltip content, so it's
// pinned to the bottom of the panel, outside the scrolling hover-content area
function DockedTooltipPanel({payload, label, logoSize, onDecreaseLogoSize, onIncreaseLogoSize}: DockedTooltipPanelProps) {
    const sorted = payload ? [...payload].sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0)) : null

    return (
        <div className="h-full w-36 shrink-0 border-l flex flex-col text-xs">
            <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2">
                {sorted && sorted.length > 0 ? (
                    <>
                        <div className="mb-1 font-medium">{label && formatApiDateForDisplay(label)}</div>
                        <div className="flex flex-col">
                            {sorted.map((item) => (
                                <div key={item.dataKey} className="flex items-center gap-1.5 whitespace-nowrap py-0.5">
                                    <span className="inline-block size-2 shrink-0 rounded-[2px]" style={{backgroundColor: item.color}}/>
                                    <span>{item.name ?? item.dataKey}: {item.value}</span>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <p className="text-muted-foreground">Hover the chart to see values</p>
                )}
            </div>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="shrink-0 border-t px-3 py-2 flex items-center justify-center gap-2">
                        <Button variant="outline" size="icon-xs" onClick={onDecreaseLogoSize} disabled={logoSize <= MIN_LOGO_SIZE}>-</Button>
                        <span>{logoSize}px</span>
                        <Button variant="outline" size="icon-xs" onClick={onIncreaseLogoSize} disabled={logoSize >= MAX_LOGO_SIZE}>+</Button>
                    </div>
                </TooltipTrigger>
                <TooltipContent>Adjust the size of team logos on the chart.</TooltipContent>
            </Tooltip>
        </div>
    )
}

export default function TeamStandingsChart() {
    const [lineType, setLineType] = useLocalStorageState<LineType>('nhlStats.chart.lineType', 'monotone', {
        deserialize: (raw) => {
            const parsed = JSON.parse(raw)
            return isLineType(parsed) ? parsed : 'monotone'
        },
    })
    const [showDots, setShowDots] = useLocalStorageState<boolean>('nhlStats.chart.showDots', false)
    const [logoSize, setLogoSize] = useLocalStorageState<number>('nhlStats.chart.logoSize', DEFAULT_LOGO_SIZE)
    const [selectedTeams, setSelectedTeams] = useLocalStorageState<string[]>('nhlStats.chart.selectedTeams', [])
    const [fromDate, setFromDate] = useLocalStorageState<Date>('nhlStats.chart.dateRange.from', new Date('2025-10-08'), {
        serialize: serializeDate,
        deserialize: deserializeDate,
    })
    const [toDate, setToDate] = useLocalStorageState<Date>('nhlStats.chart.dateRange.to', new Date('2026-04-18'), {
        serialize: serializeDate,
        deserialize: deserializeDate,
    })

    // hover logos are portaled into this shared layer - rendered as the very last child of
    // LineChart, so they always paint on top of every line regardless of which team's line
    // happens to be drawn last (each Line's own activeDot would otherwise be stacked per-line,
    // interleaved with the lines themselves, letting a later line's stroke cover an earlier
    // team's logo)
    const [logoOverlayNode, setLogoOverlayNode] = React.useState<SVGGElement | null>(null)

    // drives the docked (non-cursor-following) tooltip panel; Recharts' own Tooltip stays mounted
    // (with null visual content) purely so its activeDot/cursor machinery keeps working
    const [hoveredPayload, setHoveredPayload] = React.useState<ChartTooltipPayloadItem[] | null>(null)
    const [hoveredLabel, setHoveredLabel] = React.useState<string | undefined>(undefined)

    function handleChartMouseMove(state: {activePayload?: ChartTooltipPayloadItem[], activeLabel?: string}) {
        if (state.activePayload && state.activePayload.length > 0) {
            setHoveredPayload(state.activePayload)
            setHoveredLabel(state.activeLabel)
        }
    }

    function handleChartMouseLeave() {
        setHoveredPayload(null)
        setHoveredLabel(undefined)
    }

    const handleDecreaseLogoSize = () => setLogoSize((current) => Math.max(MIN_LOGO_SIZE, current - LOGO_SIZE_STEP))
    const handleIncreaseLogoSize = () => setLogoSize((current) => Math.min(MAX_LOGO_SIZE, current + LOGO_SIZE_STEP))

    // the "from" and "to" dates are never allowed to cross (from after to) or land on the same
    // day - whichever end the user just moved "wins", and the other end gets nudged out of the way
    const handleFromDateSelect = (selected: Date | undefined) => {
        const newFrom = selected ?? new Date();
        setFromDate(newFrom);
        if (isAfter(newFrom, toDate) || isSameDay(newFrom, toDate)) {
            setToDate(addDays(newFrom, 7));
        }
    };

    const handleToDateSelect = (selected: Date | undefined) => {
        const newTo = selected ?? new Date();
        setToDate(newTo);
        if (isBefore(newTo, fromDate) || isSameDay(newTo, fromDate)) {
            setFromDate(subDays(newTo, 7));
        }
    };

    const handleLineTypeChange = (value: string) => {
        if (isLineType(value)) {
            setLineType(value);
        }
    };

    const fromDateContextValue = {
        date: fromDate,
        setDate: handleFromDateSelect
    };

    const toDateContextValue = {
        date: toDate,
        setDate: handleToDateSelect
    };

    const {data: teamStats, isPending, error} = useTeamStats(fromDate, toDate)

    // the controls below stay mounted regardless of loading/error/selection state, so TeamChooser
    // never remounts (and loses its committed selection) on refetch; only the chart area swaps out
    let chartArea: React.ReactNode
    if (selectedTeams.length === 0) {
        chartArea = <p className="p-4 text-center">No teams selected</p>
    } else if (isPending) {
        chartArea = <p className="p-4 text-center">Loading...</p>
    } else if (error) {
        chartArea = <p className="p-4 text-center">An error occurred: {error.message}</p>
    } else {
        // clear out any old data
        const chartData: Record<string, string | number>[] = []
        const teamNameByAbbrev = new Map<string, string>()
        const teamLogoByAbbrev = new Map<string, string>()

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
            teamLogoByAbbrev.set(teamStatEntry.teamAbbrev, teamStatEntry.logo)
        })

        // only show teams currently selected in the TeamChooser (guaranteed non-empty here)
        const teamAbbrevsInData = Array.from(teamNameByAbbrev.keys())
        const visibleTeamAbbrevs = teamAbbrevsInData.filter((abbrev) => selectedTeams.includes(abbrev))

        // smaller than logoSize so stacked logos' boxes overlap a bit - the logo artwork itself
        // has some blank padding baked into its own SVG, so touching boxes alone still look gapped
        const logoStackSpacing = logoSize - 8

        const chartConfig: ChartConfig = {}
        visibleTeamAbbrevs.forEach((abbrev) => {
            chartConfig[abbrev] = HARDCODED_TEAM_COLORS[abbrev as keyof typeof HARDCODED_TEAM_COLORS] ?? {
                label: teamNameByAbbrev.get(abbrev) ?? abbrev,
                color: colorForTeam(abbrev),
            }
        })

        // teams tied on points at whichever date is currently hovered would render their active-dot
        // logos on top of each other; group them by that date's value and give each one after the
        // first an increasing leftward offset so they lay out in a row instead of overlapping
        function logoStackOffset(rowIndex: number, abbrev: string): number {
            const row = chartData[rowIndex]
            const value = row?.[abbrev]
            if (typeof value !== 'number') return 0
            const tiedAbbrevs = visibleTeamAbbrevs.filter((candidate) => row[candidate] === value)
            return Math.max(tiedAbbrevs.indexOf(abbrev), 0)
        }

        // shown only for the point the user is currently hovering over (Recharts' "active dot");
        // every other point still uses the plain small circle, gated by the "Show Dots" checkbox.
        // the logo itself is portaled into the shared top-most overlay layer (see logoOverlayNode)
        // rather than rendered inline here, so it always paints on top of every line
        function renderActiveDot(abbrev: string) {
            // the (props:unknown) and 'props as...' bits are a little loosey-goosey, but the fact is
            // Recharts' activeDot type only accepts (props: unknown) => JSX.Element here - its own
            // DotProps type doesn't even declare the index/value fields it actually passes at runtime
            return (props: unknown) => {
                const {key, cx, cy, index, value} = props as {key?: string, cx?: number, cy?: number, index?: number, value?: number}
                const logoFilename = teamLogoByAbbrev.get(abbrev)

                if (typeof value === 'number' && typeof index === 'number' && logoFilename) {
                    const offset = logoStackOffset(index, abbrev)
                    const logo = (
                        <image
                            key={key}
                            href={getTeamLogoUrl(logoFilename)}
                            x={(cx ?? 0) - logoSize / 2 - offset * logoStackSpacing}
                            y={(cy ?? 0) - logoSize / 2}
                            width={logoSize}
                            height={logoSize}
                        />
                    )
                    return logoOverlayNode ? createPortal(logo, logoOverlayNode, key) : <g key={key}>{logo}</g>
                }

                return <Dot key={key} cx={cx} cy={cy} r={4} fill={colorForTeam(abbrev)} stroke={colorForTeam(abbrev)}/>
            }
        }

        chartArea = (
            <div className="flex h-full w-full flex-row">
                <ChartContainer config={chartConfig} className="h-full flex-1 aspect-auto">
                    <LineChart
                        accessibilityLayer
                        data={chartData}
                        onMouseMove={handleChartMouseMove}
                        onMouseLeave={handleChartMouseLeave}
                        margin={{
                            top: 12,
                            bottom: 12,
                            left: 24,
                            right: 12 + logoSize / 2,
                        }}
                    >
                        <CartesianGrid vertical={false} stroke="var(--navbar-bg)"/>
                        <XAxis
                            dataKey="date"
                            tickLine={true}
                            axisLine={true}
                            tickMargin={8}
                            interval={Math.max(Math.ceil(chartData.length / 11) - 1, 0)}
                            tickFormatter={(value: string) => value.slice(5)}
                        />
                        <YAxis
                            tickLine={true}
                            axisLine={true}
                            tickMargin={8}
                            domain={([dataMin, dataMax]: [number, number]) => {
                                const padding = Math.max((dataMax - dataMin) * 0.1, 1)
                                return [Math.floor(dataMin - padding), Math.ceil(dataMax + padding)]
                            }}
                            label={{value: 'Points', angle: -90, position: 'insideLeft'}}
                        />
                        <ChartTooltip cursor={true} content={() => null}/>
                        {visibleTeamAbbrevs.map((abbrev) => (
                            <Line
                                key={abbrev}
                                dataKey={abbrev}
                                type={lineType}
                                stroke={colorForTeam(abbrev)}
                                strokeWidth={2}
                                dot={showDots}
                                activeDot={renderActiveDot(abbrev)}
                            />
                        ))}
                        <g ref={setLogoOverlayNode}/>
                    </LineChart>
                </ChartContainer>
                <DockedTooltipPanel
                    payload={hoveredPayload}
                    label={hoveredLabel}
                    logoSize={logoSize}
                    onDecreaseLogoSize={handleDecreaseLogoSize}
                    onIncreaseLogoSize={handleIncreaseLogoSize}
                />
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col">
            <div className="w-9/12 mx-auto flex flex-row items-center justify-center gap-4 shrink-0">
                <div className="flex flex-row items-center gap-2 shrink-0">
                    <FieldLabel className="justify-start whitespace-nowrap">Date Range:</FieldLabel>
                    <DateContext value={fromDateContextValue}>
                        <DatePickerWithNav id="date-picker-from" tooltip="From"/>
                    </DateContext>
                    <ArrowRightLeftIcon className="size-4 shrink-0 text-muted-foreground"/>
                    <DateContext value={toDateContextValue}>
                        <DatePickerWithNav id="date-picker-to" tooltip="To"/>
                    </DateContext>
                </div>
                <TeamChooser selected={selectedTeams} onChange={setSelectedTeams}/>
                <Combobox items={lineTypes} value={lineType} onInputValueChange={handleLineTypeChange} autoHighlight>
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
                        <Checkbox id='show-dots-checkbox-basic' name='show-dots-checkbox-basic' checked={showDots} onCheckedChange={(checked) => setShowDots(checked === true)}/>
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
    );
}
