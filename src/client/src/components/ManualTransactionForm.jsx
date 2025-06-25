import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/services/api";
import { CalendarIcon, PlusIcon, UserIcon } from "lucide-react";
import { useState } from "react";

export default function ManualTransactionForm({ 
  isAuthenticated, 
  onSignInClick, 
  onTransactionAdded 
}) {
  const [form, setForm] = useState({ 
    amount: "", 
    type: "outcome", 
    description: "", 
    date: "",
    currency: "ARS",
    source: "manual"
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      onSignInClick();
      return;
    }

    const response = await api.post("/budget/entry", form);
    if (!response.error) {
      setForm({ 
        amount: "", 
        type: "outcome", 
        description: "", 
        date: "",
        currency: "ARS",
        source: "manual"
      });
      onTransactionAdded();
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className="border-0 bg-white/60 dark:bg-[#1a1e24]/90 backdrop-blur-sm max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
            Add Transaction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="p-4 rounded-full bg-neutral-100 dark:bg-[#2a303a]">
              <UserIcon className="h-6 w-6 text-neutral-400 dark:text-neutral-300" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                Sign in to add transactions
              </h3>
              <p className="text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                You need to be signed in to add and track your transactions in MYNAB.
              </p>
            </div>
            <Button
              onClick={onSignInClick}
              className="mt-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-emerald-800/80 dark:hover:bg-emerald-700/90"
              size="lg"
            >
              Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-white/60 dark:bg-[#1a1e24]/90 backdrop-blur-sm max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
          Add Transaction
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label
                htmlFor="amount"
                className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
              >
                Amount
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 dark:text-neutral-300 text-sm">
                  {form.currency === 'USD' ? '$' : form.currency === 'EUR' ? '€' : '$'}
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="pl-7 border-0 bg-neutral-100 dark:bg-[#2a303a] focus:bg-white dark:focus:bg-[#353b47] transition-colors placeholder:text-neutral-500 dark:placeholder:text-neutral-400 dark:text-white"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                Type
              </Label>
              <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value })}>
                <SelectTrigger
                  id="type"
                  className="border-0 bg-neutral-100 dark:bg-[#2a303a] focus:bg-white dark:focus:bg-[#353b47]"
                >
                  <SelectValue placeholder="Select type" className="text-neutral-900 dark:text-white" />
                </SelectTrigger>
                <SelectContent className="dark:bg-[#1e232a] dark:border-neutral-700">
                  <SelectItem value="outcome" className="text-neutral-900 dark:text-white">Expense</SelectItem>
                  <SelectItem value="income" className="text-neutral-900 dark:text-white">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
              Description
            </Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="border-0 bg-neutral-100 dark:bg-[#2a303a] focus:bg-white dark:focus:bg-[#353b47] transition-colors placeholder:text-neutral-500 dark:placeholder:text-neutral-400"
              placeholder="What's this transaction for?"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label
                htmlFor="date"
                className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
              >
                Date
              </Label>
              <div className="relative">
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="border-0 bg-neutral-100 dark:bg-[#2a303a] focus:bg-white dark:focus:bg-[#353b47] transition-colors dark:text-white"
                  required
                />
                <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-300 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency" className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                Currency
              </Label>
              <Select value={form.currency} onValueChange={(value) => setForm({ ...form, currency: value })}>
                <SelectTrigger
                  id="currency"
                  className="border-0 bg-neutral-100 dark:bg-[#2a303a] focus:bg-white dark:focus:bg-[#353b47]"
                >
                  <SelectValue placeholder="Select currency" className="text-neutral-900 dark:text-white" />
                </SelectTrigger>
                <SelectContent className="dark:bg-[#1e232a] dark:border-neutral-700">
                  <SelectItem value="ARS" className="text-neutral-900 dark:text-white">ARS - Argentine Peso</SelectItem>
                  <SelectItem value="USD" className="text-neutral-900 dark:text-white">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR" className="text-neutral-900 dark:text-white">EUR - Euro</SelectItem>
                  <SelectItem value="BRL" className="text-neutral-900 dark:text-white">BRL - Brazilian Real</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-neutral-900 hover:bg-neutral-800 dark:bg-emerald-800/80 dark:hover:bg-emerald-700/90 dark:text-white transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
