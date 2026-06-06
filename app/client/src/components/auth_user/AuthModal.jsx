import { GoogleLogin } from '@react-oauth/google'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/services/api'
import { useState } from 'react'

export default function AuthModal({ onAuthenticated, onClose = () => {} }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await api.auth.googleSignIn(credentialResponse.credential)
      if (result.error) {
        setError(result.error)
        return
      }
      localStorage.setItem('token', result.access_token)
      localStorage.setItem('userId', String(result.id_user))
      onAuthenticated(result)
    } catch {
      setError('Sign-in failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
      onClick={handleOverlayClick}
    >
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to MYNAB</CardTitle>
          <CardDescription>Sign in to manage your budget</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google sign-in failed. Please try again.')}
            theme="filled_black"
            size="large"
            text="signin_with"
            shape="rectangular"
          />
          {isLoading && (
            <p className="text-sm text-muted-foreground">Signing in...</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
