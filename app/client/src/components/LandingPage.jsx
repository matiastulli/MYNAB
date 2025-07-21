"use client"

import AuthModal from "@/components/auth_user/AuthModal"
import { Button } from "@/components/ui/button"
import { setupSystemPreferenceListener } from "@/lib/themeUtils"
import {
    DollarSignIcon,
    LogInIcon,
    TrendingDownIcon,
    TrendingUpIcon
} from "lucide-react"
import { useEffect, useState } from "react"

export default function LandingPage({ onGetStarted }) {
    const [showAuthModal, setShowAuthModal] = useState(false)
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

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(value)
    }

    const handleGetStarted = () => {
        setShowAuthModal(true)
    }

    const handleAuthentication = (authData) => {
        setShowAuthModal(false)
        onGetStarted(authData)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--background))] via-[hsl(var(--background))] to-[hsl(var(--muted))]">
            {showAuthModal && (
                <AuthModal
                    onAuthenticated={handleAuthentication}
                    onClose={() => setShowAuthModal(false)}
                />
            )}

            {/* Hero Section */}
            <section className="py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="mb-12">
                        <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-accent/20 to-accent/10 rounded-full mb-6 sm:mb-8 shadow-lg">
                            <DollarSignIcon className="h-10 w-10 sm:h-12 sm:w-12 text-[hsl(var(--accent))]" />
                        </div>
                        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-[hsl(var(--foreground))] mb-6 sm:mb-8 leading-tight">
                            <span className="block text-[hsl(var(--foreground))/0.9]">MYNAB</span>
                            <span className="block text-xl sm:text-2xl md:text-3xl font-normal text-[hsl(var(--muted-foreground))] mt-2">
                                Maybe You Need A Budget
                            </span>
                        </h1>
                        
                        {/* Login/Signup Button */}
                        <div className="mb-12 sm:mb-16">
                            <Button 
                                onClick={handleGetStarted} 
                                className="bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))/0.9] text-[hsl(var(--accent-foreground))] px-6 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                            >
                                <LogInIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                Get Started
                            </Button>
                        </div>
                        
                        {/* Financial Overview Example */}
                        <div className="mt-12 sm:mt-16 bg-[hsl(var(--card))] rounded-2xl shadow-xl border border-[hsl(var(--border))] p-6 sm:p-8 max-w-2xl mx-auto transform hover:scale-105 transition-all duration-300">
                            <h3 className="text-base sm:text-lg font-semibold text-[hsl(var(--foreground))] mb-4 sm:mb-6 text-center">Your Financial Overview</h3>
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
        </div>
    )
}
