import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/services/api"
import { AtSignIcon, KeyIcon, LogInIcon } from "lucide-react"
import { useState } from "react"

export default function LoginForm({ onLogin, onSwitchToSignup }) {
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
    <Card className="max-w-md mx-auto border-border bg-card backdrop-blur-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-medium text-foreground">Welcome back</CardTitle>
        <CardDescription className="text-muted-foreground">Enter your credentials to access your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <div className="relative">
              <AtSignIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="john.doe@example.com"
                className="pl-10 border-0 bg-muted focus:bg-background text-foreground placeholder:text-muted-foreground"
                value={form.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <button
                type="button"
                className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="pl-10 border-0 bg-muted focus:bg-background text-foreground placeholder:text-muted-foreground"
                value={form.password}
                onChange={handleChange}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Signing in...
              </div>
            ) : (
              <>
                <LogInIcon className="h-4 w-4 mr-2" />
                Sign In
              </>
            )}
          </Button>

          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={onSwitchToSignup}
                className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
              >
                Sign up
              </button>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}