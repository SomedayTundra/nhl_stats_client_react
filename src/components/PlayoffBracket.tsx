import type * as React from 'react'
import {getTeamLogoUrl} from '@/lib/teamLogo.ts'
import {usePlayoffs} from '@/hooks/usePlayoffs.ts'
import {buildBracketView, type BracketSideView, type BracketSlot, type BracketTeamView} from '@/lib/playoffBracket.ts'
import {seasonIdToLabel} from '@/lib/season.ts'

type PlayoffBracketProps = {
    // the seasonId whose postseason to show, e.g. '20242025' (empty until the page resolves one)
    season: string
}

// keep in sync with --bracket-row-height in index.css: a series card is two of these stacked, and
// that's what the grid's content-row track below is sized off of
const BRACKET_ROW_HEIGHT_REM = 2.8

// the NHL's own crest URL, used only when our backend doesn't have that era's logo on disk
function handleLogoError(event: React.SyntheticEvent<HTMLImageElement>, fallbackUrl: string) {
    const image = event.currentTarget
    if (fallbackUrl !== '' && image.src !== fallbackUrl) {
        image.src = fallbackUrl
    }
}

// each team always shows its own win count in this series - the winner's as a filled pill
// (.bracket-team[data-outcome='won'] .bracket-record in index.css), the loser's as a plain digit
function TeamRow({team}: {team: BracketTeamView}) {
    return (
        <div className='bracket-team' data-outcome={team.won ? 'won' : 'lost'}>
            <img
                src={getTeamLogoUrl(team.logoFilename, '2x')}
                alt=''
                loading='lazy'
                onError={(event) => handleLogoError(event, team.logoFallbackUrl)}
            />
            <span className='bracket-team-name'>{team.commonName}</span>
            <span className='bracket-record'>{team.wins}</span>
        </div>
    )
}

function Slot({slot, depth}: {slot: BracketSlot; depth: number}) {
    if (slot.kind === 'empty') {
        return <div className='bracket-empty'/>
    }
    if (slot.kind === 'bye') {
        return (
            <div className='bracket-bye bracket-slot'>
                <span className='bracket-bye-team'>{slot.teamName}</span>
                <span className='bracket-bye-note'>Bye</span>
            </div>
        )
    }
    const {series} = slot
    return (
        <div className='bracket-series bracket-slot' data-depth={depth}>
            <TeamRow team={series.top}/>
            <TeamRow team={series.bottom}/>
        </div>
    )
}

// slots pair up two-at-a-time, in the order they were built, so each pair is exactly the two
// series that fed one series in the next round - which is what the connector spine draws between
function pairUp(slots: BracketSlot[]): BracketSlot[][] {
    const pairs: BracketSlot[][] = []
    for (let i = 0; i < slots.length; i += 2) {
        pairs.push(slots.slice(i, i + 2))
    }
    return pairs
}

// each column, tagged with how deep it sits (0 = the round that feeds the final, which is drawn
// heaviest) and whether it's the one that connects straight into the Cup panel
function columnsWithDepth(side: BracketSideView) {
    return side.columns.map((column, index) => ({
        column,
        depth: side.columns.length - 1 - index,
        feedsFinal: index === side.columns.length - 1,
    }))
}

function SideColumns({side, sideName}: {side: BracketSideView; sideName: 'left' | 'right'}) {
    // the right side reads inward-out, so its outermost round sits furthest right and the two
    // halves mirror each other around the Cup
    const columns = sideName === 'right' ? columnsWithDepth(side).reverse() : columnsWithDepth(side)

    return (
        <>
            {columns.map(({column, depth, feedsFinal}) => (
                <div className='bracket-column' data-side={sideName} key={`${sideName}-${depth}`}>
                    {pairUp(column.slots).map((pair, pairIndex) => (
                        <div
                            className='bracket-pair'
                            // a pair that's entirely the blank half of a bye draws no connectors,
                            // or we'd leave a spine hanging in open space
                            data-join={pair.every((slot) => slot.kind === 'empty')
                                ? 'none'
                                : (feedsFinal ? 'final' : 'pair')}
                            key={pairIndex}
                        >
                            {pair.map((slot) => <Slot key={slot.key} slot={slot} depth={depth}/>)}
                        </div>
                    ))}
                </div>
            ))}
        </>
    )
}

