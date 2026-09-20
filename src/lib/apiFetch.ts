import {API_BASE_URL} from '@/lib/apiConfig.ts'

/**
 * A thin wrapper that simplifies our various JSON-payload-based API requests over in /src/hooks.
 *
 * We specify a path and an optional RequestInit, and we get back a
 * json() Promise.
 *
 * The generic <T> lets us specify whatever payload shape we want when we call
 * this method.
 *
 * @param path the full API path; note that "/api/{path}" is the shape, and since the "/api"
 * bit changes between dev and prod, callers don't need to trouble themselves with it
 * @param init a standard RequestInit, which we use primarily to hand an AbortController
 * in there in case we need to scrap a request before it completes
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, init)
    if (!response.ok) {
        throw new Error(`An error occurred: ${response.statusText}`)
    }
    return (await response.json()) as T
}
