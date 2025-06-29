import SignInPrompt from "@/components/auth_user/SignInPrompt";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialValue } from "@/components/ui/financial-value";
import { Spinner } from "@/components/ui/spinner";
import { parseDatePreservingDay } from "@/lib/dateUtils";
import { format } from 'date-fns';
import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  BarChart2Icon,
  CalendarIcon,
  CircleDollarSignIcon,
  LayoutDashboardIcon,
  PieChartIcon,
  TrendingDownIcon,
  TrendingUpIcon
} from "lucide-react";

// Import the recharts components for data visualization
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

export default function Dashboard({
  isAuthenticated,
  onSignInClick,
  summary = { income: 0, outcome: 0, categories: [] },
  entries = [],
  dateRange,
  dateRangeFormatted,
  currency = "USD",
  isLoading = false,
  onTransactionDeleted
}) {
  
  // Calculate balance
  const balance = summary.income - summary.outcome;
  
  // Extract categories for visualization
  const categories = summary.categories || [];
  
  // Format most recent entries
  const recentEntries = [...entries].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  ).slice(0, 5);
  
  // Prepare data for the spending chart
  const spendingData = [];
  if (categories.length > 0) {
    // Filter to get only expense categories
    const expenseCategories = categories
      .filter(cat => cat.total < 0)
      .sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
      
    // Take top 5 categories for the chart
    const topCategories = expenseCategories.slice(0, 5);
    
    // Calculate "Others" for remaining categories
    const othersTotal = expenseCategories
      .slice(5)
      .reduce((sum, cat) => sum + Math.abs(cat.total), 0);
    
    // Format data for pie chart
    spendingData.push(
      ...topCategories.map(cat => ({
        name: cat.category,
        value: Math.abs(cat.total),
      }))
    );
    
    // Add "Others" if there are more categories
    if (othersTotal > 0) {
      spendingData.push({
        name: 'Others',
        value: othersTotal,
      });
    }
  }
  
  // Chart colors
  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#6B7280'];

  // Format currency for display
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: currency,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  if (!isAuthenticated) {
    return (
      <SignInPrompt
        title="Sign in to view your dashboard"
        description="Track your spending and income by signing in to your account"
        onSignInClick={onSignInClick}
      />
    );
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Income vs. Expenses chart */}
            <div className={`${isLoading ? 'animate-pulse' : ''}`}>
              <h3 className="text-sm font-medium mb-3 text-muted-foreground">Income vs. Expenses</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Income', amount: summary.income },
                      { name: 'Expenses', amount: summary.outcome }
                    ]}
                    margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tickFormatter={(value) => formatCurrency(value)} 
                    />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)} 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '0.5rem', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar 
                      dataKey="amount" 
                      name="Amount" 
                      radius={[4, 4, 0, 0]} 
                      maxBarSize={60}
                    >
                      <Cell fill="hsl(var(--chart-1))" />
                      <Cell fill="hsl(var(--chart-2))" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Spending breakdown chart */}
            <div className={`${isLoading ? 'animate-pulse' : ''}`}>
              <h3 className="text-sm font-medium mb-3 text-muted-foreground">Spending Breakdown</h3>
              <div className="h-64">
                {spendingData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={spendingData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {spendingData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
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
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent transactions */}
      <Card className="border-border bg-card backdrop-blur-sm shadow-sm">
        <CardHeader className="pb-2 border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-foreground flex items-center gap-2">
              <BarChart2Icon className="h-5 w-5 text-accent" />
              Recent Transactions
            </CardTitle>
            <div className="flex items-center text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded border border-accent/20">
              <CircleDollarSignIcon className="h-3 w-3 mr-1" />
              {currency}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-8 flex justify-center">
              <Spinner size="md" />
            </div>
          ) : recentEntries.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No recent transactions found</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${
                        entry.amount >= 0
                          ? "bg-success-bg text-success-fg"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {entry.amount >= 0 ? (
                        <ArrowUpRightIcon className="h-4 w-4" />
                      ) : (
                        <ArrowDownRightIcon className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground line-clamp-1">
                        {entry.description || "No description"}
                      </p>
                      <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        {(() => {
                          const entryDate = parseDatePreservingDay(entry.date);
                          return format(entryDate, "MMM d, yyyy");
                        })()}
                      </div>
                    </div>
                  </div>
                  <div>
                    <FinancialValue
                      value={entry.amount}
                      type={entry.type}
                      currency={entry.currency}
                      showSign={true}
                      size="md"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          
        </CardContent>
      </Card>
      
      {/* Financial snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border bg-card backdrop-blur-sm shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Monthly Balance</h3>
              <div className={`p-2 rounded-full ${
                balance >= 0
                  ? "bg-success-bg text-success-fg"
                  : "bg-destructive/10 text-destructive"
              }`}>
                {balance >= 0 ? (
                  <TrendingUpIcon className="h-4 w-4" />
                ) : (
                  <TrendingDownIcon className="h-4 w-4" />
                )}
              </div>
            </div>
            <p className={`text-xl font-semibold ${
              balance >= 0
                ? "text-success-fg"
                : "text-destructive"
            }`}>
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
            {categories.length > 0 ? (
              <>
                <p className="text-xl font-semibold text-foreground">
                  {categories
                    .filter(cat => cat.total < 0)
                    .sort((a, b) => Math.abs(b.total) - Math.abs(a.total))[0]?.category || "None"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Highest spending category
                </p>
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
            <p className="text-xl font-semibold text-foreground">
              {entries.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Transactions this period
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