// Fallback only: the payload carries the NHL's own Stanley Cup shield for every season we've
// checked, so this hand-drawn stand-in is here for one that doesn't. Flared bowl, narrow collar,
// and the stepped bands of the base - the gaps between the bands are what make it read as the Cup.
function CupMark() {
    return (
        <svg className='bracket-cup' viewBox='0 0 26 32' aria-hidden='true'>
            <path d='M1.6 1h22.8v2.2H1.6z'/>
            <path d='M2.9 3.6h20.2l-4.4 7.1H7.3z' opacity='0.95'/>
            <path d='M11.1 10.9h3.8v2.2h-3.8z' opacity='0.8'/>
            <path d='M8.4 13.4h9.2l0.5 3.6H7.9z' opacity='0.9'/>
            <path d='M7.1 17.6h11.8l0.6 4.4H6.5z' opacity='0.8'/>
            <path d='M5.6 22.6h14.8l0.7 4.8H4.9z' opacity='0.7'/>
            <path d='M4 28h18v3.2H4z' opacity='0.6'/>
        </svg>
    )
}

// same rule as TeamRow: each finalist always shows its own win count, winner pilled, loser plain
function FinalTeam({team}: {team: BracketTeamView}) {
    return (
        <div className='bracket-final-team' data-outcome={team.won ? 'won' : 'lost'}>
            <img
                src={getTeamLogoUrl(team.logoFilename, '2x')}
                alt=''
                onError={(event) => handleLogoError(event, team.logoFallbackUrl)}
            />
            <span className='bracket-final-name'>{team.commonName}</span>
            <span className='bracket-final-record'>{team.wins}</span>
        </div>
    )
}

export default function PlayoffBracket({season}: PlayoffBracketProps) {
    const {data, isPending, isFetching, error} = usePlayoffs(season)
    const view = buildBracketView(data)

    let content: React.ReactNode
    if (season === '' || isPending || isFetching) {
        // a season change swaps the query key, so this covers the wait for the new year's bracket
        content = <p className='bracket-message'>Loading...</p>
    } else if (error) {
        content = <p className='bracket-message'>An error occurred: {error.message}</p>
    } else if (view === null) {
        content = <p className='bracket-message'>No playoff results for {seasonIdToLabel(season)}.</p>
    } else {
        const {final} = view
        const champion = final.top.won ? final.top : (final.bottom.won ? final.bottom : null)
        const columnCount = view.left.columns.length

        // the outermost round has the most slots (byes included, since a bye still occupies a slot
        // - see buildBracketView) and so needs the most vertical room; take both sides' outermost
        // column in case an unusual historical bracket isn't symmetric
        const firstRoundSlots = Math.max(
            view.left.columns[0]?.slots.length ?? 0,
            view.right.columns[0]?.slots.length ?? 0,
        )
        // each slot is a two-team-row series card. minmax's floor is what forces a tall bracket to
        // grow past its panel (triggering the panel's scrollbar) instead of its rows shrinking
        // below BRACKET_ROW_HEIGHT_REM to fit; the 1fr half is what lets a short bracket still
        // stretch to fill the whole panel instead of leaving blank space beneath it
        const contentHeightRem = firstRoundSlots * 2 * BRACKET_ROW_HEIGHT_REM

        content = (
            <div
                className='bracket'
                style={{
                    gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr)) 1.5fr repeat(${columnCount}, minmax(0, 1fr))`,
                    gridTemplateRows: `auto minmax(${contentHeightRem}rem, 1fr)`,
                    // per-column width has to fit a one-word name like "Hurricanes" on one line at
                    // --bracket-name-size next to a --bracket-logo-size logo and a record chip -
                    // keep in sync with those two if either changes
                    minWidth: `${14 + columnCount * 24}rem`,
                }}
            >
                {columnsWithDepth(view.left).map(({column, depth}) => (
                    <p className='bracket-round-label' key={`left-label-${depth}`}>{column.label}</p>
                ))}
                <p className='bracket-round-label' data-final='true'>{view.finalTitle}</p>
                {columnsWithDepth(view.right).reverse().map(({column, depth}) => (
                    <p className='bracket-round-label' key={`right-label-${depth}`}>{column.label}</p>
                ))}

                <SideColumns side={view.left} sideName='left'/>
                <div className='bracket-final'>
                    {champion !== null ? (
                        <img
                            className='bracket-winner-logo'
                            src={getTeamLogoUrl(champion.logoFilename, '2x')}
                            alt=''
                            onError={(event) => handleLogoError(event, champion.logoFallbackUrl)}
                        />
                    ) : view.finalLogoUrl !== '' ? (
                        <img className='bracket-cup-logo' src={view.finalLogoUrl} alt=''/>
                    ) : (
                        <CupMark/>
                    )}
                    <FinalTeam team={final.top}/>
                    <FinalTeam team={final.bottom}/>
                </div>
                <SideColumns side={view.right} sideName='right'/>
            </div>
        )
    }

    return (
        <div className='w-full border rounded-lg overflow-hidden flex flex-col'>
            <div className='relative w-full flex-1 min-h-0 bracket-panel'>
                {content}
            </div>
        </div>
    )
}
