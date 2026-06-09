"use client"

import { useDashboardContext } from "@/contexts/DashboardContext"
import { getCurrencySymbol, getSupportedCurrencies } from "@/lib/currencyUtils"

const SUPPORTED = getSupportedCurrencies()

export default function CurrencyFilter({ isLoading, availableCurrencies, vertical = false }) {
  const { currency: selectedCurrency, handleCurrencyChange } = useDashboardContext()

  // Always show all supported currencies; track which have data in the current period
  const withData = new Set(availableCurrencies || [])
  const allCodes = SUPPORTED.map((c) => c.code)
  const items = ["ALL", ...allCodes]

  if (vertical) {
    return (
      <div className="flex flex-col gap-0.5 w-full">
        {items.map((code) => {
          const isActive = code === selectedCurrency
          const hasData = code === "ALL" || withData.has(code)
          const symbol = code === "ALL" ? "∗" : getCurrencySymbol(code)
          return (
            <button
              key={code}
              onClick={() => !isLoading && handleCurrencyChange(code)}
              disabled={isLoading}
              className={`
                w-full flex items-center gap-2.5 px-3 h-8 rounded-lg transition-all duration-150 text-sm font-medium
                ${isActive
                  ? "bg-[hsl(var(--accent)/0.15)] text-[hsl(var(--accent))]"
                  : hasData
                    ? "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                    : "text-[hsl(var(--muted-foreground)/0.4)] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--muted-foreground))]"
                }
                ${isLoading ? "opacity-40 pointer-events-none" : ""}
              `}
            >
              <span className="w-4 text-center font-bold text-xs shrink-0">{symbol}</span>
              <span className="tracking-wide text-xs">{code}</span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto snap-x snap-mandatory">
      {items.map((code) => {
        const isActive = code === selectedCurrency
        const hasData = code === "ALL" || withData.has(code)
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
              ${!hasData && !isActive ? "opacity-40" : ""}
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
