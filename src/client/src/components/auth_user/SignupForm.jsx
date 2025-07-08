import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/services/api"
import { AtSignIcon, KeyIcon, UserIcon, UserPlusIcon, CheckCircleIcon, AlertCircleIcon } from "lucide-react"
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
  const [validationErrors, setValidationErrors] = useState({})

  const validateField = (field, value) => {
    const errors = { ...validationErrors }
    
    switch (field) {
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = 'Please enter a valid email address'
        } else {
          delete errors.email
        }
        break
      case 'password':
        if (value.length > 0 && value.length < 6) {
          errors.password = 'Password must be at least 6 characters'
        } else if (value.length >= 6) {
          const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z0-9\W]).*$/
          if (!passwordRegex.test(value)) {
            errors.password = 'Password must include lowercase, uppercase/number/special character'
          } else {
            delete errors.password
          }
        } else {
          delete errors.password
        }
        break
      case 'confirmPassword':
        if (value && value !== form.password) {
          errors.confirmPassword = 'Passwords do not match'
        } else {
          delete errors.confirmPassword
        }
        break
      default:
        break
    }
    
    setValidationErrors(errors)
  }

  const handleChange = (e) => {
    const { id, value } = e.target
    setForm({ ...form, [id]: value })
    setError("")
    validateField(id, value)
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

    if (Object.keys(validationErrors).length > 0) {
      setError("Please fix the validation errors before submitting")
      setIsLoading(false)
      return
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match")
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
    <Card className="max-w-md mx-auto border-2 border-border bg-card shadow-xl">
      <CardHeader className="space-y-2 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
            <UserPlusIcon className="h-5 w-5 text-accent" />
          </div>
          <CardTitle className="text-2xl font-semibold text-foreground">Create Account</CardTitle>
        </div>
        <CardDescription className="text-muted-foreground">
          Join MYNAB and start managing your finances with ease
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold text-foreground">
                First Name *
              </Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="name" 
                  placeholder="John" 
                  className="pl-10 h-12 border-2 border-border bg-background focus:border-accent transition-all duration-200"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name" className="text-sm font-semibold text-foreground">
                Last Name *
              </Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="last_name" 
                  placeholder="Doe" 
                  className="pl-10 h-12 border-2 border-border bg-background focus:border-accent transition-all duration-200"
                  value={form.last_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-foreground">
              Email Address *
            </Label>
            <div className="relative">
              <AtSignIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="email" 
                type="email" 
                placeholder="john.doe@example.com" 
                className={`pl-10 h-12 border-2 bg-background focus:border-accent transition-all duration-200 ${
                  validationErrors.email ? 'border-red-500' : 'border-border'
                }`}
                value={form.email}
                onChange={handleChange}
                required
              />
              {validationErrors.email && (
                <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                  <AlertCircleIcon className="h-3 w-3" />
                  {validationErrors.email}
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-semibold text-foreground">
              Password *
            </Label>
            <div className="relative">
              <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="password" 
                type="password" 
                placeholder="Create a strong password" 
                className={`pl-10 h-12 border-2 bg-background focus:border-accent transition-all duration-200 ${
                  validationErrors.password ? 'border-red-500' : 'border-border'
                }`}
                value={form.password}
                onChange={handleChange}
                required
              />
              {validationErrors.password && (
                <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                  <AlertCircleIcon className="h-3 w-3" />
                  {validationErrors.password}
                </div>
              )}
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                <span className="font-medium">Password requirements:</span> Minimum 6 characters, include lowercase, uppercase/number/special character
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground">
              Confirm Password *
            </Label>
            <div className="relative">
              <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="confirmPassword" 
                type="password" 
                placeholder="Confirm your password" 
                className={`pl-10 h-12 border-2 bg-background focus:border-accent transition-all duration-200 ${
                  validationErrors.confirmPassword ? 'border-red-500' : 'border-border'
                }`}
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
              {validationErrors.confirmPassword && (
                <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                  <AlertCircleIcon className="h-3 w-3" />
                  {validationErrors.confirmPassword}
                </div>
              )}
              {form.confirmPassword && !validationErrors.confirmPassword && form.password === form.confirmPassword && (
                <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                  <CheckCircleIcon className="h-3 w-3" />
                  Passwords match
                </div>
              )}
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
            className="w-full h-12 text-lg font-semibold bg-accent hover:bg-accent/90 text-accent-foreground transition-all duration-200 shadow-lg hover:shadow-xl"
            disabled={isLoading || Object.keys(validationErrors).length > 0}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin" />
                Creating Your Account...
              </div>
            ) : (
              <>
                <UserPlusIcon className="h-5 w-5 mr-2" />
                Create Account
              </>
            )}
          </Button>
          
          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <button 
                type="button"
                onClick={onSwitchToLogin}
                className="text-accent hover:text-accent/80 font-semibold hover:underline transition-colors"
              >
                Sign in instead
              </button>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}