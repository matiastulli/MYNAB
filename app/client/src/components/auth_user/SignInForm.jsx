import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/services/api"
import { AlertCircleIcon, AtSignIcon, KeyIcon, LogInIcon } from "lucide-react"
import { useState } from "react"

export default function SignInForm({ onLogin, onSwitchToSignup }) {
  const [form, setForm] = useState({
    email: "",
    password: ""
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e) => {
    const { id, value } = e.target
    setForm({ ...form, [id]: value })
    setError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!form.email || !form.password) {
      setError("Email and password are required")
      setIsLoading(false)
      return
    }

    try {
      const response = await api.auth.signin({
        email: form.email,
        password: form.password
      })

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
      setError("Login failed: " + (err.message || "Invalid credentials"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto border-2 border-border bg-card shadow-xl">
      <CardHeader className="space-y-2 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
            <LogInIcon className="h-5 w-5 text-accent" />
          </div>
          <CardTitle className="text-2xl font-semibold text-foreground">Welcome Back</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5">
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

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-semibold text-foreground">
                Password
              </Label>
              <button
                type="button"
                className="text-sm text-accent hover:text-accent/80 font-medium hover:underline transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                className="pl-10 h-12 border-2 border-border bg-background focus:border-accent transition-all duration-200"
                value={form.password}
                onChange={handleChange}
                required
              />
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
                Signing you in...
              </div>
            ) : (
              <>
                <LogInIcon className="h-5 w-5 mr-2" />
                Sign In
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
      </CardContent>
    </Card>
  )
}