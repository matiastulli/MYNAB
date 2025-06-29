import SignInPrompt from "@/components/auth_user/SignInPrompt";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toDateOnlyISOString } from "@/lib/date-utils";
import { api } from "@/services/api";
import { AlertCircleIcon, CalendarIcon, CheckIcon, CircleDollarSignIcon, PlusCircleIcon, PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";

export default function ManualTransactionForm({
  isAuthenticated,
  onSignInClick,
  onTransactionAdded,
  defaultCurrency = "ARS" // Accept default currency from parent component
}) {
  const [form, setForm] = useState({
    amount: "",
    type: "outcome",
    description: "",
    // Use today's date in a timezone-safe way
    date: toDateOnlyISOString(new Date()),
    currency: defaultCurrency, // Use the passed in currency
    source: "manual",
    reference_id: ""
  });

  // Update form when defaultCurrency changes
  useEffect(() => {
    setForm(prevForm => ({
      ...prevForm,
      currency: defaultCurrency
    }));
  }, [defaultCurrency]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      onSignInClick();
      return;
    }

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
          currency: defaultCurrency, // Keep the current currency
          source: "manual",
          reference_id: ""
        });

        // Notify parent component
        onTransactionAdded();

        // Reset success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <SignInPrompt
        title="Sign in to add transactions"
        description="You need to be signed in to add and track your transactions in MYNAB."
        onSignInClick={onSignInClick}
      />
    );
  }

  return (
  <Card className="border-0 bg-white/80 dark:bg-[#1a1e24]/80 backdrop-blur-sm shadow-sm">
    <CardHeader className="pb-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
          <div className="flex items-center gap-2">
        <CardTitle className="text-lg font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <PlusCircleIcon className="h-5 w-5 text-emerald-500" />
          Add Transaction
        </CardTitle>
        {/* Currency indicator - positioned next to the title */}
        <div className="flex items-center text-xs bg-blue-50/70 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800/30 w-fit ml-0 xs:ml-2">
          <CircleDollarSignIcon className="h-3 w-3 mr-1" />
          {defaultCurrency}
        </div>
      </div>
      </div>
    </CardHeader>
    <CardContent className="p-6">

      {success ? (
        <div className="flex flex-col items-center py-8 gap-4">
          <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <CheckIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">Transaction Added!</h3>
            <p className="text-neutral-500 dark:text-neutral-400">Your transaction has been successfully added to your account.</p>
          </div>
          <Button
            onClick={() => setSuccess(false)}
            className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Add Another Transaction
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 w-full">
              <Label htmlFor="amount" className="text-sm font-medium text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5">
                Amount
              </Label>
              <div className="relative w-full">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 dark:text-neutral-300 text-sm font-medium">
                  {form.currency === 'USD' ? '$' : form.currency === 'EUR' ? '€' : form.currency === 'BRL' ? 'R$' : '$'}
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full pl-7 border-0 bg-white dark:bg-[#2a303a] focus:bg-white dark:focus:bg-[#353b47] transition-colors text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-200 text-lg h-[42px]"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 w-full">
              <Label htmlFor="type" className="text-sm font-medium text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5">
                Transaction Type
              </Label>
              <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value })}>
                <SelectTrigger
                  id="type"
                  className="w-full border-0 bg-white dark:bg-[#2a303a] focus:bg-white dark:focus:bg-[#353b47] h-[42px] text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-200"
                >
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="w-full dark:bg-[#1e232a] dark:border-neutral-700">
                  <SelectItem value="outcome" className="text-neutral-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span>Expense</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="income" className="text-neutral-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      <span>Income</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2 w-full">
            <Label htmlFor="description" className="text-sm font-medium text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5">
              Description
            </Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border-0 bg-white dark:bg-[#2a303a] focus:bg-white dark:focus:bg-[#353b47] transition-colors text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-200 h-[42px]"
              placeholder="What's this transaction for?"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 w-full">
              <Label htmlFor="date" className="text-sm font-medium text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5">
                <CalendarIcon className="h-4 w-4 opacity-70" />
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full border-0 bg-white dark:bg-[#2a303a] focus:bg-white dark:focus:bg-[#353b47] transition-colors text-neutral-900 dark:text-white h-[42px]"
                required
              />
            </div>

            <div className="space-y-2 w-full">
              <Label htmlFor="currency" className="text-sm font-medium text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5">
                <CircleDollarSignIcon className="h-4 w-4 opacity-70" />
                Currency
              </Label>
              <Select 
                value={form.currency} 
                onValueChange={(value) => setForm({ ...form, currency: value })}
              >
                <SelectTrigger
                  id="currency"
                  className={`w-full border-0 bg-white dark:bg-[#2a303a] focus:bg-white dark:focus:bg-[#353b47] h-[42px] text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-200 ${form.currency !== defaultCurrency ? 'ring-2 ring-amber-400/50' : ''}`}
                >
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent className="w-full dark:bg-[#1e232a] dark:border-neutral-700">
                  <SelectItem value="ARS" className="text-neutral-900 dark:text-white">
                    <div className="flex items-center justify-between w-full">
                      <span>ARS - Argentine Peso</span>
                      {defaultCurrency === "ARS" && <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">Current Filter</span>}
                    </div>
                  </SelectItem>
                  <SelectItem value="USD" className="text-neutral-900 dark:text-white">
                    <div className="flex items-center justify-between w-full">
                      <span>USD - US Dollar</span>
                      {defaultCurrency === "USD" && <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">Current Filter</span>}
                    </div>
                  </SelectItem>
                  <SelectItem value="EUR" className="text-neutral-900 dark:text-white">
                    <div className="flex items-center justify-between w-full">
                      <span>EUR - Euro</span>
                      {defaultCurrency === "EUR" && <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">Current Filter</span>}
                    </div>
                  </SelectItem>
                  <SelectItem value="BRL" className="text-neutral-900 dark:text-white">
                    <div className="flex items-center justify-between w-full">
                      <span>BRL - Brazilian Real</span>
                      {defaultCurrency === "BRL" && <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">Current Filter</span>}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              {form.currency !== defaultCurrency && (
                <div className="flex items-center gap-1 mt-1">
                  <AlertCircleIcon className="h-3.5 w-3.5 text-amber-500" />
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    This doesn't match your current currency filter ({defaultCurrency})
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 w-full">
            <Label htmlFor="reference_id" className="text-sm font-medium text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5">
              Reference ID <span className="text-xs text-neutral-400">(Optional)</span>
            </Label>
            <Input
              id="reference_id"
              value={form.reference_id}
              onChange={(e) => setForm({ ...form, reference_id: e.target.value })}
              className="w-full border-0 bg-white dark:bg-[#2a303a] focus:bg-white dark:focus:bg-[#353b47] transition-colors text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-200 h-[42px]"
              placeholder="Enter transaction reference ID"
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 text-sm w-full">
            <h4 className="font-medium text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Setting an initial account balance
            </h4>
            <p className="text-blue-700 dark:text-blue-200">
              If you're importing recent transactions but already had money in your account, add your starting balance as an "Income" transaction with the description "Initial Balance".
            </p>
            <p className="text-blue-700 dark:text-blue-200 mt-2">
              This helps ensure your account balances in the app match your real-world accounts since bank statements typically only include recent history (3-6 months).
            </p>
          </div>

          <Button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white transition-colors h-12"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 border-2 border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
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