"use client"

import { useDashboardContext } from "@/contexts/DashboardContext"
import { getCurrencyName, getCurrencySymbol, getSupportedCurrencies } from "@/lib/currencyUtils"
import { snappy } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { StackIcon } from "@phosphor-icons/react"
import { motion } from "framer-motion"

const SUPPORTED = getSupportedCurrencies()

export default function CurrencyFilter({ isLoading, availableCurrencies, vertical = false }) {
  const { currency: selectedCurrency, handleCurrencyChange } = useDashboardContext()

  // Always show all supported currencies; dim the ones with no data in the current period
  const withData = new Set(availableCurrencies || [])
  const items = ["ALL", ...SUPPORTED.map((c) => c.code)]

  if (vertical) {
    return (
      <nav aria-label="Currency" className="flex w-full flex-col gap-0.5">
        {items.map((code) => {
          const isActive = code === selectedCurrency
          const hasData = code === "ALL" || withData.has(code)
          return (
            <button
              key={code}
              onClick={() => !isLoading && handleCurrencyChange(code)}
              disabled={isLoading}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group relative flex h-10 w-full items-center gap-3 rounded-xl px-2.5 text-left transition-colors duration-200 active:scale-[0.99]",
                isActive ? "text-foreground" : hasData ? "text-muted-foreground hover:text-foreground" : "text-muted-foreground/45 hover:text-muted-foreground",
                isLoading && "pointer-events-none"
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="currency-active"
                  transition={snappy}
                  className="absolute inset-0 rounded-xl border border-border/80 bg-card shadow-[var(--shadow-diffuse)]"
                />
              )}
              <span
                className={cn(
                  "figure relative grid size-6 place-items-center rounded-lg text-[11px] font-semibold transition-colors",
                  isActive ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground group-hover:text-foreground"
                )}
              >
                {code === "ALL" ? <StackIcon className="size-3.5" weight="bold" /> : getCurrencySymbol(code)}
              </span>
              <span className="relative flex min-w-0 flex-1 items-baseline justify-between gap-2">
                <span className="text-[13px] font-medium">{code === "ALL" ? "Overview" : code}</span>
                <span className="truncate text-[11px] text-muted-foreground/80">
                  {code === "ALL" ? "All" : getCurrencyName(code).split(" ").pop()}
                </span>
              </span>
            </button>
          )
        })}
      </nav>
    )
  }

  return (
    <nav aria-label="Currency" className="flex items-center gap-1">
      {items.map((code) => {
        const isActive = code === selectedCurrency
        const hasData = code === "ALL" || withData.has(code)
        return (
          <button
            key={code}
            onClick={() => !isLoading && handleCurrencyChange(code)}
            disabled={isLoading}
            aria-current={isActive ? "page" : undefined}
            aria-label={code === "ALL" ? "All currencies" : code}
            className={cn(
              "relative flex h-10 min-w-11 shrink-0 flex-col items-center justify-center rounded-2xl px-2 transition-colors duration-200 active:scale-[0.97]",
              isActive ? "text-accent-foreground" : "text-muted-foreground",
              !hasData && !isActive && "opacity-45",
              isLoading && "pointer-events-none"
            )}
          >
            {isActive && (
              <motion.span layoutId="currency-active-mobile" transition={snappy} className="absolute inset-0 rounded-2xl bg-accent" />
            )}
            <span className="figure relative text-xs font-semibold leading-none">
              {code === "ALL" ? <StackIcon className="size-3.5" weight="bold" /> : getCurrencySymbol(code)}
            </span>
            <span className="relative mt-1 text-[9px] font-medium leading-none tracking-[0.08em]">
              {code === "ALL" ? "ALL" : code}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
