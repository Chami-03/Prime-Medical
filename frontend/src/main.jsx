import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import './index.css'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            staleTime: 30_000,
            refetchOnWindowFocus: true,
            refetchInterval: 5000,
            refetchIntervalInBackground: true,
        },
    },
})

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <AuthProvider>
                    <App />
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 4000,
                            style: { borderRadius: '10px', fontSize: '14px' },
                            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
                            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
                        }}
                    />
                </AuthProvider>
            </ThemeProvider>
        </QueryClientProvider>
    </React.StrictMode>,
)
