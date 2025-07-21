import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/services/api"
import { AlertCircleIcon, AtSignIcon, KeyIcon, LogInIcon, MailIcon, WalletIcon } from "lucide-react"
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
    <Card className="max-w-md mx-auto border-2 border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-xl">
      <CardHeader className="pb-2">
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-[hsl(var(--accent)/0.1)] border border-[hsl(var(--accent)/0.2)]">
              <WalletIcon className="h-5 w-5 text-[hsl(var(--accent))]" />
            </span>
            <span className="text-lg font-bold tracking-wider text-[hsl(var(--foreground))]">MYNAB</span>
          </div>
          <span className="text-sm font-normal text-[hsl(var(--muted-foreground))] mt-1">
            {step === "email" ? "Sign in to your account" : "Enter verification code"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === "email" ? (
          <form onSubmit={handleSendCode} className="space-y-5">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-semibold text-[hsl(var(--foreground))]">
                Email Address
              </Label>
              <div className="relative">
                <AtSignIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  className="pl-10 h-12 border-2 border-[hsl(var(--border))] bg-[hsl(var(--background))] focus:border-[hsl(var(--accent))] transition-all duration-200"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="bg-[hsl(var(--info-bg))] border border-[hsl(var(--info-fg)/0.2)] rounded-lg p-4">
              <div className="flex items-start gap-3">
                <MailIcon className="h-5 w-5 text-[hsl(var(--info-fg))] mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[hsl(var(--info-fg))]">
                    Passwordless Login
                  </p>
                  <p className="text-xs text-[hsl(var(--info-fg)/0.85)]">
                    We'll send you a secure verification code to sign in. No password needed!
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-[hsl(var(--destructive)/0.05)] border-2 border-[hsl(var(--destructive)/0.2)]">
                <div className="flex items-center gap-2">
                  <AlertCircleIcon className="h-4 w-4 text-[hsl(var(--destructive))]" />
                  <span className="text-sm font-medium text-[hsl(var(--destructive))]">{error}</span>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-[hsl(var(--accent-foreground))] border-t-transparent rounded-full animate-spin" />
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
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={onSwitchToSignup}
                  className="text-[hsl(var(--accent))] hover:text-[hsl(var(--accent)/0.8)] font-semibold hover:underline transition-colors"
                >
                  Create one now
                </button>
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyAndLogin} className="space-y-5">
            <div className="text-center space-y-2">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                We've sent a verification code to <strong className="text-[hsl(var(--foreground))]">{form.email}</strong>
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="verification_code" className="text-sm font-semibold text-[hsl(var(--foreground))]">
                Verification Code
              </Label>
              <div className="relative">
                <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                <Input
                  id="verification_code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  className="pl-10 h-14 border-2 border-[hsl(var(--accent)/0.6)] bg-[hsl(var(--background))] focus:border-[hsl(var(--accent))] focus:ring-2 focus:ring-[hsl(var(--accent)/0.4)] transition-all duration-200 text-center text-lg sm:text-2xl tracking-[0.25em] font-semibold text-[hsl(var(--foreground))] shadow-sm"
                  style={{ letterSpacing: '0.25em', fontFamily: 'Inter, Nunito, ui-sans-serif, system-ui, sans-serif' }}
                  value={form.verification_code}
                  onChange={handleChange}
                  maxLength={6}
                  required
                  autoComplete="one-time-code"
                  inputMode="numeric"
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
                className="w-full text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                disabled={isLoading}
              >
                Resend code
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleBackToEmail}
                className="w-full text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
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
