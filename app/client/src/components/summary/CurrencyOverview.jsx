"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownIcon, ArrowUpIcon, TrendingUpIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CurrencyOverview({ currencySummary, dateRangeFormatted, isLoading, onCurrencySelect, isAuthenticated, onSignInClick }) {
  const navigate = useNavigate()
  
  if (isLoading) {
    return (
      <div className="space-y-8 py-4">
        {/* Loading Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-full mb-4 animate-pulse">
            <div className="w-8 h-8 bg-muted rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded-lg w-64 mx-auto"></div>
            <div className="h-6 bg-muted rounded w-32 mx-auto"></div>
            <div className="h-8 bg-muted rounded-full w-40 mx-auto"></div>
          </div>
        </div>

        {/* Loading Cards */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-lg"></div>
                  <div className="space-y-2">
                    <div className="h-5 bg-muted rounded w-16"></div>
                    <div className="h-4 bg-muted rounded w-24"></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="py-4 bg-muted/30 rounded-lg">
                  <div className="h-4 bg-muted rounded w-20 mx-auto mb-2"></div>
                  <div className="h-8 bg-muted rounded w-32 mx-auto"></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <div className="h-4 bg-muted rounded w-16 mx-auto mb-2"></div>
                    <div className="h-6 bg-muted rounded w-20 mx-auto"></div>
                  </div>
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <div className="h-4 bg-muted rounded w-16 mx-auto mb-2"></div>
                    <div className="h-6 bg-muted rounded w-20 mx-auto"></div>
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
      <div className="text-center py-12 max-w-md mx-auto">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-full mb-4">
            <TrendingUpIcon className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-3">Start Your Financial Journey</h3>
          <p className="text-muted-foreground mb-6">
            No transactions found for the selected date range. Begin tracking your finances by importing your transactions files.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => navigate('/import?currency=ARS')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          Import ARS Transactions
        </button>
        
        <p className="text-xs text-muted-foreground mt-3">
          Support for CSV, Excel and PDF
        </p>
      </div>
    )
  }

  // Get currency symbols
  const getCurrencySymbol = (currencyCode) => {
    const symbols = {
      ARS: "$",
      USD: "$",
      EUR: "€",
      BRL: "R$"
    }
    return symbols[currencyCode] || currencyCode
  }

  const getCurrencyName = (currencyCode) => {
    const names = {
      ARS: "Argentine Peso",
      USD: "US Dollar",
      EUR: "Euro",
      BRL: "Brazilian Real"
    }
    return names[currencyCode] || currencyCode
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
    <div className="space-y-8 py-4">
      {/* Header Section */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-full mb-4">
          <TrendingUpIcon className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
          Multi-Currency Portfolio
        </h2>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">
            {currencies.length} Active {currencies.length === 1 ? 'Currency' : 'Currencies'}
          </span>
        </div>
      </div>

      {/* Currency Cards Grid */}
      <div className={`grid gap-6 ${getGridLayout()}`}>
        {currencies.map((currencyData) => {
          const balance = currencyData.income - currencyData.outcome
          const isPositive = balance >= 0
          const totalActivity = currencyData.income + currencyData.outcome

          return (
            <Card
              key={currencyData.currency}
              className="group cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-[1.03] border-border bg-gradient-to-br from-card to-card/80 backdrop-blur-sm relative overflow-hidden"
              onClick={() => onCurrencySelect(currencyData.currency)}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <CardHeader className="pb-4 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-lg font-bold text-foreground">
                        {getCurrencySymbol(currencyData.currency)}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-foreground">
                        {currencyData.currency}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {getCurrencyName(currencyData.currency)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${isPositive
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-600 border border-red-500/20'
                      }`}>
                      {isPositive ? (
                        <ArrowUpIcon className="h-3 w-3" />
                      ) : (
                        <ArrowDownIcon className="h-3 w-3" />
                      )}
                      <span>{isPositive ? 'Profit' : 'Loss'}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 relative">
                {/* Main Balance Display */}
                <div className="text-center py-4 bg-muted/30 rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Net Balance</p>
                  <p className={`text-2xl md:text-3xl font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                    {isPositive ? '+' : '-'}{getCurrencySymbol(currencyData.currency)}{Math.abs(balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Income/Expenses Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                    <div className="flex items-center justify-center mb-2">
                      <ArrowUpIcon className="h-4 w-4 text-emerald-600 mr-1" />
                      <span className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Income</span>
                    </div>
                    <p className="text-lg font-bold text-emerald-600">
                      {getCurrencySymbol(currencyData.currency)}{currencyData.income.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className="text-center p-3 bg-red-500/5 rounded-lg border border-red-500/10">
                    <div className="flex items-center justify-center mb-2">
                      <ArrowDownIcon className="h-4 w-4 text-red-600 mr-1" />
                      <span className="text-xs font-medium text-red-600 uppercase tracking-wide">Expenses</span>
                    </div>
                    <p className="text-lg font-bold text-red-600">
                      {getCurrencySymbol(currencyData.currency)}{currencyData.outcome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* Activity Indicator */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Total Activity</span>
                  <span className="text-xs font-medium text-foreground">
                    {getCurrencySymbol(currencyData.currency)}{totalActivity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Click hint with arrow */}
                <div className="flex items-center justify-center pt-2 opacity-60 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-muted-foreground mr-2">View Details</span>
                  <ArrowUpIcon className="h-3 w-3 text-muted-foreground rotate-45 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
