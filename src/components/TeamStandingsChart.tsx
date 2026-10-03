'use client'

import * as React from 'react'
import {createPortal} from 'react-dom'
import 'react-calendar/dist/Calendar.css'
import type {TeamStatEntry} from '@/state/types'
import {CartesianGrid, Dot, Line, LineChart, XAxis, YAxis} from 'recharts'
import {Card, CardContent, CardDescription, CardHeader, CardTitle,} from './ui/card'
import {type ChartConfig, ChartContainer, ChartTooltip} from './ui/chart'

import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from './ui/select'
import {ArrowRightLeftIcon} from 'lucide-react'
import {DateContext} from '@/state/DateContext.tsx'
import DatePickerWithNav from '@/components/DatePickerWithNav.tsx'
import {SeasonSelect} from '@/components/SeasonSelect.tsx'
import TeamChooser from '@/components/TeamChooser.tsx'
import {Button} from '@/components/ui/button'
import {Checkbox} from '@/components/ui/checkbox'
import {Field, FieldGroup, FieldLabel} from '@/components/ui/field.tsx'
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip'
import {deserializeDate, formatApiDateForDisplay, formatDateForApi, limitDateToYesterday, parseApiDateString, serializeDate} from '@/lib/date.ts'
import {cn} from '@/lib/utils'
import {useLocalStorageState} from '@/lib/useLocalStorageState.ts'
import {useSeasonInfo} from '@/hooks/useSeasonInfo.ts'
import {useTeamStats} from '@/hooks/useTeamStats.ts'
import {usePlayoffs} from '@/hooks/usePlayoffs.ts'
import {getTeamLogoUrl} from '@/lib/teamLogo.ts'
import {addDays, isAfter, isBefore, isSameDay, subDays} from 'date-fns'
import {seasonIdToLabel} from '@/lib/season.ts'
import {buildBracketView, type BracketTeamView, type NhlBracketPayload} from '@/lib/playoffBracket.ts'
// a small (42x48, 2x a 24px CSS height) re-render of the navbar's nhl_logo.png, rather than that
// full-size asset scaled down by the browser, so the swatch/logo toggle's icon stays crisp at
// its actual display size instead of relying on downsampling a much larger source image
import nhlLogoSmall from '@/assets/nhl_logo_small.png'
import {useNavigate} from '@tanstack/react-router'

const lineTypes = [
    'basis', 'bump', 'linear', 'natural', 'monotone', 'step',
] as const

// used to size the line-type combo box to exactly fit its longest choice, whichever one that is
const longestLineType = lineTypes.reduce((longest, type) => (type.length > longest.length ? type : longest), '')

// a single wheel flick (especially on a trackpad) fires a burst of events; only step one entry
// per this window so one gesture doesn't skip across several line types
const WHEEL_STEP_COOLDOWN_MS = 120

// the line-type trigger holds a chevron (size-4) plus the gap-2 before it on top of the measured text
const LINE_TYPE_CHEVRON_ALLOWANCE_PX = 24

type LineType = typeof lineTypes[number]

function isLineType(value: string): value is LineType {
    return (lineTypes as readonly string[]).includes(value)
}

// which icon the docked sidebar draws to the left of each team's abbreviation - a small color
// swatch (the original look) or that team's own logo, toggled via the control at the bottom of
// the sidebar
const sidebarIconModes = ['swatch', 'logo'] as const
type SidebarIconMode = typeof sidebarIconModes[number]

function isSidebarIconMode(value: string): value is SidebarIconMode {
    return (sidebarIconModes as readonly string[]).includes(value)
}

// size (in px) of the team logo rendered at the end of each line, adjustable via the "Logos"
// control in the docked tooltip panel
const MIN_LOGO_SIZE = 32
const MAX_LOGO_SIZE = 64
const LOGO_SIZE_STEP = 8
const DEFAULT_LOGO_SIZE = 48

// each team's line color comes from the backend (chartLineColor, measured from that season's
// logo). This is a safety net only, for a backend that predates that field or a team it hasn't
// colored yet
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

