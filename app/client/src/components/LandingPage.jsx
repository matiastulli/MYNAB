"use client"

import AuthModal from "@/components/auth_user/AuthModal"
import { Button } from "@/components/ui/button"
import { setupSystemPreferenceListener } from "@/lib/themeUtils"
import {
    DollarSignIcon,
    LogInIcon
} from "lucide-react"
import { useEffect, useState } from "react"

export default function LandingPage({ onGetStarted }) {
    const [showAuthModal, setShowAuthModal] = useState(false)

    // Setup system preference listener for theme changes
    useEffect(() => {
        const cleanup = setupSystemPreferenceListener();
        return cleanup;
    }, []);

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
                            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center">
                                <DollarSignIcon className="h-5 w-5 text-white" />
                            </div>
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
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-full mb-6">
                            <DollarSignIcon className="h-10 w-10 text-emerald-600" />
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
                            Take Control of Your
                            <span className="block bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                                Multi-Currency Finances
                            </span>
                        </h1>
                    </div>
                </div>
            </section>
        </div>
    )
}
