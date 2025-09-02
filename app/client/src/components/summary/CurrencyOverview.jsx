"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrencyName, getCurrencySymbol } from "@/lib/currencyUtils"
import { ArrowDownIcon, ArrowUpIcon, TrendingUpIcon } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function CurrencyOverview({
  currencySummary,
  dateRangeFormatted,
  isLoading,
  onCurrencySelect,
  onCurrencyImport,
  isAuthenticated,
  onSignInClick,
}) {
  const navigate = useNavigate()

  const handleCurrencyImport = (currencyCode) => {
    if (onCurrencyImport) {
      onCurrencyImport(currencyCode)
    } else {
      navigate(`/dashboard/import?currency=${currencyCode}`)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 py-4 px-4">
        {/* Loading Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[hsl(var(--accent))/0.1] to-[hsl(var(--chart-3))/0.1] rounded-full mb-4 animate-pulse border border-[hsl(var(--accent))/0.2]">
            <div className="w-8 h-8 bg-gradient-to-r from-[hsl(var(--accent))/0.2] to-[hsl(var(--chart-3))/0.2] rounded animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="h-6 sm:h-8 bg-gradient-to-r from-[hsl(var(--accent))/0.1] to-[hsl(var(--chart-3))/0.1] rounded-lg w-48 sm:w-64 mx-auto animate-pulse"></div>
            <div className="h-4 sm:h-6 bg-gradient-to-r from-[hsl(var(--accent))/0.1] to-[hsl(var(--chart-3))/0.1] rounded w-24 sm:w-32 mx-auto animate-pulse"></div>
            <div className="h-6 sm:h-8 bg-gradient-to-r from-[hsl(var(--accent))/0.1] to-[hsl(var(--chart-3))/0.1] rounded-full w-32 sm:w-40 mx-auto animate-pulse"></div>
          </div>
        </div>

        {/* Loading Cards */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full max-w-6xl mx-auto">
          {[1, 2, 3].map((i) => (
            <Card
              key={i}
              className="animate-pulse border border-[hsl(var(--accent))/0.1] bg-gradient-to-br from-[hsl(var(--accent))/0.05] to-[hsl(var(--chart-3))/0.05]"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-[hsl(var(--accent))/0.2] to-[hsl(var(--chart-3))/0.2] rounded-lg animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 sm:h-5 bg-gradient-to-r from-[hsl(var(--accent))/0.1] to-[hsl(var(--chart-3))/0.1] rounded w-12 sm:w-16 animate-pulse"></div>
                    <div className="h-3 sm:h-4 bg-gradient-to-r from-[hsl(var(--accent))/0.1] to-[hsl(var(--chart-3))/0.1] rounded w-16 sm:w-24 animate-pulse"></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="py-3 sm:py-4 bg-gradient-to-r from-[hsl(var(--accent))/0.05] to-[hsl(var(--chart-3))/0.05] rounded-lg">
                  <div className="h-3 sm:h-4 bg-gradient-to-r from-[hsl(var(--accent))/0.1] to-[hsl(var(--chart-3))/0.1] rounded w-16 sm:w-20 mx-auto mb-2 animate-pulse"></div>
                  <div className="h-6 sm:h-8 bg-gradient-to-r from-[hsl(var(--accent))/0.1] to-[hsl(var(--chart-3))/0.1] rounded w-24 sm:w-32 mx-auto animate-pulse"></div>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-[hsl(var(--positive))/0.05] rounded-lg">
                    <div className="h-3 sm:h-4 bg-[hsl(var(--positive))/0.1] rounded w-12 sm:w-16 mx-auto mb-2 animate-pulse"></div>
                    <div className="h-4 sm:h-6 bg-[hsl(var(--positive))/0.1] rounded w-16 sm:w-20 mx-auto animate-pulse"></div>
                  </div>
                  <div className="p-2 sm:p-3 bg-[hsl(var(--destructive))/0.05] rounded-lg">
                    <div className="h-3 sm:h-4 bg-[hsl(var(--destructive))/0.1] rounded w-12 sm:w-16 mx-auto mb-2 animate-pulse"></div>
                    <div className="h-4 sm:h-6 bg-[hsl(var(--destructive))/0.1] rounded w-16 sm:w-20 mx-auto animate-pulse"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const currencies = currencySummary?.currencies || []

  if (currencies.length === 0) {
    return (
      <div className="text-center py-8 px-4 max-w-full mx-auto">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[hsl(var(--accent))/0.1] to-[hsl(var(--chart-3))/0.1] rounded-full mb-4 border border-[hsl(var(--accent))/0.2] backdrop-blur-sm">
            <TrendingUpIcon className="h-8 w-8 text-[hsl(var(--accent))]" />
          </div>
          <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-3 bg-gradient-to-r from-[hsl(var(--accent))] to-[hsl(var(--chart-3))] bg-clip-text text-transparent">
            Start Your Financial Journey
          </h3>
          <p className="text-[hsl(var(--muted-foreground))] mb-6 text-sm sm:text-base">
            Looks like there's nothing here yet. Import your transactions to start discover your financial picture.
          </p>
        </div>

        {/* Currency Import Options */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-[hsl(var(--foreground))] text-center bg-gradient-to-r from-[hsl(var(--accent))] to-[hsl(var(--chart-3))] bg-clip-text text-transparent">
            Choose Currency to Import
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl mx-auto">
            {/* ARS Button */}
            <button
              onClick={() => handleCurrencyImport("ARS")}
              className="flex flex-col items-center gap-2 px-3 py-4 sm:px-4 sm:py-3 bg-gradient-to-r from-[hsl(var(--chart-2))] to-[hsl(var(--chart-2))/0.8] hover:from-[hsl(var(--chart-2))/0.9] hover:to-[hsl(var(--chart-2))/0.7] text-[hsl(var(--accent-foreground))] font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 border border-[hsl(var(--chart-3))/0.2] backdrop-blur-sm"
            >
              <span className="text-xl sm:text-lg font-bold">$</span>
              <span className="text-xs sm:text-sm">ARS</span>
            </button>

            {/* USD Button */}
            <button
              onClick={() => handleCurrencyImport("USD")}
              className="flex flex-col items-center gap-2 px-3 py-4 sm:px-4 sm:py-3 bg-gradient-to-r from-[hsl(var(--chart-4))] to-[hsl(var(--chart-2))/0.8] hover:from-[hsl(var(--chart-4))/0.9] hover:to-[hsl(var(--chart-2))/0.7] text-[hsl(var(--accent-foreground))] font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 border border-[hsl(var(--chart-4))/0.2] backdrop-blur-sm"
            >
              <span className="text-xl sm:text-lg font-bold">$</span>
              <span className="text-xs sm:text-sm">USD</span>
            </button>

            {/* AUD Button */}
            <button
              onClick={() => handleCurrencyImport("AUD")}
              className="flex flex-col items-center gap-2 px-3 py-4 sm:px-4 sm:py-3 bg-gradient-to-r from-[hsl(var(--chart-1))] to-[hsl(var(--chart-3))/0.8] hover:from-[hsl(var(--chart-1))/0.9] hover:to-[hsl(var(--chart-3))/0.7] text-[hsl(var(--accent-foreground))] font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 border border-[hsl(var(--chart-1))/0.2] backdrop-blur-sm"
            >
              <span className="text-xl sm:text-lg font-bold">A$</span>
              <span className="text-xs sm:text-sm">AUD</span>
            </button>

            {/* GBP Button */}
            <button
              onClick={() => handleCurrencyImport("GBP")}
              className="flex flex-col items-center gap-2 px-3 py-4 sm:px-4 sm:py-3 bg-gradient-to-r from-[hsl(var(--chart-5))] to-[hsl(var(--accent))/0.8] hover:from-[hsl(var(--chart-5))/0.9] hover:to-[hsl(var(--accent))/0.7] text-[hsl(var(--accent-foreground))] font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 border border-[hsl(var(--chart-5))/0.2] backdrop-blur-sm"
            >
              <span className="text-xl sm:text-lg font-bold">£</span>
              <span className="text-xs sm:text-sm">GBP</span>
            </button>
            
            <button
              onClick={() => handleCurrencyImport("EUR")}
              className="flex flex-col items-center gap-2 px-3 py-4 sm:px-4 sm:py-3 bg-gradient-to-r from-[hsl(var(--chart-5))] to-[hsl(var(--chart-5))/0.8] hover:from-[hsl(var(--chart-5))/0.9] hover:to-[hsl(var(--chart-5))/0.7] text-[hsl(var(--accent-foreground))] font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 border border-[hsl(var(--chart-5))/0.2] backdrop-blur-sm"
            >
              <span className="text-xl sm:text-lg font-bold">€</span>
              <span className="text-xs sm:text-sm">EUR</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Determine grid layout based on number of currencies
  const getGridLayout = () => {
    if (currencies.length === 1) return "grid-cols-1 max-w-md mx-auto"
    if (currencies.length === 2) return "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto"
    if (currencies.length === 3) return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto"
    if (currencies.length === 4) return "grid-cols-1 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto"
    return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-7xl mx-auto"
  }

  return (
    <div className="space-y-8">
      {/* Currency Cards Grid */}
      <div className={`grid gap-6 ${getGridLayout()}`}>
        {currencies.map((currencyData) => {
          const balance = currencyData.income - currencyData.outcome
          const isPositive = balance >= 0
          const totalActivity = currencyData.income + currencyData.outcome

          return (
            <Card
              key={currencyData.currency}
              className="group cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-[1.03] border border-[hsl(var(--accent))/0.1] bg-gradient-to-br from-[hsl(var(--accent))/0.05] to-[hsl(var(--chart-3))/0.05] backdrop-blur-sm relative overflow-hidden"
              onClick={() => onCurrencySelect(currencyData.currency)}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--accent))/0.05] to-[hsl(var(--chart-3))/0.05] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <CardHeader className="pb-4 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[hsl(var(--accent))/0.2] to-[hsl(var(--chart-3))/0.2] rounded-xl flex items-center justify-center border border-[hsl(var(--accent))/0.2]">
                      <span className="text-lg font-bold bg-gradient-to-r from-[hsl(var(--accent))] to-[hsl(var(--chart-3))] bg-clip-text text-transparent">
                        {getCurrencySymbol(currencyData.currency)}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold bg-gradient-to-r from-[hsl(var(--accent))] to-[hsl(var(--chart-3))] bg-clip-text text-transparent">
                        {currencyData.currency}
                      </CardTitle>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">
                        {getCurrencyName(currencyData.currency)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${
                        isPositive
                          ? "bg-gradient-to-r from-[hsl(var(--positive))/0.1] to-[hsl(var(--positive))/0.15] text-[hsl(var(--positive))] border-[hsl(var(--positive))/0.2]"
                          : "bg-gradient-to-r from-[hsl(var(--destructive))/0.1] to-[hsl(var(--destructive))/0.15] text-[hsl(var(--destructive))] border-[hsl(var(--destructive))/0.2]"
                      }`}
                    >
                      {isPositive ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
                      <span>{isPositive ? "Profit" : "Loss"}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 relative">
                {/* Main Balance Display */}
                <div className="text-center py-4 bg-gradient-to-r from-[hsl(var(--accent))/0.05] to-[hsl(var(--chart-3))/0.05] rounded-xl border border-[hsl(var(--accent))/0.1] backdrop-blur-sm">
                  <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">Net Balance</p>
                  <p className={`text-2xl md:text-3xl font-bold ${isPositive ? "text-[hsl(var(--positive))]" : "text-[hsl(var(--destructive))]"}`}>
                    {isPositive ? "+" : "-"}
                    {getCurrencySymbol(currencyData.currency)}
                    {Math.abs(balance).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Income/Expenses Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gradient-to-r from-[hsl(var(--positive))/0.05] to-[hsl(var(--positive))/0.1] rounded-xl border border-[hsl(var(--positive))/0.1] backdrop-blur-sm">
                    <div className="flex items-center justify-center mb-2">
                      <ArrowUpIcon className="h-4 w-4 text-[hsl(var(--positive))] mr-1" />
                      <span className="text-xs font-medium text-[hsl(var(--positive))] uppercase tracking-wide">Income</span>
                    </div>
                    <p className="text-lg font-bold text-[hsl(var(--positive))]">
                      {getCurrencySymbol(currencyData.currency)}
                      {currencyData.income.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>

                  <div className="text-center p-3 bg-gradient-to-r from-[hsl(var(--destructive))/0.05] to-[hsl(var(--destructive))/0.1] rounded-xl border border-[hsl(var(--destructive))/0.1] backdrop-blur-sm">
                    <div className="flex items-center justify-center mb-2">
                      <ArrowDownIcon className="h-4 w-4 text-[hsl(var(--destructive))] mr-1" />
                      <span className="text-xs font-medium text-[hsl(var(--destructive))] uppercase tracking-wide">Expenses</span>
                    </div>
                    <p className="text-lg font-bold text-[hsl(var(--destructive))]">
                      {getCurrencySymbol(currencyData.currency)}
                      {currencyData.outcome.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>

                {/* Activity Indicator */}
                <div className="flex items-center justify-between pt-3 border-t border-[hsl(var(--accent))/0.1]">
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">Total Activity</span>
                  <span className="text-xs font-medium bg-gradient-to-r from-[hsl(var(--accent))] to-[hsl(var(--chart-3))] bg-clip-text text-transparent">
                    {getCurrencySymbol(currencyData.currency)}
                    {totalActivity.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Click hint with arrow */}
                <div className="flex items-center justify-center pt-2 opacity-60 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-[hsl(var(--muted-foreground))] mr-2">View Details</span>
                  <ArrowUpIcon className="h-3 w-3 text-[hsl(var(--accent))] rotate-45 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