// pulls the winning team out of a playoffs payload, the same way PlayoffBracket.tsx does:
// the series winner if the final is decided, else null (an in-progress or not-yet-played
// postseason has no champion - buildBracketView itself returns null for an empty series list)
function championFromBracket(data: NhlBracketPayload | undefined): BracketTeamView | null {
    const view = buildBracketView(data)
    if (view === null) {
        return null
    }
    return view.final.top.won ? view.final.top : (view.final.bottom.won ? view.final.bottom : null)
}

type ChartTooltipPayloadItem = {
    dataKey?: string | number
    value?: number | string
    color?: string
    name?: string | number
}

// pads a point total's string form out to 3 characters so 1- and 2-digit totals right-align
// under 3-digit ones in the docked sidebar below. U+2007 (figure space) rather than a plain
// space or '0': it's a space character reserved to be digit-width, so it pads cleanly even if
// --mono's webfont fails to load and a proportional fallback takes over
const POINTS_PAD_CHAR = ' '

function formatPaddedPoints(value: number | string | undefined): string {
    return value === undefined ? '' : String(value).padStart(3, POINTS_PAD_CHAR)
}

type DockedTooltipPanelProps = {
    payload: ChartTooltipPayloadItem[] | null
    label?: string
    scrollContainerRef: React.RefObject<HTMLDivElement | null>
    teamLogoByAbbrev: Map<string, string>
    sidebarIconMode: SidebarIconMode
}

