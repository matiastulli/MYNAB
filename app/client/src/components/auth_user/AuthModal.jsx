"use client"

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
