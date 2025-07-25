import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCurrencyName, getCurrencySymbol } from "@/lib/currencyUtils";
import { toDateOnlyISOString } from "@/lib/dateUtils";
import { api } from "@/services/api";
import { CalendarIcon, CheckIcon, CircleDollarSignIcon, PlusCircleIcon, PlusIcon, TagIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { useEffect, useState } from "react";

export default function AddTransaction({
  isAuthenticated,
  onSignInClick,
  onTransactionAdded,
  defaultCurrency = "ARS"
}) {
  const [form, setForm] = useState({
    amount: "",
    type: "outcome",
    description: "",
    date: toDateOnlyISOString(new Date()),
    currency: defaultCurrency,
    source: "manual",
    reference_id: "",
    category_id: null,
  });

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      
        setLoadingCategories(true);
        try {
          const response = await api.get("/budget-transaction-category/budget-transaction-category");
          if (response && !response.error) {
            setCategories(response);
          }
        } catch (error) {
          console.error("Error fetching transaction categories:", error);
        } finally {
          setLoadingCategories(false);
        }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    setForm(prevForm => ({
      ...prevForm,
      currency: defaultCurrency
    }));
  }, [defaultCurrency]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      const response = await api.post("/budget/entry", form);
      if (!response.error) {
        setSuccess(true);

        // Reset form
        setForm({
          amount: "",
          type: "outcome",
          description: "",
          date: toDateOnlyISOString(new Date()),
          currency: defaultCurrency,
          source: "manual",
          reference_id: "",
          category_id: null
        });

        onTransactionAdded();
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card))] backdrop-blur-sm shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[hsl(var(--accent)/0.1)] border border-[hsl(var(--accent)/0.2)]">
              <PlusCircleIcon className="h-5 w-5 text-[hsl(var(--accent))]" />
            </div>
            <CardTitle className="text-xl font-semibold text-[hsl(var(--foreground))]">
              Add Transaction
            </CardTitle>
          </div>
          <div className="flex items-center gap-2 bg-[hsl(var(--accent)/0.1)] text-[hsl(var(--accent))] px-3 py-1.5 rounded-full border border-[hsl(var(--accent)/0.2)]">
            <CircleDollarSignIcon className="h-4 w-4" />
            <span className="text-sm font-medium">{defaultCurrency}</span>
            <span className="text-xs opacity-75">({getCurrencyName(defaultCurrency)})</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {success ? (
          <div className="flex flex-col items-center py-12 gap-6">
            <div className="p-4 rounded-full bg-[hsl(var(--positive)/0.1)] border-2 border-[hsl(var(--positive)/0.2)]">
              <CheckIcon className="h-8 w-8 text-[hsl(var(--positive))]" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-[hsl(var(--foreground))]">Transaction Added Successfully!</h3>
              <p className="text-[hsl(var(--muted-foreground))] max-w-md">
                Your transaction has been recorded and will appear in your transaction history.
              </p>
            </div>
            <Button
              onClick={() => setSuccess(false)}
              className="bg-[hsl(var(--positive))] hover:bg-[hsl(var(--positive)/0.9)] text-[hsl(var(--positive-foreground))] px-6"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Another Transaction
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Info Box */}
            <div className="bg-[hsl(var(--info-bg))] border-2 border-[hsl(var(--info-fg)/0.2)] rounded-lg p-4">
              <h4 className="font-semibold text-[hsl(var(--info-fg))] flex items-center gap-2 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Setting an initial account balance
              </h4>
              <p className="text-[hsl(var(--info-fg)/0.85)] text-sm leading-relaxed">
                If you're importing recent transactions but already had money in your account, add your starting balance as an "Income" transaction with the description "Initial Balance". This helps ensure your account balances match your real-world accounts.
              </p>
            </div>

            {/* Amount and Type Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="amount" className="text-sm font-semibold text-foreground">
                  Amount *
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground text-lg font-semibold">
                    {getCurrencySymbol(form.currency)}
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="pl-10 pr-4 h-12 text-lg font-medium border-2 border-border bg-background focus:border-accent transition-all duration-200"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="type" className="text-sm font-semibold text-foreground">
                  Transaction Type *
                </Label>
                <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value })}>
                  <SelectTrigger className="h-12 border-2 border-border bg-background focus:border-accent">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-2 border-border shadow-xl">
                    <SelectItem value="outcome" className="text-[hsl(var(--popover-foreground))] py-3">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-full bg-[hsl(var(--destructive)/0.1)]">
                          <TrendingDownIcon className="h-4 w-4 text-[hsl(var(--destructive))]" />
                        </div>
                        <div>
                          <div className="font-medium">Expense</div>
                          <div className="text-xs text-[hsl(var(--muted-foreground))]">Money going out</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="income" className="text-[hsl(var(--popover-foreground))] py-3">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-full bg-[hsl(var(--positive)/0.1)]">
                          <TrendingUpIcon className="h-4 w-4 text-[hsl(var(--positive))]" />
                        </div>
                        <div>
                          <div className="font-medium">Income</div>
                          <div className="text-xs text-muted-foreground">Money coming in</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <Label htmlFor="description" className="text-sm font-semibold text-foreground">
                Description
              </Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="h-12 border-2 border-border bg-background focus:border-accent transition-all duration-200"
                placeholder="What's this transaction for? (e.g., Grocery shopping, Salary, etc.)"
              />
            </div>

            {/* Date and Category Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="date" className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  Date *
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="h-12 border-2 border-border bg-background focus:border-accent transition-all duration-200"
                  required
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="category" className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <TagIcon className="h-4 w-4 text-muted-foreground" />
                  Category
                </Label>
                <Select 
                  value={form.category_id ? form.category_id.toString() : "none"} 
                  onValueChange={(value) => setForm({ 
                    ...form, 
                    category_id: value !== "none" ? parseInt(value) : null 
                  })}
                >
                  <SelectTrigger className="h-12 border-2 border-border bg-background focus:border-accent">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-[hsl(var(--popover))] border-2 border-[hsl(var(--border))] shadow-xl">
                    <SelectItem value="none" className="text-[hsl(var(--popover-foreground))] py-2">
                      <span className="text-[hsl(var(--muted-foreground))]">No category</span>
                    </SelectItem>
                    {loadingCategories ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="h-4 w-4 border-2 border-[hsl(var(--accent))] border-t-transparent rounded-full animate-spin"></div>
                        <span className="ml-2 text-sm text-[hsl(var(--muted-foreground))]">Loading categories...</span>
                      </div>
                    ) : (
                      categories.map(category => (
                        <SelectItem key={category.id} value={category.id.toString()} className="text-[hsl(var(--popover-foreground))] py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[hsl(var(--accent))]"></div>
                            <span>{category.category_name}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Currency Display (Read-only) */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CircleDollarSignIcon className="h-4 w-4 text-muted-foreground" />
                Currency
              </Label>
              <div className="flex items-center justify-between h-12 px-4 rounded-md border-2 border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.5)]">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold text-[hsl(var(--foreground))]">{getCurrencySymbol(defaultCurrency)}</span>
                  <div>
                    <span className="font-medium text-[hsl(var(--foreground))]">{defaultCurrency}</span>
                    <span className="text-sm text-[hsl(var(--muted-foreground))] ml-2">
                      {getCurrencyName(defaultCurrency)}
                    </span>
                  </div>
                </div>
                <span className="text-xs bg-[hsl(var(--accent)/0.1)] text-[hsl(var(--accent))] px-2 py-1 rounded-full border border-[hsl(var(--accent)/0.2)]">
                  Current Filter
                </span>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <CircleDollarSignIcon className="h-3 w-3" />
                Transactions are added in your selected currency filter
              </p>
            </div>

            {/* Reference ID */}
            <div className="space-y-3">
              <Label htmlFor="reference_id" className="text-sm font-semibold text-foreground">
                Reference ID
              </Label>
              <Input
                id="reference_id"
                value={form.reference_id}
                onChange={(e) => setForm({ ...form, reference_id: e.target.value })}
                className="h-12 border-2 border-border bg-background focus:border-accent transition-all duration-200"
                placeholder="Transaction reference, invoice number, etc."
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="success"
              size="xl"
              className="w-full text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || !form.amount}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 border-2 border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing Transaction...</span>
                </div>
              ) : (
                <>
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Transaction
                </>
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}