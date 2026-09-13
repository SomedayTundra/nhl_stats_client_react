import {SeasonSelect} from '@/components/SeasonSelect.tsx'
import PlayoffBracket from '@/components/PlayoffBracket.tsx'
import {useLatestSeasonId} from '@/hooks/useSeasonInfo.ts'
import {useLocalStorageState} from '@/lib/useLocalStorageState.ts'

export default function Playoffs() {
    // '' until we've resolved a default; persisted on every change, same as the table's picker
    const [season, setSeason] = useLocalStorageState<string>('nhlStats.playoffs.season', '')
    const defaultSeason = useLatestSeasonId()
    const resolvedSeason = season || defaultSeason

    return (
        <>
            <div className='w-9/12 mx-auto flex flex-row items-center gap-4 py-2 top-controls-container'>
                <SeasonSelect value={resolvedSeason} onChange={setSeason}/>
            </div>
            <PlayoffBracket season={resolvedSeason}/>
        </>
    )
}
