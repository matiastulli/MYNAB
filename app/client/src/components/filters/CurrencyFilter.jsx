"use client"

import { useDashboardContext } from "@/contexts/DashboardContext"
import { getCurrencySymbol, getSupportedCurrencies } from "@/lib/currencyUtils"

const SUPPORTED = getSupportedCurrencies()

export default function CurrencyFilter({ isLoading, availableCurrencies }) {
  const { currency: selectedCurrency, handleCurrencyChange } = useDashboardContext()

  const codes =
    availableCurrencies && availableCurrencies.length > 0
      ? availableCurrencies
      : SUPPORTED.map((c) => c.code)

  const items = ["ALL", ...codes]

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto snap-x snap-mandatory">
      {items.map((code) => {
        const isActive = code === selectedCurrency
        const symbol = code === "ALL" ? "∗" : getCurrencySymbol(code)
        return (
          <button
            key={code}
            onClick={() => !isLoading && handleCurrencyChange(code)}
            disabled={isLoading}
            className={`
              snap-start shrink-0 flex flex-col items-center justify-center
              w-12 h-10 rounded-xl transition-all duration-150
              ${isActive
                ? "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] shadow-sm"
                : "bg-[hsl(var(--background)/0.35)] border border-[var(--glass-border)] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              }
              ${isLoading ? "opacity-40 pointer-events-none" : ""}
            `}
          >
            <span className={`leading-none font-bold ${isActive ? "text-sm" : "text-xs"}`}>
              {symbol}
            </span>
            <span className="text-[9px] leading-tight mt-0.5 font-medium tracking-wide opacity-80">
              {code}
            </span>
          </button>
        )
      })}
    </div>
  )
}
