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
      // Use the api.auth.signin method instead of api.post
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
    <Card className="max-w-md mx-auto border-0 bg-white/60 dark:bg-[#1a1e24]/90 backdrop-blur-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-medium text-gray-900 dark:text-white">Welcome back</CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-300">Enter your credentials to access your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700 dark:text-white">Email</Label>
            <div className="relative">
              <AtSignIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-300" />
              <Input 
                id="email" 
                type="email" 
                placeholder="john.doe@example.com" 
                className="pl-10 border-0 bg-neutral-100 dark:bg-[#2a303a] focus:bg-white dark:focus:bg-[#353b47] text-gray-900 dark:text-white"
                value={form.email}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-gray-700 dark:text-white">Password</Label>
              <button 
                type="button" 
                className="text-sm text-blue-600 dark:text-blue-300 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-300" />
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                className="pl-10 border-0 bg-neutral-100 dark:bg-[#2a303a] focus:bg-white dark:focus:bg-[#353b47] text-gray-900 dark:text-white"
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
            className="w-full bg-neutral-900 hover:bg-neutral-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
            <p className="text-sm text-gray-500 dark:text-gray-300">
              Don't have an account?{" "}
              <button 
                type="button"
                onClick={onSwitchToSignup}
                className="text-blue-600 dark:text-blue-300 hover:underline font-medium"
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