import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/services/api"
import { AtSignIcon, KeyIcon, UserIcon, UserPlusIcon } from "lucide-react"
import { useState } from "react"

export default function SignupForm({ onSignUp, onSwitchToLogin }) {
  const [form, setForm] = useState({
    name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: ""
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

    // Basic validation
    if (!form.name || !form.last_name || !form.email || !form.password) {
      setError("All fields are required")
      setIsLoading(false)
      return
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match")
      setIsLoading(false)
      return
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }
    
    // Fix the regex pattern and improve password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z0-9\W]).*$/
    if (!passwordRegex.test(form.password)) {
      setError("Password requirements not met. Please include at least one lowercase letter, uppercase letter, number and special character.")
      setIsLoading(false)
      return
    }

    try {
      const response = await api.post("/auth/register", {
        name: form.name,
        last_name: form.last_name,
        email: form.email,
        password: form.password,
        id_role: 1
      })
      
      if (response.error) {
        setError(response.error || "Registration failed")
      } else {
        // Registration successful, now login
        const loginResponse = await api.post("/auth/signin", {
          email: form.email,
          password: form.password
        })
        
        if (loginResponse.access_token) {
          // Store token and user info
          localStorage.setItem("token", loginResponse.access_token)
          localStorage.setItem("refreshToken", loginResponse.refresh_token)
          localStorage.setItem("userId", loginResponse.id_user)
          
          // Notify parent component
          onSignUp(loginResponse)
        }
      }
    } catch (err) {
      setError("Registration failed: " + (err.message || "Unknown error"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto border-border bg-card dialog-content-solid shadow-lg" style={{ backgroundColor: 'hsl(var(--card))' }}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-medium text-foreground">Create an account</CardTitle>
        <CardDescription className="text-muted-foreground">Enter your information to create a MYNAB account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">First Name</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="name" 
                  placeholder="John" 
                  className="pl-10 border-0 bg-muted focus:bg-background text-foreground placeholder:text-muted-foreground"
                  style={{ backgroundColor: 'hsl(var(--muted))' }}
                  value={form.name}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name" className="text-foreground">Last Name</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="last_name" 
                  placeholder="Doe" 
                  className="pl-10 border-0 bg-muted focus:bg-background text-foreground placeholder:text-muted-foreground"
                  style={{ backgroundColor: 'hsl(var(--muted))' }}
                  value={form.last_name}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <div className="relative">
              <AtSignIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="email" 
                type="email" 
                placeholder="john.doe@example.com" 
                className="pl-10 border-0 bg-muted focus:bg-background text-foreground placeholder:text-muted-foreground"
                style={{ backgroundColor: 'hsl(var(--muted))' }}
                value={form.email}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">Password</Label>
            <div className="relative">
              <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                className="pl-10 border-0 bg-muted focus:bg-background text-foreground placeholder:text-muted-foreground"
                style={{ backgroundColor: 'hsl(var(--muted))' }}
                value={form.password}
                onChange={handleChange}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-medium">Password requirements:</span> Minimum 6 characters, must include at least one lowercase letter (a-z), one uppercase letter (A-Z), number and special character.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
            <div className="relative">
              <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="confirmPassword" 
                type="password" 
                placeholder="••••••••" 
                className="pl-10 border-0 bg-muted focus:bg-background text-foreground placeholder:text-muted-foreground"
                style={{ backgroundColor: 'hsl(var(--muted))' }}
                value={form.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>
          
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm">
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
                Creating Account...
              </div>
            ) : (
              <>
                <UserPlusIcon className="h-4 w-4 mr-2" />
                Sign Up
              </>
            )}
          </Button>
          
          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <button 
                type="button"
                onClick={onSwitchToLogin}
                className="text-accent hover:underline font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}