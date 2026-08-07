import * as React from 'react'

type Options<T> = {
    serialize?: (value: T) => string
    deserialize?: (raw: string) => T
}

function readFromStorage<T>(key: string, defaultValue: T, deserialize: (raw: string) => T): T {
    try {
        const raw = window.localStorage.getItem(key)
        if (raw === null) return defaultValue
        return deserialize(raw)
    } catch {
        // corrupt/foreign value under this key, or storage unavailable (private browsing,
        // quota exceeded) - persistence is a nice-to-have here, fall back to the default
        return defaultValue
    }
}

// same shape as React.useState, but the value is read from and written back to
// localStorage under `key` so it survives navigating away and back
export function useLocalStorageState<T>(
    key: string,
    defaultValue: T,
    options?: Options<T>
): [T, React.Dispatch<React.SetStateAction<T>>] {
    const serialize = options?.serialize ?? ((value: T) => JSON.stringify(value))
    const deserialize = options?.deserialize ?? ((raw: string) => JSON.parse(raw) as T)

    const [state, setState] = React.useState<T>(() => readFromStorage(key, defaultValue, deserialize))

    React.useEffect(() => {
        try {
            window.localStorage.setItem(key, serialize(state))
        } catch {
            // storage unavailable/full - nothing useful to do, persistence just doesn't happen
        }
    }, [key, state, serialize])

    return [state, setState]
}
