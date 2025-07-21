import { Card, CardContent } from "@/components/ui/card";
import { TrendingDownIcon, TrendingUpIcon, WalletIcon } from "lucide-react";

export default function SummaryCards({ 
  summary = { income: 0, outcome: 0, categories: [] }, 
  currency = "ARS", 
  dateRangeFormatted = "",
  isLoading = false 
}) {
  const balance = summary.income - summary.outcome;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {/* Balance Card */}
      <Card className={`border-[hsl(var(--border))] bg-[hsl(var(--card))] backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow ${isLoading ? 'relative overflow-hidden' : ''}`}>
        <CardContent className="p-6">
          {isLoading && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[hsl(var(--foreground))/0.1] to-transparent animate-shimmer"></div>
          )}
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                Current Balance
              </p>
              <p 
                className="text-2xl font-semibold mt-2"
                style={{
                  color: balance >= 0 
                    ? "hsl(var(--success-fg))" 
                    : "hsl(var(--destructive))"
                }}
              >
                {currency === "EUR" ? "€" : "$"}
                {Math.abs(balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div 
              className="p-3 rounded-full"
              style={{
                backgroundColor: balance >= 0 
                  ? "hsl(var(--success-bg))" 
                  : "hsl(var(--destructive) / 0.1)",
                color: balance >= 0 
                  ? "hsl(var(--success-fg))" 
                  : "hsl(var(--destructive))"
              }}
            >
              <WalletIcon className="h-6 w-6" />
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-[hsl(var(--border))]">
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {balance >= 0 ? "You're in good standing" : "Your expenses exceed income"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Income Card */}
      <Card className={`border-[hsl(var(--border))] bg-[hsl(var(--card))] backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow ${isLoading ? 'relative overflow-hidden' : ''}`}>
        <CardContent className="p-6">
          {isLoading && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[hsl(var(--foreground))/0.1] to-transparent animate-shimmer"></div>
          )}
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                Income
              </p>
              <p 
                className="text-2xl font-semibold mt-2"
                style={{ color: "hsl(var(--success-fg))" }}
              >
                {currency === "EUR" ? "€" : "$"}
                {summary.income.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div 
              className="p-3 rounded-full"
              style={{
                backgroundColor: "hsl(var(--success-bg))",
                color: "hsl(var(--success-fg))"
              }}
            >
              <TrendingUpIcon className="h-6 w-6" />
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-[hsl(var(--border))]">
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Total income for {dateRangeFormatted}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Card */}
      <Card className={`border-[hsl(var(--border))] bg-[hsl(var(--card))] backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow ${isLoading ? 'relative overflow-hidden' : ''}`}>
        <CardContent className="p-6">
          {isLoading && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[hsl(var(--foreground))/0.1] to-transparent animate-shimmer"></div>
          )}
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                Expenses
              </p>
              <p 
                className="text-2xl font-semibold mt-2"
                style={{ color: "hsl(var(--destructive))" }}
              >
                {currency === "EUR" ? "€" : "$"}
                {summary.outcome.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div 
              className="p-3 rounded-full"
              style={{
                backgroundColor: "hsl(var(--destructive) / 0.1)",
                color: "hsl(var(--destructive))"
              }}
            >
              <TrendingDownIcon className="h-6 w-6" />
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-[hsl(var(--border))]">
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Total expenses for {dateRangeFormatted}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
