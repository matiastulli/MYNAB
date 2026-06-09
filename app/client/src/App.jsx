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

const dashboardSpinner = (
  <div className="flex items-center justify-center h-screen">
    <div className="w-8 h-8 rounded-full border-2 border-[hsl(var(--accent))] border-t-transparent animate-spin" />
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
    const checkAuth = async () => {
      const hasToken = api.isAuthenticated()
      if (hasToken) {
        setIsAuthenticated(true)
        setIsLoading(false)
        const newToken = await api.attemptRefresh()
        if (!newToken) {
          api.logout()
          setIsAuthenticated(false)
        }
      } else {
        setIsLoading(false)
      }
    }

    checkAuth()
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-full mb-4">
            <svg className="animate-spin h-8 w-8 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-muted-foreground">Loading MYNAB...</p>
        </div>
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