// docked along the chart's right edge instead of following the cursor, stretched to the chart's
// full height; rows always start at the top and stack downward in a single column (the panel's
// own height/scroll - not a fixed row/column grid - is what keeps a full 32-team list readable).
// the swatch/logo toggle that used to live pinned to the bottom of this panel now lives in the
// chart's top toolbar instead (see the right-justified control cluster there) - this component
// only reads sidebarIconMode to decide what each row draws
function DockedTooltipPanel({payload, label, scrollContainerRef, teamLogoByAbbrev, sidebarIconMode}: DockedTooltipPanelProps) {
    const sorted = payload ? [...payload].sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0)) : null

    return (
        <div className='h-full w-36 shrink-0 border-l flex flex-col text-xs'>
            <div ref={scrollContainerRef} className='flex-1 min-h-0 overflow-y-auto px-3 py-2'>
                {sorted && sorted.length > 0 ? (
                    <>
                        <div className='mb-1 font-medium'>{label && formatApiDateForDisplay(label)}</div>
                        <div className='flex flex-col'>
                            {sorted.map((item) => {
                                const abbrev = String(item.name ?? item.dataKey ?? '')
                                const logoFilename = teamLogoByAbbrev.get(abbrev)
                                return (
                                    <div key={item.dataKey} className='flex items-center gap-1.5 whitespace-nowrap py-0.5 [font-family:var(--mono)] tabular-nums'>
                                        {/* height-only (no fixed width): the source crests aren't
                                            square, so pinning both dimensions would letterbox the
                                            visible mark down well under this height */}
                                        {sidebarIconMode === 'logo' && logoFilename ? (
                                            <img src={getTeamLogoUrl(logoFilename, '1x')} alt='' className='h-8 w-auto shrink-0'/>
                                        ) : (
                                            <span className='inline-block size-2 shrink-0 rounded-[2px]' style={{backgroundColor: item.color}}/>
                                        )}
                                        <span>{abbrev}</span>
                                        <span className='ml-auto'>{formatPaddedPoints(item.value)}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                ) : (
                    <p className='text-muted-foreground'>Hover the chart to see values</p>
                )}
            </div>
        </div>
    )
}

export default function TeamStandingsChart() {
    const navigate = useNavigate()

    const [lineType, setLineType] = useLocalStorageState<LineType>('nhlStats.chart.lineType', 'monotone', {
        deserialize: (raw) => {
            const parsed = JSON.parse(raw)
            return isLineType(parsed) ? parsed : 'monotone'
        },
    })
    const [showDots, setShowDots] = useLocalStorageState<boolean>('nhlStats.chart.showDots', false)
    const [logoSize, setLogoSize] = useLocalStorageState<number>('nhlStats.chart.logoSize', DEFAULT_LOGO_SIZE)
    const [sidebarIconMode, setSidebarIconMode] = useLocalStorageState<SidebarIconMode>('nhlStats.chart.sidebarIconMode', 'swatch', {
        deserialize: (raw) => {
            const parsed = JSON.parse(raw)
            return isSidebarIconMode(parsed) ? parsed : 'swatch'
        },
    })
    const [selectedTeams, setSelectedTeams] = useLocalStorageState<string[]>('nhlStats.selectedTeams', [])  // NHL-49: have table, chart, and playoffs all sync to the same teams and season
    const [fromDate, setFromDate] = useLocalStorageState<Date>('nhlStats.chart.dateRange.from', new Date('2025-10-08'), {
        serialize: serializeDate,
        deserialize: deserializeDate,
    })
    const [toDate, setToDate] = useLocalStorageState<Date>('nhlStats.chart.dateRange.to', new Date('2026-04-18'), {
        serialize: serializeDate,
        deserialize: deserializeDate,
    })

    // double-click jumps us the the clicked-upon date in the Table
    const [, setTableDate] = useLocalStorageState<Date>('nhlStats.table.date', new Date(), {
        serialize: serializeDate,
        deserialize: deserializeDate,
    })
    const [, setClampedTableSeasonId] = useLocalStorageState<number|null>('nhlStats.table.clampedSeasonId', null)

    // '' until we've resolved a default; persisted on every change (useLocalStorageState writes back)
    const [season, setSeason] = useLocalStorageState<string>('nhlStats.season', '') // NHL-49: have table, chart, and playoffs all sync to the same teams and season
    const {data: defaultSeasonInfo} = useSeasonInfo()
    const defaultSeason = defaultSeasonInfo ? String(defaultSeasonInfo.seasonId) : ''
    const resolvedSeason = season || defaultSeason
    const {data: selectedSeason} = useSeasonInfo(resolvedSeason || undefined)

    // the swatch/logo toggle's "Logo" mode shows the selected season's Stanley Cup winner - the
    // same season the SeasonSelect/TeamChooser/date range above are all showing. A season still in
    // progress (or not yet started) has no decided champion - usePlayoffs then answers with an
    // empty series list rather than one (see usePlayoffs.ts) - so cupChampion is null and the
    // button below falls back to the plain NHL logo rather than reaching back to an older season
    const {data: selectedSeasonPlayoffs} = usePlayoffs(resolvedSeason)
    const cupChampion = championFromBracket(selectedSeasonPlayoffs)

    const minDate = selectedSeason ? parseApiDateString(selectedSeason.startDate) : undefined
    // clamp maxDate to yesterday for a season in progress - there's no data yet for the dates between
    // tomorrow and the season's real endDate, so there's no point offering those days in the picker
    let maxDate = selectedSeason ? parseApiDateString(selectedSeason.endDate) : undefined
    if(maxDate) {
        maxDate = limitDateToYesterday(maxDate)
    }

    // sizes the line-type select to exactly fit "monotone" (its longest choice) rather than some
    // guessed-at width; the sizer carries the trigger's own px-3, so the measured width already
    // includes horizontal padding (the chevron is added separately, see LINE_TYPE_CHEVRON_ALLOWANCE_PX).
    // Re-measures via ResizeObserver in case the webfont loads late.
    const lineTypeSizerRef = React.useRef<HTMLSpanElement | null>(null)
    const [lineTypeInputWidth, setLineTypeInputWidth] = React.useState<number | undefined>(undefined)
    React.useLayoutEffect(() => {
        const sizer = lineTypeSizerRef.current
        if (sizer === null) {
            return
        }
        const measure = () => setLineTypeInputWidth(sizer.getBoundingClientRect().width)
        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(sizer)
        return () => observer.disconnect()
    }, [])

    // mouse wheel over the (closed) line-type select steps through lineTypes, mirroring
    // SeasonSelect/EraSelect. Latest-value refs so the native listener can be bound once instead of
    // re-subscribed on every step (setLineType is React-stable, so it needs no ref).
    const lineTypeWrapperRef = React.useRef<HTMLDivElement | null>(null)
    const lineTypeOpenRef = React.useRef(false)
    const lineTypeRef = React.useRef(lineType)
    const lineTypeLastStepAtRef = React.useRef(0)
    React.useEffect(() => {
        lineTypeRef.current = lineType
    })

    // native, non-passive wheel listener: React's synthetic onWheel is passive so it can't
    // preventDefault the page scroll. Acts only while the dropdown is closed and the pointer is
    // over the control - wheel down picks the next entry in the list, wheel up the previous.
    React.useEffect(() => {
        const wrapper = lineTypeWrapperRef.current
        if (wrapper === null) {
            return
        }

        const handleWheel = (event: WheelEvent) => {
            if (lineTypeOpenRef.current || Math.abs(event.deltaY) < 1) {
                return
            }
            event.preventDefault()

            if (event.timeStamp - lineTypeLastStepAtRef.current < WHEEL_STEP_COOLDOWN_MS) {
                return
            }

            const currentIndex = lineTypes.indexOf(lineTypeRef.current)
            if (currentIndex === -1) {
                return
            }
            const step = event.deltaY > 0 ? 1 : -1
            const nextIndex = Math.min(Math.max(currentIndex + step, 0), lineTypes.length - 1)
            if (nextIndex !== currentIndex) {
                lineTypeLastStepAtRef.current = event.timeStamp
                setLineType(lineTypes[nextIndex])
            }
        }

        wrapper.addEventListener('wheel', handleWheel, {passive: false})
        return () => wrapper.removeEventListener('wheel', handleWheel)
    }, [setLineType])

    // mouse wheel over the (closed) logo-size control steps it up/down, mirroring the line-type
    // combo's wheel support just above. Wheel down shrinks the logos (the common "scroll down =
    // zoom out" convention), wheel up grows them; setLogoSize's functional updater already clamps
    // at MIN/MAX_LOGO_SIZE, so the handler doesn't need to duplicate that.
    //
    // state (a callback ref), not a plain useRef, for the same reason as chartWheelArea above:
    // it guarantees the listener attaches (or re-attaches) exactly when the DOM node exists,
    // rather than only if it already existed at this component's very first render.
    const [logoSizeControls, setLogoSizeControls] = React.useState<HTMLDivElement | null>(null)
    const logoSizeLastStepAtRef = React.useRef(0)
    React.useEffect(() => {
        const controls = logoSizeControls
        if (controls === null) {
            return
        }

        const handleWheel = (event: WheelEvent) => {
            if (Math.abs(event.deltaY) < 1) {
                return
            }
            event.preventDefault()

            if (event.timeStamp - logoSizeLastStepAtRef.current < WHEEL_STEP_COOLDOWN_MS) {
                return
            }
            logoSizeLastStepAtRef.current = event.timeStamp

            if (event.deltaY > 0) {
                setLogoSize((current) => Math.max(MIN_LOGO_SIZE, current - LOGO_SIZE_STEP))
            } else {
                setLogoSize((current) => Math.min(MAX_LOGO_SIZE, current + LOGO_SIZE_STEP))
            }
        }

        controls.addEventListener('wheel', handleWheel, {passive: false})
        return () => controls.removeEventListener('wheel', handleWheel)
    }, [logoSizeControls, setLogoSize])

    // when the selected season changes, snap the date range back inside it: keep the existing
    // from/to only if they already sit within the new season (and stay ordered), else fall back to
    // the whole season. clampedSeasonId is persisted (not plain React state) so a page refresh -
    // which remounts this component and would otherwise start clampedSeasonId back at null - doesn't
    // look like a season change and reset the user's picked range; only an actual change of
    // 'nhlStats.season' (which the Table, Chart, and Playoffs pages all share) leaves it mismatched
    // with selectedSeason.seasonId. Adjusted during render, React's recommended derive-from-changing-value way.
    const [clampedSeasonId, setClampedSeasonId] = useLocalStorageState<number | null>('nhlStats.chart.clampedSeasonId', null)
    if (selectedSeason && selectedSeason.seasonId !== clampedSeasonId) {
        setClampedSeasonId(selectedSeason.seasonId)
        const fromKey = formatDateForApi(fromDate)
        const toKey = formatDateForApi(toDate)
        const rangeFitsSeason =
            fromKey >= selectedSeason.startDate && fromKey <= selectedSeason.endDate &&
            toKey >= selectedSeason.startDate && toKey <= selectedSeason.endDate &&
            fromKey < toKey
        if (!rangeFitsSeason) {
            setFromDate(parseApiDateString(selectedSeason.startDate))
            setToDate(maxDate ?? parseApiDateString(selectedSeason.endDate))
        }
    }

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

    function handleChartMouseMove(state: { activePayload?: ChartTooltipPayloadItem[], activeLabel?: string }) {
        if (state.activePayload && state.activePayload.length > 0) {
            setHoveredPayload(state.activePayload)
            setHoveredLabel(state.activeLabel)
        }
    }

    function handleChartMouseLeave() {
        setHoveredPayload(null)
        setHoveredLabel(undefined)
    }

    function handleChartDoubleClick({activeLabel} : { activeLabel?: string }) {
        if(activeLabel) {
            // set the table date that the table uses to decide which data to show
            setTableDate(parseApiDateString(activeLabel))
            navigate({to: '/nhl_standings'})

            // also clear out the table's "clamped" season id, so that if we changed the
            // seasonId here on the chart to something other than the last season selected
            // on the table, the table doesn't "stomp us" by defaulting to "last day of
            // the selected season"
            if(selectedSeason) {
                setClampedTableSeasonId(selectedSeason.seasonId)
            }
        }
    }

    // the docked sidebar's row list only has content while the mouse is over the chart (it's
    // what populates hoveredPayload above), so a user can never move the mouse onto the sidebar
    // itself to scroll it - doing so leaves the chart and clears the very data they were trying to
    // scroll through. Forwarding wheel events from the chart area to the sidebar's own scroll
    // container solves that: scrolling while hovering the chart scrolls the list without the
    // mouse ever having to leave it. Native, non-passive listener for the same reason as the
    // line-type/logo-size wheel handlers above - React's synthetic onWheel can't preventDefault.
    //
    // chartWheelArea is state (a callback ref), not a plain useRef: this component itself doesn't
    // remount when chartArea's conditional branches swap (loading/error/empty vs. the real chart),
    // so a plain ref read inside a []-deps effect would only ever see the DOM node if it already
    // existed at TeamStandingsChart's own first render - it's usually still null then, mid-fetch,
    // and never gets attached once the chart later appears. State forces the effect to re-run
    // exactly when the node actually mounts.
    const [chartWheelArea, setChartWheelArea] = React.useState<HTMLDivElement | null>(null)
    const sidebarScrollRef = React.useRef<HTMLDivElement | null>(null)
    const chartCtrlWheelLastStepAtRef = React.useRef(0)
    React.useEffect(() => {
        if (chartWheelArea === null) {
            return
        }

        const handleWheel = (event: WheelEvent) => {
            if (Math.abs(event.deltaY) < 1) {
                return
            }

            // ctrl+wheel (or a trackpad pinch, which the browser reports the same way) resizes the
            // chart's own logos instead of scrolling the sidebar - preventDefault matters even more
            // here, since the browser's own default for ctrl+wheel is to zoom the whole page
            if (event.ctrlKey) {
                event.preventDefault()

                if (event.timeStamp - chartCtrlWheelLastStepAtRef.current < WHEEL_STEP_COOLDOWN_MS) {
                    return
                }
                chartCtrlWheelLastStepAtRef.current = event.timeStamp

                if (event.deltaY > 0) {
                    setLogoSize((current) => Math.max(MIN_LOGO_SIZE, current - LOGO_SIZE_STEP))
                } else {
                    setLogoSize((current) => Math.min(MAX_LOGO_SIZE, current + LOGO_SIZE_STEP))
                }
                return
            }

            const sidebarScroll = sidebarScrollRef.current
            if (sidebarScroll === null) {
                return
            }
            event.preventDefault()
            sidebarScroll.scrollTop += event.deltaY
        }

        chartWheelArea.addEventListener('wheel', handleWheel, {passive: false})
        return () => chartWheelArea.removeEventListener('wheel', handleWheel)
    }, [chartWheelArea, setLogoSize])

    const handleDecreaseLogoSize = () => setLogoSize((current) => Math.max(MIN_LOGO_SIZE, current - LOGO_SIZE_STEP))
    const handleIncreaseLogoSize = () => setLogoSize((current) => Math.min(MAX_LOGO_SIZE, current + LOGO_SIZE_STEP))
    const handleToggleSidebarIconMode = () => setSidebarIconMode((current) => current === 'swatch' ? 'logo' : 'swatch')

    // the "from" and "to" dates are never allowed to cross (from after to) or land on the same
    // day - whichever end the user just moved "wins", and the other end gets nudged out of the way
    const handleFromDateSelect = (selected: Date | undefined) => {
        const newFrom = selected ?? new Date()
        setFromDate(newFrom)
        if (isAfter(newFrom, toDate) || isSameDay(newFrom, toDate)) {
            setToDate(addDays(newFrom, 7))
        }
    }

    const handleToDateSelect = (selected: Date | undefined) => {
        const newTo = selected ?? new Date()
        setToDate(newTo)
        if (isBefore(newTo, fromDate) || isSameDay(newTo, fromDate)) {
            setFromDate(subDays(newTo, 7))
        }
    }

    const handleLineTypeChange = (value: string) => {
        if (isLineType(value)) {
            setLineType(value)
        }
    }

    const fromDateContextValue = {
        date: fromDate,
        setDate: handleFromDateSelect
    }

    const toDateContextValue = {
        date: toDate,
        setDate: handleToDateSelect
    }

    const {data: teamStats, isPending, isPlaceholderData, error} = useTeamStats(fromDate, toDate)

    // the controls below stay mounted regardless of loading/error/selection state, so TeamChooser
    // never remounts (and loses its committed selection) on refetch; only the chart area swaps out
    let chartArea: React.ReactNode
    if (selectedTeams.length === 0) {
        chartArea = <p className='p-4 text-center'>No teams selected</p>
    } else if (isPending || isPlaceholderData) {
        // useTeamStats keeps the previous date range's data as placeholderData so React Query has
        // something to show during a refetch; for the chart we'd rather blank it out immediately and
        // show "Loading..." than leave stale points on screen while the new range loads
        chartArea = <p className='p-4 text-center'>Loading...</p>
    } else if (error) {
        chartArea = <p className='p-4 text-center'>An error occurred: {error.message}</p>
    } else {
        // clear out any old data
        const chartData: Record<string, string | number>[] = []
        const teamNameByAbbrev = new Map<string, string>()
        const teamLogoByAbbrev = new Map<string, string>()
        const teamColorByAbbrev = new Map<string, string>()

        teamStats.forEach((teamStatEntry: TeamStatEntry) => {
            // get data entry for the given date
            let existingDate = chartData.find((entry) => entry['date'] == teamStatEntry.date)
            if (!existingDate) {
                existingDate = {date: teamStatEntry.date}
                chartData.push(existingDate)
            }

            // add an entry associating this team's abbreviation with this team's points
            existingDate[teamStatEntry.teamAbbrev] = teamStatEntry.points
            teamNameByAbbrev.set(teamStatEntry.teamAbbrev, teamStatEntry.teamName)
            teamLogoByAbbrev.set(teamStatEntry.teamAbbrev, teamStatEntry.logo)
            if (teamStatEntry.chartLineColor) {
                teamColorByAbbrev.set(teamStatEntry.teamAbbrev, teamStatEntry.chartLineColor)
            }
        })

        const colorForTeam = (abbrev: string) => teamColorByAbbrev.get(abbrev) ?? randomColorForTeam(abbrev)

        // only show teams currently selected in the TeamChooser (guaranteed non-empty here)
        const teamAbbrevsInData = Array.from(teamNameByAbbrev.keys())
        const visibleTeamAbbrevs = teamAbbrevsInData.filter((abbrev) => selectedTeams.includes(abbrev))

        // smaller than logoSize so stacked logos' boxes overlap a bit - the logo artwork itself
        // has some blank padding baked into its own SVG, so touching boxes alone still look gapped
        const logoStackSpacing = logoSize - 8

        const chartConfig: ChartConfig = {}
        visibleTeamAbbrevs.forEach((abbrev) => {
            chartConfig[abbrev] = {
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
                const {key, cx, cy, index, value} = props as { key?: string, cx?: number, cy?: number, index?: number, value?: number }
                const logoFilename = teamLogoByAbbrev.get(abbrev)

                if (typeof value === 'number' && typeof index === 'number' && logoFilename) {
                    const offset = logoStackOffset(index, abbrev)
                    const logo = (
                        <image
                            key={key}
                            href={getTeamLogoUrl(logoFilename, '2x')}
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
            <div className='flex h-full w-full flex-row'>
                {/* wraps ChartContainer (rather than ref-ing it directly) purely so the wheel
                    listener above has a plain DOM node to attach to */}
                <div ref={setChartWheelArea} className='h-full min-w-0 flex-1'>
                    <ChartContainer config={chartConfig} className='h-full w-full aspect-auto'>
                        <LineChart
                            data={chartData}
                            onMouseMove={handleChartMouseMove}
                            onMouseLeave={handleChartMouseLeave}
                            onDoubleClick={handleChartDoubleClick}
                            margin={{
                                top: 12,
                                bottom: 12,
                                left: 24,
                                right: 12 + logoSize / 2,
                            }}
                        >
                            <CartesianGrid vertical={false} stroke='var(--navbar-bg)'/>
                            <XAxis
                                dataKey='date'
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
                                    // points are never negative, so the axis shouldn't dip below zero just
                                    // to pad the bottom of the chart; the top tracks the data exactly, with
                                    // no headroom padding above the current max
                                    return [Math.max(0, Math.floor(dataMin - padding)), dataMax]
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
                            {/* pointerEvents='none': these <image>s are purely decorative - hover
                                tracking is driven by mouse position over the chart container, not by
                                which element the cursor is over - so nothing depends on them receiving
                                pointer events. Without this, clicking a logo lets the browser treat it
                                as a native selectable/draggable image, which shows its own selection
                                outline around the whole overlay group until something else clears it */}
                            <g ref={setLogoOverlayNode} pointerEvents='none'/>
                        </LineChart>
                    </ChartContainer>
                </div>
                <DockedTooltipPanel
                    payload={hoveredPayload}
                    label={hoveredLabel}
                    scrollContainerRef={sidebarScrollRef}
                    teamLogoByAbbrev={teamLogoByAbbrev}
                    sidebarIconMode={sidebarIconMode}
                />
            </div>
        )
    }

    return (
        <div className='h-full flex flex-col px-4'>
            <div className='w-full flex flex-row flex-wrap items-center justify-start gap-x-4 gap-y-2 py-2 shrink-0'>
                <SeasonSelect value={resolvedSeason} onChange={setSeason}/>
                <div className='flex flex-row items-center gap-2 shrink-0'>
                    <FieldLabel className='justify-start whitespace-nowrap'>Date Range:</FieldLabel>
                    <DateContext value={fromDateContextValue}>
                        <DatePickerWithNav id='date-picker-from' tooltip='From' minDate={minDate} maxDate={maxDate}/>
                    </DateContext>
                    <ArrowRightLeftIcon className='size-4 shrink-0 text-muted-foreground'/>
                    <DateContext value={toDateContextValue}>
                        <DatePickerWithNav id='date-picker-to' tooltip='To' minDate={minDate} maxDate={maxDate}/>
                    </DateContext>
                </div>
                <TeamChooser season={resolvedSeason} selected={selectedTeams} onChange={setSelectedTeams}/>
                {/* hidden twin of the longest line-type choice, measured to size the select */}
                <span
                    ref={lineTypeSizerRef}
                    aria-hidden
                    className='pointer-events-none invisible absolute px-3 text-sm whitespace-nowrap'
                >
                    {longestLineType}
                </span>
                <Tooltip>
                    {/* trigger wraps only the select, so the tooltip stays put - the box's width
                        is fixed (sized to "monotone"), so unlike EraSelect/SeasonSelect there's no
                        variable-width neighbor that could shift it */}
                    <TooltipTrigger asChild>
                        <div ref={lineTypeWrapperRef} className='flex'>
                            <Select
                                value={lineType}
                                onValueChange={handleLineTypeChange}
                                onOpenChange={(open) => {
                                    lineTypeOpenRef.current = open
                                }}
                            >
                                <SelectTrigger
                                    style={lineTypeInputWidth !== undefined ? {width: `${lineTypeInputWidth + LINE_TYPE_CHEVRON_ALLOWANCE_PX}px`} : undefined}
                                >
                                    <SelectValue placeholder='Select a line type'/>
                                </SelectTrigger>
                                <SelectContent position='popper'>

                                    {lineTypes.map((item) => (
                                        <SelectItem key={item} value={item}>
                                            {item}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side='top'>Line Type</TooltipContent>
                </Tooltip>
                <FieldGroup className='w-auto shrink-0'>
                    <Field orientation='horizontal' className='gap-0.5'>
                        <Checkbox
                            id='show-dots-checkbox-basic'
                            name='show-dots-checkbox-basic'
                            checked={showDots}
                            onCheckedChange={(checked) => setShowDots(checked === true)}
                            className='border-neutral-800'
                        />
                        <FieldLabel htmlFor='show-dots-checkbox-basic' className='whitespace-nowrap'>
                            Show Dots
                        </FieldLabel>
                    </Field>
                </FieldGroup>
                {/* ml-auto pushes this cluster (and everything after it, there's nothing else) to
                    the right edge of the toolbar row, separate from the left-justified controls above */}
                <div className='ml-auto flex items-center gap-4 shrink-0'>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div ref={setLogoSizeControls} className='flex items-center gap-2 shrink-0'>
                                <Button variant='outline' size='icon-xs' onClick={handleDecreaseLogoSize} disabled={logoSize <= MIN_LOGO_SIZE}>-</Button>
                                <span className='pl-1 pr-1'>{logoSize}px</span>
                                <Button variant='outline' size='icon-xs' onClick={handleIncreaseLogoSize} disabled={logoSize >= MAX_LOGO_SIZE}>+</Button>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side='top'>Adjust the size of team logos on the chart (CTRL+MOUSEWHEEL over chart)</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            {/* a toggle button, not a plain click-through button: aria-pressed (and the
                                selected-state background below) reflect sidebarIconMode directly -
                                pressed/selected = logos in the sidebar, unpressed = swatches. Its
                                content is always the champion logo (or the NHL fallback) regardless of
                                that state; the toggle no longer has a text label at all */}
                            <button
                                type='button'
                                onClick={handleToggleSidebarIconMode}
                                aria-pressed={sidebarIconMode === 'logo'}
                                aria-label={sidebarIconMode === 'logo' ? 'Showing team logos in the sidebar' : 'Showing team swatches in the sidebar'}
                                className={cn(
                                    'flex items-center justify-center shrink-0 rounded-md p-1 hover:bg-accent hover:text-accent-foreground',
                                    sidebarIconMode === 'logo' && 'bg-accent text-accent-foreground',
                                )}
                            >
                                {cupChampion ? (
                                    // our own backend renders every team crest onto a fixed square
                                    // canvas with a lot of blank padding baked in around the mark
                                    // itself (not just aspect-ratio letterboxing) - clipping the box
                                    // and scaling the image up crops most of that padding away rather
                                    // than just shrinking the visible mark inside a bigger empty box
                                    <span className='relative size-8 shrink-0 overflow-hidden rounded-sm'>
                                        <img
                                            src={getTeamLogoUrl(cupChampion.logoFilename, '1x')}
                                            alt=''
                                            className='absolute inset-0 h-full w-full scale-[1.4] object-contain'
                                        />
                                    </span>
                                ) : (
                                    // the selected season's postseason isn't decided yet (in progress,
                                    // or not yet started) - fall back to the plain NHL logo
                                    <img src={nhlLogoSmall} alt='' className='h-6 w-auto shrink-0'/>
                                )}
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side='top'>Click to toggle between team swatches and team logos in the sidebar</TooltipContent>
                    </Tooltip>
                </div>
            </div>
            <div className='flex-1 min-h-0 flex justify-center'>
                <Card className='w-full flex flex-col overflow-hidden'>
                    <CardHeader className='shrink-0'>
                        <CardTitle>Team Standings Over Time ({seasonIdToLabel(resolvedSeason)})</CardTitle>
                        <CardDescription>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className='flex-1 min-h-0 overflow-hidden'>
                        {chartArea}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
