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
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
            {showAuthModal && (
                <AuthModal
                    onAuthenticated={handleAuthentication}
                    onClose={() => setShowAuthModal(false)}
                />
            )}

            {/* Navigation */}
            <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-foreground">MYNAB</span>
                        </div>
                        <Button onClick={handleGetStarted} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            <LogInIcon className="h-4 w-4 mr-2" />
                            Sign In
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="mb-12">
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-full mb-8 shadow-lg">
                            <DollarSignIcon className="h-12 w-12 text-emerald-600" />
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-8 leading-tight">
                            <span className="block text-foreground/90">MYNAB</span>
                            <span className="block text-2xl md:text-3xl font-normal text-muted-foreground mt-2">
                                Maybe You Need A Budget
                            </span>
                        </h1>
                        
                        {/* Financial Overview Example */}
                        <div className="mt-16 bg-card rounded-2xl shadow-xl border border-border p-8 max-w-2xl mx-auto transform hover:scale-105 transition-all duration-300">
                            <h3 className="text-lg font-semibold text-foreground mb-6 text-center">Your Financial Overview</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">


                                <div className="text-center p-4 bg-background rounded-lg border border-border hover:shadow-lg hover:border-emerald-300 transition-all duration-300 group">
                                    <div className="text-sm text-muted-foreground mb-2 flex items-center justify-center gap-1">
                                        <DollarSignIcon className="h-4 w-4 text-green-600" />
                                        Current Balance
                                    </div>
                                    <div className="text-2xl font-bold text-emerald-600 group-hover:scale-110 transition-transform duration-300">
                                        {formatCurrency(animatedValues.balance)}
                                    </div>
                                    <div className="mt-2 text-xs text-emerald-600 opacity-75">Available Funds</div>
                                </div>


                                <div className="text-center p-4 bg-background rounded-lg border border-border hover:shadow-lg hover:border-emerald-300 transition-all duration-300 group">
                                    <div className="text-sm text-muted-foreground mb-2 flex items-center justify-center gap-1">
                                        <TrendingUpIcon className="h-4 w-4 text-green-600" />
                                        Monthly Income
                                    </div>
                                    <div className="text-2xl font-bold text-emerald-600 group-hover:scale-110 transition-transform duration-300">
                                        +{formatCurrency(animatedValues.income)}
                                    </div>
                                    <div className="mt-2 text-xs text-emerald-600 opacity-75">This Month</div>
                                </div>


                                <div className="text-center p-4 bg-background rounded-lg border border-border hover:shadow-lg hover:border-red-300 transition-all duration-300 group">
                                    <div className="text-sm text-muted-foreground mb-2 flex items-center justify-center gap-1">
                                        <TrendingDownIcon className="h-4 w-4 text-red-500" />
                                        Monthly Expenses
                                    </div>
                                    <div className="text-2xl font-bold text-red-500 group-hover:scale-110 transition-transform duration-300">
                                        -{formatCurrency(animatedValues.expenses)}
                                    </div>
                                    <div className="mt-2 text-xs text-red-500 opacity-75">This Month</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
