"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/services/api"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarIcon,
  PlusIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletIcon,
} from "lucide-react"
import { useEffect, useState } from "react"

export default function App() {
  const [summary, setSummary] = useState({ income: 0, outcome: 0 })
  const [entries, setEntries] = useState([])
  const [form, setForm] = useState({ amount: "", type: "income", description: "", date: "" })

  const fetchSummary = async () => {
    const data = await api.get("/budget/summary")
    setSummary(data)
  }

  const fetchDetails = async () => {
    const data = await api.get("/budget/details")
    setEntries(data)
  }

  useEffect(() => {
    fetchSummary()
    fetchDetails()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    await api.post("/budget/entry", form)
    setForm({ amount: "", type: "income", description: "", date: "" })
    fetchSummary()
    fetchDetails()
  }

  const balance = summary.income - summary.outcome
  const formattedDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-[#121418]">
      <div className="max-w-4xl mx-auto px-4 py-8 md:px-6 md:py-12">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-medium tracking-tight text-neutral-900 dark:text-neutral-100">
                Budget Overview
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{formattedDate}</p>
            </div>
            <div className="flex items-center gap-2 text-neutral-400 dark:text-neutral-300">
              <WalletIcon className="h-5 w-5" />
              <span className="text-xs font-medium tracking-wider uppercase">MYNAB</span>
            </div>
          </div>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Balance Card */}
          <Card className="border-0 bg-white/60 dark:bg-[#1a1e24]/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                    Balance
                  </p>
                  <p
                    className={`text-2xl font-semibold mt-2 ${balance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
                      }`}
                  >
                    ${Math.abs(balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div
                  className={`p-3 rounded-full ${balance >= 0 ? "bg-emerald-50 dark:bg-emerald-900/60" : "bg-red-50 dark:bg-red-900/70"
                    }`}
                >
                  <WalletIcon
                    className={`h-5 w-5 ${balance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
                      }`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Income Card */}
          <Card className="border-0 bg-white/60 dark:bg-[#1a1e24]/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                    Income
                  </p>
                  <p className="text-2xl font-semibold mt-2 text-emerald-600 dark:text-emerald-400">
                    ${summary.income.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-emerald-50 dark:bg-emerald-900/70">
                  <TrendingUpIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expenses Card */}
          <Card className="border-0 bg-white/60 dark:bg-[#1a1e24]/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                    Expenses
                  </p>
                  <p className="text-2xl font-semibold mt-2 text-red-500 dark:text-red-400">
                    ${summary.outcome.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-red-50 dark:bg-red-900/70">
                  <TrendingDownIcon className="h-5 w-5 text-red-500 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content */}
        <Tabs defaultValue="entries" className="space-y-6">
          <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto bg-neutral-100 dark:bg-[#1e232a] p-1">
            <TabsTrigger
              value="entries"
              className="text-neutral-700 dark:text-neutral-300 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white data-[state=active]:bg-white dark:data-[state=active]:bg-[#2a303a] data-[state=active]:shadow-sm"
            >
              Transactions
            </TabsTrigger>
            <TabsTrigger
              value="new"
              className="text-neutral-700 dark:text-neutral-300 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white data-[state=active]:bg-white dark:data-[state=active]:bg-[#2a303a] data-[state=active]:shadow-sm"
            >
              Add New
            </TabsTrigger>
          </TabsList>

          {/* Transactions List */}
          <TabsContent value="entries" className="space-y-4">
            {entries.length === 0 ? (
              <Card className="border-0 bg-white/60 dark:bg-[#1a1e24]/90 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 rounded-full bg-neutral-100 dark:bg-[#2a303a]">
                      <WalletIcon className="h-6 w-6 text-neutral-400 dark:text-neutral-300" />
                    </div>
                    <p className="text-neutral-500 dark:text-neutral-300">No transactions this month</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 bg-white/60 dark:bg-[#1a1e24]/90 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {entries.map((entry, index) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-6 hover:bg-neutral-50/50 dark:hover:bg-[#2a303a]/70 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`p-2.5 rounded-full ${entry.type === "income"
                                ? "bg-emerald-50 dark:bg-emerald-900/70"
                                : "bg-red-50 dark:bg-red-900/70"
                              }`}
                          >
                            {entry.type === "income" ? (
                              <ArrowUpIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <ArrowDownIcon className="h-4 w-4 text-red-500 dark:text-red-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900 dark:text-neutral-100">
                              {entry.description || "No description"}
                            </p>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                              {new Date(entry.date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-semibold ${entry.type === "income"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-red-500 dark:text-red-400"
                              }`}
                          >
                            {entry.type === "income" ? "+" : "-"}$
                            {Number.parseFloat(entry.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Add New Transaction */}
          <TabsContent value="new">
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
                      <Label htmlFor="amount" className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                        Amount
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-300 text-sm">$</span>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          value={form.amount}
                          onChange={(e) => setForm({ ...form, amount: e.target.value })}
                          className="pl-7 border-0 bg-neutral-100 dark:bg-[#2a303a] focus:bg-white dark:focus:bg-[#353b47] transition-colors"
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
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-[#1a1e24] dark:border-neutral-700">
                          <SelectItem value="income" className="dark:text-neutral-100">Income</SelectItem>
                          <SelectItem value="outcome" className="dark:text-neutral-100">Expense</SelectItem>
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
                      className="border-0 bg-neutral-100 dark:bg-[#2a303a] focus:bg-white dark:focus:bg-[#353b47] transition-colors"
                      placeholder="What's this transaction for?"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                      Date
                    </Label>
                    <div className="relative">
                      <Input
                        id="date"
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        className="border-0 bg-neutral-100 dark:bg-[#2a303a] focus:bg-white dark:focus:bg-[#353b47] transition-colors"
                        required
                      />
                      <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-300 pointer-events-none" />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-neutral-900 hover:bg-neutral-800 dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white transition-colors"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Transaction
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

// ...existing code...
      </div>
    </div>
  )
  // ...existing code...
}
