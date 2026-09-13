import {useQuery} from '@tanstack/react-query'
import {apiFetch} from '@/lib/apiFetch.ts'
import type {NhlBracketPayload} from '@/lib/playoffBracket.ts'

// GET /api/playoffs/{year} -> that postseason's full bracket. The backend takes the single year
// the Cup was awarded in, which is the back half of a seasonId ('20242025' -> 2025).
export function usePlayoffs(seasonId: string) {
    const year = seasonId ? Number(seasonId.slice(4, 8)) : undefined

    return useQuery<NhlBracketPayload>({
        queryKey: ['playoffs', year],
        queryFn: ({signal}) => apiFetch<NhlBracketPayload>(`/playoffs/${year}`, {signal}),
        enabled: year !== undefined,
        // a finished postseason never changes, and the backend caches it in Mongo anyway
        staleTime: Infinity,
    })
}
