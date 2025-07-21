"use client"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronDownIcon, CircleDollarSignIcon } from "lucide-react"
import { useState } from "react"

export default function CurrencyFilter({ selectedCurrency, onCurrencyChange }) {
  const [isOpen, setIsOpen] = useState(false)

  const currencies = [
    { code: "ALL", name: "All Currencies", symbol: "💰" },
    { code: "ARS", name: "Argentine Peso", symbol: "$" },
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "AUD", name: "Australian Dollar", symbol: "A$" },
    { code: "EUR", name: "Euro", symbol: "€" },
  ]

  const selectedCurrencyInfo = currencies.find((c) => c.code === selectedCurrency) || currencies[0]

  const handleSelect = (currency) => {
    onCurrencyChange(currency)
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 bg-card border-border hover:bg-accent gap-1 text-xs sm:text-sm shadow-sm"
        >
          <CircleDollarSignIcon className="h-3.5 w-3.5 text-accent mr-1" />
          <span className="font-medium text-foreground">{selectedCurrencyInfo.code}</span>
          <span className="hidden sm:inline text-muted-foreground">currency</span>
          <ChevronDownIcon className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-48 p-1 bg-popover text-popover-foreground border-border shadow-lg"
        style={{ backgroundColor: "hsl(var(--popover))", backgroundImage: "none" }}
      >
        <div className="space-y-0.5">
          {currencies.map((currency) => (
            <button
              key={currency.code}
              onClick={() => handleSelect(currency.code)}
              className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                currency.code === selectedCurrency
                  ? "bg-accent/20 text-accent font-medium"
                  : "hover:bg-accent/10 text-popover-foreground"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{currency.code}</span>
                  <span className="text-xs text-muted-foreground">{currency.name}</span>
                </div>
                <span className="text-popover-foreground font-semibold">{currency.symbol}</span>
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
