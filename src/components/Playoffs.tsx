import {SeasonSelect} from '@/components/SeasonSelect.tsx'
import PlayoffBracket from '@/components/PlayoffBracket.tsx'
import {useSeasonInfo} from '@/hooks/useSeasonInfo.ts'
import {useLocalStorageState} from '@/lib/useLocalStorageState.ts'

export default function Playoffs() {
    // '' until we've resolved a default; persisted on every change, same as the table's picker
    const [season, setSeason] = useLocalStorageState<string>('nhlStats.season', '')     // NHL-49: have table, chart, and playoffs all sync to the same season
    const {data: defaultSeasonInfo} = useSeasonInfo()
    const defaultSeason = defaultSeasonInfo ? String(defaultSeasonInfo.seasonId) : ''
    const resolvedSeason = season || defaultSeason

    return (
        <div className='h-full flex flex-col'>
            <div className='w-full flex flex-row items-center gap-4 py-2 top-controls-container shrink-0'>
                <SeasonSelect value={resolvedSeason} onChange={setSeason}/>
            </div>
            <div className='flex-1 min-h-0 flex justify-center'>
                <PlayoffBracket season={resolvedSeason}/>
            </div>
        </div>
    )
}
