import { WalletIcon, XIcon } from "lucide-react"
import { useState } from "react"
import SignInForm from "./SignInForm"
import SignupForm from "./SignupForm"

export default function AuthModal({ onAuthenticated, onClose = () => { } }) {
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
    >
      <div className="w-full max-w-md relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 bg-background border-2 border-border rounded-full p-2 shadow-lg hover:bg-accent/10 transition-all duration-200"
          aria-label="Close"
        >
          <XIcon className="h-5 w-5 text-foreground" />
        </button>

        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 bg-card border-2 border-border rounded-lg px-6 py-3 shadow-lg">
            <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
              <WalletIcon className="h-6 w-6 text-accent" />
            </div>
            <span className="text-2xl font-bold tracking-wider text-foreground">
              MYNAB
            </span>
          </div>
        </div>

        {/* Form content */}
        {isLoginView ? (
          <SignInForm
            onLogin={handleLogin}
            onSwitchToSignup={() => setIsLoginView(false)}
          />
        ) : (
          <SignupForm
            onSignUp={handleSignUp}
            onSwitchToLogin={() => setIsLoginView(true)}
          />
        )}
      </div>
    </div>
  )
}