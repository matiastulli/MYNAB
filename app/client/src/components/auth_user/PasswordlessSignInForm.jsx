import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/services/api"
import { AlertCircleIcon, AtSignIcon, CheckCircleIcon, KeyIcon, LogInIcon, MailIcon, ShieldCheckIcon } from "lucide-react"
import { useState } from "react"

export default function PasswordlessSignInForm({ onLogin, onSwitchToSignup }) {
  const [step, setStep] = useState("email") // "email" or "code"
  const [form, setForm] = useState({
    email: "",
    verification_code: ""
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [codeExpiry, setCodeExpiry] = useState(null)

  const handleChange = (e) => {
    const { id, value } = e.target
    setForm({ ...form, [id]: value })
    setError("")
  }

  const handleSendCode = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!form.email) {
      setError("Email address is required")
      setIsLoading(false)
      return
    }

    try {
      const response = await api.auth.passwordless.sendCode(form.email, "login")

      if (response.error) {
        setError(response.error || "Failed to send verification code")
      } else {
        setStep("code")
        setCodeExpiry(response.expires_in)
      }
    } catch (err) {
      setError("Failed to send verification code: " + (err.message || "Unknown error"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyAndLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!form.verification_code) {
      setError("Verification code is required")
      setIsLoading(false)
      return
    }

    try {
      const response = await api.auth.passwordless.login(form.email, form.verification_code)

      if (response.error) {
        setError(response.error || "Login failed")
      } else if (response.access_token) {
        // Store authentication data
        localStorage.setItem("token", response.access_token)
        localStorage.setItem("refreshToken", response.refresh_token)
        localStorage.setItem("userId", response.id_user)

        // Notify parent component
        onLogin(response)
      }
    } catch (err) {
      setError("Login failed: " + (err.message || "Invalid verification code"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    await handleSendCode({ preventDefault: () => {} })
  }

  const handleBackToEmail = () => {
    setStep("email")
    setForm({ ...form, verification_code: "" })
    setError("")
  }

  return (
    <Card className="max-w-md mx-auto border-2 border-border bg-card shadow-xl">
      <CardHeader className="space-y-2 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
            {step === "email" ? (
              <LogInIcon className="h-5 w-5 text-accent" />
            ) : (
              <ShieldCheckIcon className="h-5 w-5 text-accent" />
            )}
          </div>
          <CardTitle className="text-2xl font-semibold text-foreground">
            {step === "email" ? "Welcome Back" : "Enter Your Code"}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === "email" ? (
          <form onSubmit={handleSendCode} className="space-y-5">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                Email Address
              </Label>
              <div className="relative">
                <AtSignIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  className="pl-10 h-12 border-2 border-border bg-background focus:border-accent transition-all duration-200"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <MailIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Passwordless Login
                  </p>
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    We'll send you a secure verification code to sign in. No password needed!
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2">
                  <AlertCircleIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-900 dark:text-red-100">{error}</span>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
              style={{
                backgroundColor: "hsl(var(--accent))",
                color: "hsl(var(--accent-foreground))"
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin" />
                  Sending code...
                </div>
              ) : (
                <>
                  <MailIcon className="h-5 w-5 mr-2" />
                  Send Login Code
                </>
              )}
            </Button>

            <div className="text-center pt-2">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={onSwitchToSignup}
                  className="text-accent hover:text-accent/80 font-semibold hover:underline transition-colors"
                >
                  Create one now
                </button>
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyAndLogin} className="space-y-5">
            <div className="text-center space-y-2">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 w-fit mx-auto">
                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm text-muted-foreground">
                We've sent a verification code to <strong className="text-foreground">{form.email}</strong>
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="verification_code" className="text-sm font-semibold text-foreground">
                Verification Code
              </Label>
              <div className="relative">
                <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="verification_code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  className="pl-10 h-12 border-2 border-border bg-background focus:border-accent transition-all duration-200 text-center text-lg tracking-wider font-mono"
                  value={form.verification_code}
                  onChange={handleChange}
                  maxLength={6}
                  required
                />
              </div>
              {codeExpiry && (
                <p className="text-xs text-muted-foreground text-center">
                  Code expires in {codeExpiry} minutes
                </p>
              )}
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2">
                  <AlertCircleIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-900 dark:text-red-100">{error}</span>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
              style={{
                backgroundColor: "hsl(var(--accent))",
                color: "hsl(var(--accent-foreground))"
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </div>
              ) : (
                <>
                  <LogInIcon className="h-5 w-5 mr-2" />
                  Sign In
                </>
              )}
            </Button>

            <div className="space-y-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleResendCode}
                className="w-full text-muted-foreground hover:text-foreground"
                disabled={isLoading}
              >
                Resend code
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleBackToEmail}
                className="w-full text-muted-foreground hover:text-foreground"
              >
                Change email address
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
