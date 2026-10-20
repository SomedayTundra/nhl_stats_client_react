// Base URL for the FastAPI backend. Set VITE_API_BASE_URL at build time for deployments
// (e.g. https://api.somedaytundra.com/api); falls back to the local dev server otherwise.
export const API_BASE_URL: string =
    import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'
