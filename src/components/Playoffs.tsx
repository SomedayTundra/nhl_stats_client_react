import {SeasonSelect} from '@/components/SeasonSelect.tsx'
import PlayoffBracket from '@/components/PlayoffBracket.tsx'
import {useSeasonInfo} from '@/hooks/useSeasonInfo.ts'
import {useLocalStorageState} from '@/lib/useLocalStorageState.ts'

export default function Playoffs() {
    // NHL-49: have table, chart, and playoffs all sync to the same season 'nhlStats.season'
    const [season, setSeasonId] = useLocalStorageState<string>('nhlStats.season', '')

    // defaultSeasonInfo = get the "current" seasonInfo by calling useSeasonInfo with no seasonId specified
    const {data: defaultSeasonInfo} = useSeasonInfo()
    const defaultSeasonId = defaultSeasonInfo ? String(defaultSeasonInfo.seasonId) : ''

    // if we had something stored locally under 'nhlStats.season', use that seasonId, otherwise, use the defaultSeasonId
    const resolvedSeasonId = season || defaultSeasonId

    return (
        <div className='h-full flex flex-col'>
            <div className='w-full flex flex-row items-center gap-4 py-2 top-controls-container shrink-0'>
                <SeasonSelect value={resolvedSeasonId} onChange={setSeasonId}/>
            </div>
            <div className='flex-1 min-h-0 flex justify-center'>
                <PlayoffBracket seasonId={resolvedSeasonId}/>
            </div>
        </div>
    )
}
