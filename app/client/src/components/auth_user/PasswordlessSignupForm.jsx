import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/services/api"
import { AlertCircleIcon, AtSignIcon, CheckCircleIcon, KeyIcon, MailIcon, UserIcon, UserPlusIcon, WalletIcon } from "lucide-react"
import { useState } from "react"

export default function PasswordlessSignupForm({ onSignUp, onSwitchToLogin }) {
  const [step, setStep] = useState("form") // "form", "verify", "success"
  const [form, setForm] = useState({
    name: "",
    last_name: "",
    email: "",
    verification_code: ""
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [codeExpiry, setCodeExpiry] = useState(null)
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

  const handleSubmitForm = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Basic validation
    if (!form.name || !form.last_name || !form.email) {
      setError("All fields are required")
      setIsLoading(false)
      return
    }

    if (Object.keys(validationErrors).length > 0) {
      setError("Please fix the validation errors before submitting")
      setIsLoading(false)
      return
    }

    try {
      const response = await api.auth.passwordless.sendCode(form.email, "registration")
      
      if (response.error) {
        setError(response.error || "Failed to send verification code")
      } else {
        setStep("verify")
        setCodeExpiry(response.expires_in)
      }
    } catch (err) {
      setError("Registration failed: " + (err.message || "Unknown error"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!form.verification_code) {
      setError("Verification code is required")
      setIsLoading(false)
      return
    }

    try {
      // First verify and register the user
      const registerResponse = await api.auth.passwordless.register(
        {
          name: form.name,
          last_name: form.last_name,
          email: form.email,
          id_role: 1
        }, 
        form.verification_code,
        form.email
      )
      
      if (registerResponse.error) {
        setError(registerResponse.error || "Registration failed")
        setIsLoading(false)
        return
      }

      // Registration now returns tokens directly!
      if (registerResponse.access_token) {
        // Store authentication data
        localStorage.setItem("token", registerResponse.access_token)
        localStorage.setItem("refreshToken", registerResponse.refresh_token)
        localStorage.setItem("userId", registerResponse.id_user)
        
        // Notify parent component - seamless login!
        onSignUp(registerResponse)
      } else {
        // Fallback to success page if tokens not received
        setStep("success")
      }
    } catch (err) {
      setError("Registration failed: " + (err.message || "Unknown error"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setIsLoading(true)
    try {
      const response = await api.auth.passwordless.sendCode(form.email, "registration")
      
      if (response.error) {
        setError(response.error || "Failed to send verification code")
      } else {
        setCodeExpiry(response.expires_in)
        setError("")
      }
    } catch (err) {
      setError("Failed to resend code: " + (err.message || "Unknown error"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToForm = () => {
    setStep("form")
    setForm({ ...form, verification_code: "" })
    setError("")
  }

  
      

  if (step === "success") {
    return (
      <Card className="max-w-md mx-auto border-2 border-border bg-card shadow-xl">
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 w-fit mx-auto">
              <CheckCircleIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">Account Created!</h3>
              <p className="text-sm text-muted-foreground">
                Your account has been successfully created. You can now sign in with your email address.
              </p>
            </div>
            <Button
              onClick={onSwitchToLogin}
              className="w-full h-12 text-lg font-semibold"
              style={{
                backgroundColor: "hsl(var(--accent))",
                color: "hsl(var(--accent-foreground))"
              }}
            >
              Sign In Now
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-md mx-auto border-2 border-border bg-card shadow-xl">
        <CardHeader className="pb-2">
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-accent/10 border border-accent/20">
              <WalletIcon className="h-5 w-5 text-accent" />
            </span>
            <span className="text-lg font-bold tracking-wider text-foreground">MYNAB</span>
          </div>
          <span className="text-sm font-normal text-muted-foreground mt-1">
            {step === "form" ? "Create Account" : "Verify Your Email"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === "form" ? (
          <form onSubmit={handleSubmitForm} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-foreground">
                  First Name *
                </Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="name" 
                    placeholder="Olivia" 
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
                    placeholder="Carter" 
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
                  placeholder="olivia.carter@gmail.com" 
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

            <div className="bg-[hsl(var(--info-bg))] border border-[hsl(var(--info-fg)/0.2)] rounded-lg p-4">
              <div className="flex items-start gap-3">
                <MailIcon className="h-5 w-5 text-[hsl(var(--info-fg))] mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[hsl(var(--info-fg))]">
                    Passwordless Registration
                  </p>
                  <p className="text-xs text-[hsl(var(--info-fg)/0.85)]">
                    We'll send you a verification code to complete your registration. No password required!
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
              disabled={isLoading || Object.keys(validationErrors).length > 0}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin" />
                  Sending verification code...
                </div>
              ) : (
                <>
                  <MailIcon className="h-5 w-5 mr-2" />
                  Send Verification Code
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
        ) : (
          <form onSubmit={handleVerifyAndRegister} className="space-y-5">
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
                  Creating Account...
                </div>
              ) : (
                <>
                  <UserPlusIcon className="h-5 w-5 mr-2" />
                  Create Account
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
                onClick={handleBackToForm}
                className="w-full text-muted-foreground hover:text-foreground"
              >
                Change information
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
