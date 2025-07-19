"use client"

import { WalletIcon, XIcon } from "lucide-react"
import { useState } from "react"
import PasswordlessSignInForm from "./PasswordlessSignInForm"
import PasswordlessSignupForm from "./PasswordlessSignupForm"

export default function AuthModal({ onAuthenticated, onClose = () => {} }) {
  const [isLoginView, setIsLoginView] = useState(true)

  const handleLogin = (userData) => {
    onAuthenticated(userData)
  }

  const handleSignUp = (userData) => {
    onAuthenticated(userData)
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
      style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
    >
      <div className="w-full max-w-md relative">
        {/* Close button - Fixed styling */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 bg-card border-2 border-border rounded-full p-2 shadow-lg hover:bg-muted hover:border-accent/50 transition-all duration-200 group"
          aria-label="Close"
          style={{
            backgroundColor: "hsl(var(--card))",
            borderColor: "hsl(var(--border))",
            backgroundImage: "none",
          }}
        >
          <XIcon className="h-5 w-5 text-foreground group-hover:text-accent transition-colors" />
        </button>

        {/* Brand header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center gap-3 bg-card border-2 border-border rounded-lg px-6 py-3 shadow-lg"
            style={{ backgroundColor: "hsl(var(--card))", backgroundImage: "none" }}
          >
            <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
              <WalletIcon className="h-6 w-6 text-accent" />
            </div>
            <span className="text-2xl font-bold tracking-wider text-foreground">MYNAB</span>
          </div>
        </div>

        {/* Form content */}
        {isLoginView ? (
          <PasswordlessSignInForm onLogin={handleLogin} onSwitchToSignup={() => setIsLoginView(false)} />
        ) : (
          <PasswordlessSignupForm onSignUp={handleSignUp} onSwitchToLogin={() => setIsLoginView(true)} />
        )}
      </div>
    </div>
  )
}
