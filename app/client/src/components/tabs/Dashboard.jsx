import SignInPrompt from "@/components/auth_user/SignInPrompt"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart2Icon,
  CircleDollarSignIcon,
  LayoutDashboardIcon,
  PieChartIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react"

// Import the recharts components for data visualization
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

export default function Dashboard({
  isAuthenticated,
  onSignInClick,
  summary = { income: 0, outcome: 0, categories: { income: [], outcome: [] } },
  entries = [],
  dateRange,
  dateRangeFormatted,
  currency = "USD",
  isLoading = false,
  onTransactionDeleted,
}) {
  // Calculate balance
  const balance = summary.income - summary.outcome

  // Extract categories for visualization - ensure backward compatibility
  const categoriesData = summary.categories || { income: [], outcome: [] }

  // Format most recent entries
  const recentEntries = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)

  // Prepare data for the spending chart
  const spendingData = []
  if (categoriesData.outcome && categoriesData.outcome.length > 0) {
    // Sort outcome categories by amount (descending)
    const sortedCategories = [...categoriesData.outcome].sort((a, b) => b.amount - a.amount)

    // Take top 5 categories for the chart
    const topCategories = sortedCategories.slice(0, 5)

    // Calculate "Others" for remaining categories
    const othersTotal = sortedCategories.slice(5).reduce((sum, cat) => sum + cat.amount, 0)

    // Format data for pie chart
    spendingData.push(
      ...topCategories.map((cat) => ({
        name: cat.name,
        value: cat.amount,
      })),
    )

    // Add "Others" if there are more categories
    if (othersTotal > 0) {
      spendingData.push({
        name: "Others",
        value: othersTotal,
      })
    }
  }

  // Find top expense category
  const topExpenseCategory =
    categoriesData.outcome && categoriesData.outcome.length > 0
      ? [...categoriesData.outcome].sort((a, b) => b.amount - a.amount)[0]
      : null

  // Chart colors
  const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#8B5CF6", "#EC4899", "#6B7280"]

  // Format currency for display
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Custom tooltip component for better dark mode support
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="bg-popover border border-border rounded-lg p-3 shadow-lg"
          style={{ backgroundColor: "hsl(var(--popover))", backgroundImage: "none" }}
        >
          <p className="text-popover-foreground font-medium">{`${payload[0].name}`}</p>
          <p className="text-popover-foreground">
            <span className="font-semibold">{formatCurrency(payload[0].value)}</span>
          </p>
        </div>
      )
    }
    return null
  }

  if (!isAuthenticated) {
    return (
      <SignInPrompt
        title="Sign in to view your dashboard"
        description="Track your spending and income by signing in to your account"
        onSignInClick={onSignInClick}
      />
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card backdrop-blur-sm shadow-sm overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-medium text-foreground flex items-center gap-2">
                <LayoutDashboardIcon className="h-5 w-5 text-accent" />
                Dashboard
              </CardTitle>
              {/* Currency indicator - positioned next to the title */}
              <div className="flex items-center text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded border border-accent/20">
                <CircleDollarSignIcon className="h-3 w-3 mr-1" />
                {currency}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Chart and categories display */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Spending breakdown chart */}
            <div className={`${isLoading ? "animate-pulse" : ""} lg:w-1/2`}>
              <h3 className="text-sm font-medium mb-3 text-muted-foreground">Spending Breakdown</h3>
              <div className="h-64">
                {spendingData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                    <PieChart>
                      <Pie
                        data={spendingData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={false}
                        labelLine={false}
                      >
                        {spendingData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground text-center">
                      <PieChartIcon className="h-10 w-10 mx-auto mb-2 opacity-20" />
                      No spending data available
                    </p>
                  </div>
                )}

                {/* Total spending amount shown in the center - Mobile only */}
                {spendingData.length > 0 && (
                  <div className="mt-4 text-center lg:hidden">
                    <p className="text-sm text-muted-foreground">Total spending</p>
                    <p className="text-xl font-semibold text-foreground">{formatCurrency(summary.outcome)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Categories list - displays differently on desktop vs mobile */}
            {spendingData.length > 0 && (
              <div className="lg:w-1/2 mt-15 lg:mt-0">
                {/* Total spending amount - Desktop only */}
                <div className="hidden lg:block mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Total spending</h3>
                  <p className="text-xl font-semibold text-foreground">{formatCurrency(summary.outcome)}</p>
                </div>

                {/* Categories list */}
                <div className="space-y-3">
                  {spendingData.map((category, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium text-foreground">{category.name}</span>
                      </div>
                      <span className="text-right font-semibold text-foreground">{formatCurrency(category.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Financial snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border bg-card backdrop-blur-sm shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Monthly Balance</h3>
              <div
                className={`p-2 rounded-full ${
                  balance >= 0 ? "bg-success-bg text-success-fg" : "bg-destructive/10 text-destructive"
                }`}
              >
                {balance >= 0 ? <TrendingUpIcon className="h-4 w-4" /> : <TrendingDownIcon className="h-4 w-4" />}
              </div>
            </div>
            <p className={`text-xl font-semibold ${balance >= 0 ? "text-success-fg" : "text-destructive"}`}>
              {formatCurrency(balance)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {balance >= 0 ? "Positive balance" : "Negative balance"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card backdrop-blur-sm shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Top Category</h3>
              <div className="p-2 rounded-full bg-accent/10 text-accent">
                <PieChartIcon className="h-4 w-4" />
              </div>
            </div>
            {topExpenseCategory ? (
              <>
                <p className="text-xl font-semibold text-foreground">{topExpenseCategory.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatCurrency(topExpenseCategory.amount)} spent</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No categories available</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card backdrop-blur-sm shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Transaction Count</h3>
              <div className="p-2 rounded-full bg-accent/10 text-accent">
                <BarChart2Icon className="h-4 w-4" />
              </div>
            </div>
            <p className="text-xl font-semibold text-foreground">{entries.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Transactions this period</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
