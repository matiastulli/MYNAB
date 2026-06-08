"use client"

import React from "react"
import LandingPage from "@/components/LandingPage"
import { api } from "@/services/api"
import { useEffect, useState } from "react"
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom"

const MainApp = React.lazy(() => import('@/components/MainApp'))

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check authentication status on app load
  useEffect(() => {
    const checkAuth = () => {
      const isAuth = api.isAuthenticated()
      setIsAuthenticated(isAuth)
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  // Handle successful authentication from landing page
  const handleAuthenticated = () => {
    setIsAuthenticated(true)
  }

  // Handle logout
  const handleLogout = () => {
    api.logout()
    setIsAuthenticated(false)
  }

  // Show loading spinner while checking authentication
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

  // Route between landing page and main app based on authentication
  return (
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
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <React.Suspense fallback={
                <div className="flex items-center justify-center h-screen">
                  <div className="w-8 h-8 rounded-full border-2 border-[hsl(var(--accent))] border-t-transparent animate-spin" />
                </div>
              }>
                <MainApp onLogout={handleLogout} />
              </React.Suspense>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/dashboard/:tab"
          element={
            isAuthenticated ? (
              <React.Suspense fallback={
                <div className="flex items-center justify-center h-screen">
                  <div className="w-8 h-8 rounded-full border-2 border-[hsl(var(--accent))] border-t-transparent animate-spin" />
                </div>
              }>
                <MainApp onLogout={handleLogout} />
              </React.Suspense>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/dashboard/:tab/:currency"
          element={
            isAuthenticated ? (
              <React.Suspense fallback={
                <div className="flex items-center justify-center h-screen">
                  <div className="w-8 h-8 rounded-full border-2 border-[hsl(var(--accent))] border-t-transparent animate-spin" />
                </div>
              }>
                <MainApp onLogout={handleLogout} />
              </React.Suspense>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}
