import { WalletIcon } from "lucide-react"
import { useState } from "react"
import LoginForm from "./LoginForm"
import SignupForm from "./SignupForm"

export default function AuthModal({ onAuthenticated }) {
  const [isLoginView, setIsLoginView] = useState(true)

  const handleLogin = (userData) => {
    onAuthenticated(userData)
  }

  const handleSignUp = (userData) => {
    onAuthenticated(userData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-white">
            <WalletIcon className="h-6 w-6" />
            <span className="text-lg font-medium tracking-wider uppercase">MYNAB</span>
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