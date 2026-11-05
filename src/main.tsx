import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {RouterProvider} from '@tanstack/react-router'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {ThemeProvider} from '@somedaytundra/theme'

import ClerkThemedProvider from '@/components/auth/ClerkThemedProvider.tsx'
import './index.css'
import {router} from './router.tsx'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ThemeProvider>
            <ClerkThemedProvider>
                <QueryClientProvider client={queryClient}>
                    <RouterProvider router={router}/>
                </QueryClientProvider>
            </ClerkThemedProvider>
        </ThemeProvider>
    </StrictMode>
)
