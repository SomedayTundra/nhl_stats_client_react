import {API_BASE_URL} from '@/lib/apiConfig.ts'

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, init)
    if (!response.ok) {
        throw new Error(`An error occurred: ${response.statusText}`)
    }
    return (await response.json()) as T
}
