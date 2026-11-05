/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** Base URL of the FastAPI backend, including the /api prefix. */
    readonly VITE_API_BASE_URL?: string
    /** Clerk publishable key (pk_test_... / pk_live_...); unset, the app runs signed out. */
    readonly VITE_CLERK_PUBLISHABLE_KEY?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
