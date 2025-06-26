"use client"

import ActivityList from "@/components/ActivityList"
import AuthModal from "@/components/AuthModal"
import FilesList from "@/components/FilesList"
import ImportFile from "@/components/ImportFile"
import ManualTransactionForm from "@/components/ManualTransactionForm"
import ProfileUpdateDialog from "@/components/ProfileUpdateDialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/services/api"
import {
  AlertTriangleIcon,
  LogOutIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  UserIcon,
  WalletIcon
} from "lucide-react"
import { useEffect, useState } from "react"

export default function App() {
  const [summary, setSummary] = useState({ income: 0, outcome: 0 })
  const [entries, setEntries] = useState([])
  const [files, setFiles] = useState([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [userData, setUserData] = useState(null)
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    total: 0
  });
  const [showProfileModal, setShowProfileModal] = useState(false);

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
        fetchFiles();
      }
    };

    checkAuth();
  }, []);

  const fetchUserProfile = async () => {
    const profile = await api.get("/auth/profile");

    console.log("Fetched user profile:", profile);

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

  const fetchFiles = async () => {
    try {
      let url = "/files";
      const params = new URLSearchParams();

      params.append("limit", pagination.limit);
      params.append("offset", pagination.offset);

      url += `?${params.toString()}`;

      const data = await api.get(url);
      if (!data.error) {
        setFiles(data.data || []);
        setPagination({
          ...pagination,
          total: data.pagination?.total || 0
        });
      } else {
        console.error("Error fetching files:", data.error);
        setFiles([]);
      }
    } catch (error) {
      console.error("Failed to fetch files:", error);
      setFiles([]);
    }
  };

  const handleLogout = () => {
    api.logout();
    setIsAuthenticated(false);
    setUserData(null);
    setSummary({ income: 0, outcome: 0 });
    setEntries([]);
    setFiles([]);
  };

  const handleAuthentication = (authData) => {
    setShowAuthModal(false);
    setIsAuthenticated(true);
    fetchUserProfile();
    fetchSummary();
    fetchDetails();
    fetchFiles();
  };

  const balance = summary.income - summary.outcome;
  const formattedDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-[#121418] dark:to-[#191c22]">
      {showAuthModal && <AuthModal onAuthenticated={handleAuthentication} />}

      <div className="max-w-5xl mx-auto px-4 py-8 md:px-6 md:py-12">
        {/* Header */}
        <header className="mb-8 md:mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 p-2 bg-white/80 dark:bg-[#1a1e24]/80 shadow-sm rounded-lg">
                <WalletIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium tracking-wider uppercase text-neutral-800 dark:text-neutral-200">MYNAB</span>
              </div>
              <div>
                <h1 className="text-2xl font-medium tracking-tight text-neutral-900 dark:text-neutral-100">
                  Budget Overview
                </h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{formattedDate}</p>
              </div>
            </div>

            {isAuthenticated && (
              <div className="flex items-center gap-3 ml-auto">
                {userData && (
                  <div
                    className="flex items-center gap-2 cursor-pointer bg-white/80 dark:bg-[#1a1e24]/80 hover:bg-white dark:hover:bg-[#1e232a] rounded-lg px-3 py-2 transition-colors shadow-sm"
                    onClick={() => setShowProfileModal(true)}
                  >
                    <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded-full p-1.5">
                      <UserIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                      {userData.name}
                    </span>
                    {(!userData.national_id || userData.national_id === "") && (
                      <div className="flex items-center" title="Missing CUIT - required for transaction filtering">
                        <AlertTriangleIcon className="h-4 w-4 text-amber-500" />
                      </div>
                    )}
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="text-neutral-600 dark:text-neutral-300 bg-white/80 dark:bg-[#1a1e24]/80 hover:bg-white/90 dark:hover:bg-[#1e232a] shadow-sm border-0"
                >
                  <LogOutIcon className="h-4 w-4" />
                  <span className="ml-1.5">Logout</span>
                </Button>
              </div>
            )}
          </div>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* Balance Card */}
          <Card className="border-0 bg-white/80 dark:bg-[#1a1e24]/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                    Current Balance
                  </p>
                  <p className={`text-2xl font-semibold mt-2 ${balance >= 0 
                      ? "text-emerald-600 dark:text-emerald-400" 
                      : "text-red-500 dark:text-red-400"}`}>
                    ${Math.abs(balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${balance >= 0 
                    ? "bg-emerald-50 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400" 
                    : "bg-red-50 dark:bg-red-900/70 text-red-500 dark:text-red-400"}`}>
                  <WalletIcon className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {balance >= 0 ? "You're in good standing" : "Your expenses exceed income"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Income Card */}
          <Card className="border-0 bg-white/80 dark:bg-[#1a1e24]/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
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
                <div className="p-3 rounded-full bg-emerald-50 dark:bg-emerald-900/70 text-emerald-600 dark:text-emerald-400">
                  <TrendingUpIcon className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Total income for {new Date().toLocaleDateString("en-US", { month: "long" })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Expenses Card */}
          <Card className="border-0 bg-white/80 dark:bg-[#1a1e24]/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
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
                <div className="p-3 rounded-full bg-red-50 dark:bg-red-900/70 text-red-500 dark:text-red-400">
                  <TrendingDownIcon className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Total expenses for {new Date().toLocaleDateString("en-US", { month: "long" })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="entries" className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="inline-flex bg-white/80 dark:bg-[#1a1e24]/80 p-1.5 gap-x-1.5 rounded-xl shadow-sm">
              <TabsTrigger
                value="entries"
                className="text-neutral-700 dark:text-neutral-300 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-emerald-50/70 dark:data-[state=active]:bg-emerald-900/30 data-[state=active]:shadow-sm rounded-lg px-4"
              >
                Transactions
              </TabsTrigger>
              <TabsTrigger
                value="new"
                className="text-neutral-700 dark:text-neutral-300 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-emerald-50/70 dark:data-[state=active]:bg-emerald-900/30 data-[state=active]:shadow-sm rounded-lg px-4"
              >
                Add Manual
              </TabsTrigger>
              <TabsTrigger
                value="import"
                className="text-neutral-700 dark:text-neutral-300 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-emerald-50/70 dark:data-[state=active]:bg-emerald-900/30 data-[state=active]:shadow-sm rounded-lg px-4"
              >
                Import
              </TabsTrigger>
              <TabsTrigger
                value="files"
                className="text-neutral-700 dark:text-neutral-300 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-emerald-50/70 dark:data-[state=active]:bg-emerald-900/30 data-[state=active]:shadow-sm rounded-lg px-4"
              >
                Files
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Transactions List */}
          <TabsContent value="entries" className="space-y-4 mt-6 focus-visible:outline-none">
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
          <TabsContent value="new" className="mt-6 focus-visible:outline-none">
            <ManualTransactionForm
              isAuthenticated={isAuthenticated}
              onSignInClick={() => setShowAuthModal(true)}
              onTransactionAdded={() => {
                fetchSummary();
                fetchDetails();
              }}
            />
          </TabsContent>
          
          {/* Import Transactions */}
          <TabsContent value="import" className="mt-6 focus-visible:outline-none">
            {!isAuthenticated ? (
              <Card className="border-0 bg-white/60 dark:bg-[#1a1e24]/90 backdrop-blur-sm max-w-2xl mx-auto">
                <CardContent>
                  <div className="flex flex-col items-center gap-4 py-6">
                    <div className="p-4 rounded-full bg-neutral-100 dark:bg-[#2a303a]">
                      <UserIcon className="h-6 w-6 text-neutral-400 dark:text-neutral-300" />
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                        Sign in to import transactions
                      </h3>
                      <p className="text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                        You need to be signed in to import your transactions from Excel or CSV or PDF files.
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
                </CardContent>
              </Card>
            ) : (
              <ImportFile
                onImportSuccess={() => {
                  fetchSummary();
                  fetchDetails();
                }}
                className="max-w-2xl mx-auto"
              />
            )}
          </TabsContent>

          {/* Files List */}
          <TabsContent value="files" className="mt-6 focus-visible:outline-none">
            <FilesList
              isAuthenticated={isAuthenticated}
              onSignInClick={() => setShowAuthModal(true)}
              onFileDeleted={() => {
                fetchSummary();
                fetchDetails();
              }}
            />
          </TabsContent>
        </Tabs>

        {/* Profile Update Dialog */}
        <ProfileUpdateDialog
          open={showProfileModal}
          onOpenChange={setShowProfileModal}
          userData={userData}
          onProfileUpdated={fetchUserProfile}
        />
      </div>
    </div>
  );
}
