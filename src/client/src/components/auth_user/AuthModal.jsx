import { WalletIcon, XIcon } from "lucide-react"
import { useState } from "react"
import LoginForm from "./LoginForm"
import SignupForm from "./SignupForm"

export default function AuthModal({ onAuthenticated, onClose = () => { } }) {
  const [isLoginView, setIsLoginView] = useState(true)

  const handleLogin = (userData) => {
    onAuthenticated(userData)
  }

  const handleSignUp = (userData) => {
    onAuthenticated(userData)
  }

  // Close when clicking outside the modal
  const handleOverlayClick = (e) => {
    // Only close if clicking the backdrop directly
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="w-full max-w-md relative">
        {/* Close button */}
        <button
          onClick={() => {
            onClose()
          }}
          className="absolute -top-2 -right-2 bg-background border border-border rounded-full p-1 shadow-md hover:bg-accent transition-colors"
          aria-label="Close"
        >
          <XIcon className="h-5 w-5 text-foreground" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-white">
            <WalletIcon className="h-6 w-6" />
            <span className="text-lg font-medium tracking-wider uppercase">
              MYNAB
            </span>
          </div>
        </div>

        {isLoginView ? (
          <LoginForm
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