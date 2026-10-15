"use client"

import React from "react"
import LandingPage from "@/components/LandingPage"
import { api } from "@/services/api"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom"

const queryClient = new QueryClient()

const MainApp = React.lazy(() => import('@/components/MainApp'))
const PrivacyPolicy = React.lazy(() => import('@/components/PrivacyPolicy'))

// Shell-shaped placeholder while the dashboard chunk loads
const dashboardSpinner = (
  <div className="flex min-h-[100dvh] bg-background" aria-busy="true" aria-label="Loading MYNAB">
    <div className="hidden w-[248px] shrink-0 flex-col gap-3 border-r border-border/70 p-5 md:flex">
      <div className="h-8 w-28 rounded-lg bg-muted" />
      <div className="mt-6 flex flex-col gap-2">
        {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-10 rounded-xl bg-muted/70" />)}
      </div>
    </div>
    <div className="flex-1 px-4 pt-9 md:px-10">
      <div className="h-3 w-32 rounded bg-muted" />
      <div className="mt-3 h-10 w-72 max-w-full rounded-xl bg-muted" />
      <div className="mt-10 grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <div className="h-64 rounded-[1.75rem] bg-muted/70" />
        <div className="h-64 rounded-[1.75rem] bg-muted/70" />
      </div>
    </div>
  </div>
)

function ProtectedRoute({ isAuthenticated, children }) {
  if (!isAuthenticated) return <Navigate to="/" replace />
  return <React.Suspense fallback={dashboardSpinner}>{children}</React.Suspense>
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsAuthenticated(api.isAuthenticated())
    setIsLoading(false)
  }, [])

  const handleAuthenticated = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    api.logout()
    setIsAuthenticated(false)
  }

  if (isLoading) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-background">
        <img src="/android-chrome-192x192.png" alt="MYNAB" className="size-12 animate-pulse rounded-2xl object-cover" />
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LandingPage onGetStarted={handleAuthenticated} />
            )
          }
        />
        {["/dashboard", "/dashboard/:tab", "/dashboard/:tab/:currency"].map(path => (
          <Route
            key={path}
            path={path}
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <MainApp onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
        ))}
        <Route
          path="/privacy"
          element={
            <React.Suspense fallback={dashboardSpinner}>
              <PrivacyPolicy />
            </React.Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
    </QueryClientProvider>
  )
}
