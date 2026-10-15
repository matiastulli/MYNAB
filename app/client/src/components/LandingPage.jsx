"use client"

import LedgerPreview from '@/components/landing/LedgerPreview'
import { usePWAInstall } from "@/hooks/usePWAInstall"
import { listItem, listParent } from "@/lib/motion"
import { setupSystemPreferenceListener } from "@/lib/themeUtils"
import { api } from '@/services/api'
import { DownloadSimpleIcon, LockKeyIcon, WarningCircleIcon } from "@phosphor-icons/react"
import { useGoogleLogin } from '@react-oauth/google'
import { motion } from "framer-motion"
import { memo, useEffect, useState } from "react"

const BANKS = ["Santander Rio", "ICBC", "Mercado Pago", "BBVA", "CommBank", "Revolut"]

function GoogleLogo() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-[18px] shrink-0" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
    )
}

// Endless band of supported banks
const BankMarquee = memo(function BankMarquee() {
    const loop = [...BANKS, ...BANKS]
    return (
        <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
            <motion.div
                className="flex w-max gap-8"
                animate={{ x: ["0%", "-50%"] }}
                transition={{ duration: 22, ease: "linear", repeat: Infinity }}
            >
                {loop.map((bank, i) => (
                    <span key={i} className="whitespace-nowrap text-[13px] font-medium text-muted-foreground">
                        {bank}
                    </span>
                ))}
            </motion.div>
        </div>
    )
})

export default function LandingPage({ onGetStarted }) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const { canInstall, handleInstall } = usePWAInstall()

    // Setup system preference listener for theme changes
    useEffect(() => {
        const cleanup = setupSystemPreferenceListener();
        return cleanup;
    }, []);

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

    return (
        <div className="min-h-[100dvh] overflow-x-hidden bg-background">
            <div className="mx-auto grid min-h-[100dvh] max-w-[1400px] grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">

                {/* Left: pitch + sign in */}
                <motion.div
                    variants={listParent}
                    initial="hidden"
                    animate="show"
                    className="flex flex-col justify-between gap-12 px-4 py-8 sm:px-8 lg:px-12 lg:py-10"
                >
                    <motion.header variants={listItem} className="flex items-center justify-between">
                        <span className="flex items-center gap-2.5">
                            <img src="/android-chrome-192x192.png" alt="" className="size-8 rounded-[10px] object-cover" />
                            <span className="text-[15px] font-semibold tracking-tight">MYNAB</span>
                        </span>
                        <a href="/privacy" className="text-[13px] text-muted-foreground transition-colors hover:text-foreground">
                            Privacy
                        </a>
                    </motion.header>

                    <div className="flex flex-col gap-8">
                        <motion.div variants={listItem} className="flex flex-col gap-5">
                            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">Maybe You Need A Budget</p>
                            <h1 className="max-w-[16ch] text-4xl font-semibold leading-[0.98] tracking-tighter md:text-6xl">
                                Every peso, dollar and pound in one ledger.
                            </h1>
                            <p className="max-w-[46ch] text-base leading-relaxed text-muted-foreground">
                                Drop in the statements your bank already gives you. MYNAB sorts each line into a
                                category, skips the duplicates and shows where the month went, per currency.
                            </p>
                        </motion.div>

                        <motion.div variants={listItem} className="flex flex-col gap-3">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <button
                                    onClick={() => login()}
                                    disabled={isLoading}
                                    className="inline-flex h-12 items-center justify-center gap-3 rounded-full border border-[#dadce0] bg-white px-6 text-[15px] font-medium text-[#1f1f1f] shadow-[0_1px_2px_hsl(240_10%_4%/0.08)] transition-[box-shadow,transform] duration-300 hover:shadow-[0_6px_20px_-6px_hsl(240_10%_4%/0.25)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isLoading ? (
                                        <span className="size-[18px] rounded-full border-2 border-[#4285F4] border-t-transparent animate-spin" />
                                    ) : (
                                        <GoogleLogo />
                                    )}
                                    {isLoading ? 'Signing in' : 'Continue with Google'}
                                </button>

                                {canInstall && (
                                    <button
                                        onClick={handleInstall}
                                        className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border px-5 text-[15px] font-medium text-foreground transition-colors duration-200 hover:bg-muted active:scale-[0.98]"
                                    >
                                        <DownloadSimpleIcon className="size-4" />
                                        Install app
                                    </button>
                                )}
                            </div>

                            {error ? (
                                <p role="alert" className="flex items-center gap-2 text-[13px] font-medium text-destructive">
                                    <WarningCircleIcon className="size-4 shrink-0" weight="fill" />
                                    {error}
                                </p>
                            ) : (
                                <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
                                    <LockKeyIcon className="size-4 shrink-0" />
                                    No bank passwords. You upload files, nothing connects to your accounts.
                                </p>
                            )}
                        </motion.div>
                    </div>

                    <motion.footer variants={listItem} className="flex flex-col gap-4">
                        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Reads statements from</p>
                        <BankMarquee />
                        <p className="text-xs text-muted-foreground/80">© {new Date().getFullYear()} Pampas Studio</p>
                    </motion.footer>
                </motion.div>

                {/* Right: live product preview on a recessed panel */}
                <div className="px-4 pb-16 sm:px-8 lg:py-6 lg:pl-0 lg:pr-6">
                    <div className="relative flex h-full flex-col justify-center overflow-hidden rounded-[2.5rem] bg-muted/70 px-4 py-14 sm:px-10 lg:px-14">
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 opacity-[0.5] [background-image:radial-gradient(hsl(var(--foreground)/0.07)_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.15 }}
                            className="relative mx-auto w-full max-w-[640px]"
                        >
                            <LedgerPreview />
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    )
}
