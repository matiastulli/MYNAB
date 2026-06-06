import { useGoogleLogin } from '@react-oauth/google'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/services/api'
import { useState } from 'react'
import { DollarSignIcon } from 'lucide-react'

function GoogleLogo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

export default function AuthModal({ onAuthenticated, onClose = () => {} }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await api.auth.googleSignIn(tokenResponse.access_token)
        if (result.error) { setError(result.error); return }
        localStorage.setItem('token', result.access_token)
        localStorage.setItem('userId', String(result.id_user))
        onAuthenticated(result)
      } catch {
        setError('Sign-in failed. Please try again.')
      } finally {
        setIsLoading(false)
      }
    },
    onError: () => setError('Google sign-in failed. Please try again.'),
    scope: 'openid email profile',
  })

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <Card className="w-full max-w-sm border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl">
        <CardHeader className="text-center pb-2 pt-8">
          <div className="flex justify-center mb-5">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[hsl(var(--accent)/0.15)] border border-[hsl(var(--accent)/0.25)]">
              <DollarSignIcon className="h-8 w-8 text-[hsl(var(--accent))]" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            Welcome to MYNAB
          </CardTitle>
          <CardDescription className="text-[hsl(var(--muted-foreground))] mt-1">
            Sign in to manage your budget
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 px-6 pb-8 pt-6">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
              <p className="text-sm text-destructive text-center">{error}</p>
            </div>
          )}

          <button
            onClick={() => login()}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 h-11 px-4 rounded-lg border border-[hsl(var(--border))] bg-white text-[#3c4043] text-sm font-medium shadow-sm hover:shadow-md hover:bg-gray-50 active:bg-gray-100 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 rounded-full border-2 border-[#4285F4] border-t-transparent animate-spin" />
            ) : (
              <GoogleLogo />
            )}
            <span className="font-medium">
              {isLoading ? 'Signing in…' : 'Sign in with Google'}
            </span>
          </button>

          <p className="text-xs text-center text-[hsl(var(--muted-foreground)/0.7)]">
            By signing in you agree to our terms of service
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
