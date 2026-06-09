"use client"

import { useGoogleLogin } from '@react-oauth/google'
import { api } from '@/services/api'
import { setupSystemPreferenceListener } from "@/lib/themeUtils"
import {
    DollarSignIcon,
    DownloadIcon,
    TrendingDownIcon,
    TrendingUpIcon
} from "lucide-react"
import { useEffect, useState } from "react"
import { usePWAInstall } from "@/hooks/usePWAInstall"

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

export default function LandingPage({ onGetStarted }) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const { canInstall, handleInstall } = usePWAInstall()
    const [animatedValues, setAnimatedValues] = useState({
        balance: 0,
        income: 0,
        expenses: 0
    })

    // Setup system preference listener for theme changes
    useEffect(() => {
        const cleanup = setupSystemPreferenceListener();
        return cleanup;
    }, []);

    // Animate the financial values
    useEffect(() => {
        const targetValues = {
            balance: 3500.00,
            income: 5500.00,
            expenses: 2000.00
        }

        const duration = 2000 // 2 seconds
        const steps = 60
        const stepDuration = duration / steps

        let currentStep = 0

        const animate = () => {
            currentStep++
            const progress = currentStep / steps

            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4)

            setAnimatedValues({
                balance: targetValues.balance * easeOutQuart,
                income: targetValues.income * easeOutQuart,
                expenses: targetValues.expenses * easeOutQuart
            })

            if (currentStep < steps) {
                setTimeout(animate, stepDuration)
            }
        }

        const timer = setTimeout(animate, 500) // Start after 500ms delay

        return () => clearTimeout(timer)
    }, [])

    const login = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setIsLoading(true)
            setError(null)
            try {
                const result = await api.auth.googleSignIn(tokenResponse.access_token)
                if (result.error) { setError(result.error); return }
                localStorage.setItem('token', result.access_token)
                localStorage.setItem('userId', String(result.id_user))
                onGetStarted(result)
            } catch {
                setError('Sign-in failed. Please try again.')
            } finally {
                setIsLoading(false)
            }
        },
        onError: () => setError('Google sign-in failed. Please try again.'),
        scope: 'openid email profile',
    })

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(value)
    }

    return (
        <div className="h-screen overflow-hidden bg-gradient-to-br from-[hsl(var(--background))] via-[hsl(var(--background))] to-[hsl(var(--muted))]">
            {/* Hero Section */}
            <section className="h-full flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
                <div className="max-w-4xl w-full mx-auto text-center">
                    <div className="mb-6 sm:mb-8">
                        <img
                            src="/android-chrome-192x192.png"
                            alt="MYNAB"
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shadow-lg mb-4 sm:mb-6 mx-auto"
                        />
                        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-[hsl(var(--foreground))] mb-6 sm:mb-8 leading-tight">
                            <span className="block text-[hsl(var(--foreground))/0.9]">MYNAB</span>
                            <span className="block text-xl sm:text-2xl md:text-3xl font-normal text-[hsl(var(--muted-foreground))] mt-2">
                                Maybe You Need A Budget
                            </span>
                        </h1>

                        {/* Google Sign-In */}
                        <div className="mb-6 sm:mb-8 flex flex-col items-center gap-3">
                            {error && (
                                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
                                    <p className="text-sm text-destructive">{error}</p>
                                </div>
                            )}
                            <button
                                onClick={() => login()}
                                disabled={isLoading}
                                className="flex items-center justify-center gap-3 h-11 px-6 rounded-lg border border-[hsl(var(--border))] bg-white text-[#3c4043] text-sm font-medium shadow-sm hover:shadow-md hover:bg-gray-50 active:bg-gray-100 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
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
                        </div>
                        
                        {/* PWA install prompt */}
                        {canInstall && (
                            <div className="flex justify-center mb-4">
                                <button
                                    onClick={handleInstall}
                                    className="flex items-center gap-2 h-10 px-5 rounded-lg bg-[hsl(var(--accent)/0.12)] border border-[hsl(var(--accent)/0.3)] text-[hsl(var(--accent))] text-sm font-medium hover:bg-[hsl(var(--accent)/0.2)] transition-all duration-150"
                                >
                                    <DownloadIcon className="h-4 w-4" />
                                    Install App
                                </button>
                            </div>
                        )}

                        {/* Financial Overview Example */}
                        <div className="mt-6 sm:mt-8 bg-[hsl(var(--card))] rounded-2xl shadow-xl border border-[hsl(var(--border))] p-6 sm:p-8 max-w-2xl mx-auto transform hover:scale-105 transition-all duration-300">
                            <h2 className="text-base sm:text-lg font-semibold text-[hsl(var(--foreground))] mb-4 sm:mb-6 text-center">Your Financial Overview</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                                <div className="text-center p-3 sm:p-4 bg-[hsl(var(--background))] rounded-lg border border-[hsl(var(--border))] hover:shadow-lg hover:border-[hsl(var(--accent))/0.3] transition-all duration-300 group">
                                    <div className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] mb-2 flex items-center justify-center gap-1">
                                        <DollarSignIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[hsl(var(--positive))]" />
                                        Current Balance
                                    </div>
                                    <div className="text-xl sm:text-2xl font-bold text-[hsl(var(--positive))] group-hover:scale-110 transition-transform duration-300">
                                        {formatCurrency(animatedValues.balance)}
                                    </div>
                                    <div className="mt-2 text-xs text-[hsl(var(--positive))/0.75]">Available Funds</div>
                                </div>

                                <div className="text-center p-3 sm:p-4 bg-[hsl(var(--background))] rounded-lg border border-[hsl(var(--border))] hover:shadow-lg hover:border-[hsl(var(--accent))/0.3] transition-all duration-300 group">
                                    <div className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] mb-2 flex items-center justify-center gap-1">
                                        <TrendingUpIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[hsl(var(--positive))]" />
                                        Monthly Income
                                    </div>
                                    <div className="text-xl sm:text-2xl font-bold text-[hsl(var(--positive))] group-hover:scale-110 transition-transform duration-300">
                                        +{formatCurrency(animatedValues.income)}
                                    </div>
                                    <div className="mt-2 text-xs text-[hsl(var(--positive))/0.75]">This Month</div>
                                </div>

                                <div className="text-center p-3 sm:p-4 bg-[hsl(var(--background))] rounded-lg border border-[hsl(var(--border))] hover:shadow-lg hover:border-[hsl(var(--destructive))/0.3] transition-all duration-300 group">
                                    <div className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] mb-2 flex items-center justify-center gap-1">
                                        <TrendingDownIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[hsl(var(--destructive))]" />
                                        Monthly Expenses
                                    </div>
                                    <div className="text-xl sm:text-2xl font-bold text-[hsl(var(--destructive))] group-hover:scale-110 transition-transform duration-300">
                                        -{formatCurrency(animatedValues.expenses)}
                                    </div>
                                    <div className="mt-2 text-xs text-[hsl(var(--destructive))/0.75]">This Month</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="mt-8 pb-8 text-center">
                <a
                    href="/privacy"
                    className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors underline underline-offset-2"
                >
                    Privacy Policy
                </a>
            </footer>
        </div>
    )
}
