"use client"

import ActivityList from "@/components/ActivityList"
import AuthModal from "@/components/AuthModal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/services/api"
import {
  CalendarIcon,
  LogOutIcon,
  PlusIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  UserIcon,
  WalletIcon
} from "lucide-react"
import { useEffect, useState } from "react"

export default function App() {
  const [summary, setSummary] = useState({ income: 0, outcome: 0 })
  const [entries, setEntries] = useState([])
  const [form, setForm] = useState({ amount: "", type: "outcome", description: "", date: "" })
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [userData, setUserData] = useState(null)
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    total: 0
  });

  // Check authentication status on load
  useEffect(() => {
    const checkAuth = () => {
      const isAuth = api.isAuthenticated();
      setIsAuthenticated(isAuth);

      if (isAuth) {
        // Fetch user profile
        fetchUserProfile();
        // Fetch budget data
        fetchSummary();
        fetchDetails();
      }
    };

    checkAuth();
  }, []);

  const fetchUserProfile = async () => {
    const profile = await api.get("/auth/profile");
    if (!profile.error) {
      setUserData(profile);
    }
  };

  const fetchSummary = async () => {
    try {
      let url = "/budget/summary";
      const params = new URLSearchParams();

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const data = await api.get(url);
      if (!data.error) {
        setSummary(data);
      } else {
        console.error("Error fetching summary:", data.error);
      }
    } catch (error) {
      console.error("Failed to fetch summary:", error);
      // Set default summary to avoid blank UI
      setSummary({ income: 0, outcome: 0 });
    }
  };

  const fetchDetails = async () => {
    try {
      let url = "/budget/details";
      const params = new URLSearchParams();

      params.append("limit", pagination.limit);
      params.append("offset", pagination.offset);

      url += `?${params.toString()}`;

      const data = await api.get(url);
      if (!data.error) {
        setEntries(data.data || []);
        setPagination({
          ...pagination,
          total: data.pagination?.total || 0
        });
      } else {
        console.error("Error fetching details:", data.error);
        setEntries([]);
      }
    } catch (error) {
      console.error("Failed to fetch details:", error);
      setEntries([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    const response = await api.post("/budget/entry", form);
    if (!response.error) {
      setForm({ amount: "", type: "income", description: "", date: "" });
      fetchSummary();
      fetchDetails();
    }
  };

  const handleLogout = () => {
    api.logout();
    setIsAuthenticated(false);
    setUserData(null);
    setSummary({ income: 0, outcome: 0 });
    setEntries([]);
  };

  const handleAuthentication = (authData) => {
    setShowAuthModal(false);
    setIsAuthenticated(true);
    fetchUserProfile();
    fetchSummary();
    fetchDetails();
  };

  const balance = summary.income - summary.outcome;
  const formattedDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-[#121418]">
      {showAuthModal && <AuthModal onAuthenticated={handleAuthentication} />}

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
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-neutral-400 dark:text-neutral-300">
                <WalletIcon className="h-5 w-5" />
                <span className="text-xs font-medium tracking-wider uppercase">MYNAB</span>
              </div>

              {isAuthenticated && (
                <div className="flex items-center gap-3">
                  {userData && (
                    <div className="hidden md:flex items-center gap-2">
                      <div className="bg-neutral-200 dark:bg-[#2a303a] rounded-full p-1">
                        <UserIcon className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
                      </div>
                      <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                        {userData.name}
                      </span>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-neutral-600 dark:text-neutral-300"
                  >
                    <LogOutIcon className="h-4 w-4" />
                    <span className="hidden md:inline ml-1">Logout</span>
                  </Button>
                </div>
              )}
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
            <ActivityList
              isAuthenticated={isAuthenticated}
              entries={entries}
              onSignInClick={() => setShowAuthModal(true)}
              onTransactionDeleted={() => {
                fetchSummary();
                fetchDetails();
              }}
            />
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
                {!isAuthenticated ? (
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
                      onClick={() => setShowAuthModal(true)}
                      className="mt-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-emerald-800/80 dark:hover:bg-emerald-700/90"
                      size="lg"
                    >
                      Sign In
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-2">
                      <Label
                        htmlFor="amount"
                        className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
                      >
                        Amount
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white text-sm">$</span>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          value={form.amount}
                          onChange={(e) => setForm({ ...form, amount: e.target.value })}
                          className="pl-7 border-0 bg-neutral-100 dark:bg-[#2a303a] focus:bg-white dark:focus:bg-[#353b47] transition-colors placeholder:text-white dark:placeholder:text-white dark:text-white"
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
                        className="border-0 bg-neutral-100 dark:bg-[#2a303a] focus:bg-white dark:focus:bg-[#353b47] transition-colors placeholder:text-neutral-500 dark:placeholder:text-white"
                        placeholder="What's this transaction for?"
                      />
                    </div><div className="space-y-2">
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
                          className="border-0 bg-neutral-100 dark:bg-[#2a303a] focus:bg-white dark:focus:bg-[#353b47] transition-colors placeholder:text-white dark:placeholder:text-white dark:text-white"
                          required
                        />
                        <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-300 pointer-events-none" />
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
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
