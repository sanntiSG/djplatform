import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.js'
import './index.css'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .catch(() => { /* SW registration is best-effort */ })
  })
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: 'always',
      refetchOnReconnect: 'always',
      retry: 1,
    },
  },
})

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

const container = document.getElementById('root')!
const root = ReactDOM.createRoot(container)

if (googleClientId) {
  root.render(
    <React.StrictMode>
      <GoogleOAuthProvider clientId={googleClientId}>
        <Root />
      </GoogleOAuthProvider>
    </React.StrictMode>,
  )
} else {
  root.render(
    <React.StrictMode>
      <Root />
    </React.StrictMode>,
  )
}
