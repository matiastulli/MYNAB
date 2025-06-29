"use client"

import AuthModal from "@/components/auth_user/AuthModal"
import ProfileDialog from "@/components/auth_user/ProfileDialog"
import CurrencyFilter from "@/components/filters/CurrencyFilter"
import DateRangeFilter from "@/components/filters/DateRangeFilter"
import CurrencyNotification from "@/components/notifications/CurrencyNotification"
import ActivityList from "@/components/tabs/ActivityList"
import AddTransaction from "@/components/tabs/AddTransaction"
import Dashboard from "@/components/tabs/Dashboard"; // Import the Dashboard component
import FilesList from "@/components/tabs/FilesList"
import ImportFile from "@/components/tabs/ImportFile"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toDateOnlyISOString } from "@/lib/dateUtils"
import { setupSystemPreferenceListener } from "@/lib/themeUtils"
import { api } from "@/services/api"
import { endOfMonth, format, startOfMonth } from 'date-fns'
import {
  AlertTriangleIcon,
  BarChartIcon,
  FolderIcon,
  LayoutDashboardIcon, // Add icon for dashboard
  PlusCircleIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  UploadIcon,
  UserIcon,
  WalletIcon
} from "lucide-react"
import { useEffect, useState } from "react"

export default function App() {
  // Existing state variables
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
  // Change the default tab to "dashboard"
  const [activeTab, setActiveTab] = useState("dashboard");

  // New date filter state
  const [dateRange, setDateRange] = useState({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
    preset: 'current-month' // Options: 'current-month', 'last-month', 'last-3-months', 'custom'
  });

  // New currency state
  const [currency, setCurrency] = useState("ARS");

  // Add state for files loading and error
  const [filesLoading, setFilesLoading] = useState(false);
  const [filesError, setFilesError] = useState(null);

  // Add loading states for different data fetches
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [entriesLoading, setEntriesLoading] = useState(false);

  // New state for currency notification
  const [showCurrencyNotification, setShowCurrencyNotification] = useState(false);
  const [prevCurrency, setPrevCurrency] = useState(null);

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

  // Add effect to reload data when date range changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchSummary();
      fetchDetails();
    }
  }, [dateRange.startDate, dateRange.endDate]);

  // Add effect to reload data when currency changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchSummary();
      fetchDetails();
      fetchFiles();
    }
  }, [currency]);

  // Setup system preference listener for theme changes
  useEffect(() => {
    const cleanup = setupSystemPreferenceListener();
    return cleanup;
  }, []);

  const fetchUserProfile = async () => {
    const profile = await api.get("/auth/profile");

    if (!profile.error) {
      setUserData(profile);
    }
  };

  const fetchSummary = async () => {
    setSummaryLoading(true); // Start loading
    try {
      // Format dates for API using our utility function
      const startDateStr = toDateOnlyISOString(dateRange.startDate);
      const endDateStr = toDateOnlyISOString(dateRange.endDate);
      
      // Use URL parameters for GET request
      const params = new URLSearchParams();
      params.append('start_date', startDateStr);
      params.append('end_date', endDateStr);
      params.append('currency', currency);
      
      const url = `/budget/summary?${params.toString()}`;
      
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
    } finally {
      setSummaryLoading(false); // End loading
    }
  };

  const fetchDetails = async () => {
    setEntriesLoading(true); // Start loading
    try {
      // Format dates for API using our utility function
      const startDateStr = toDateOnlyISOString(dateRange.startDate);
      const endDateStr = toDateOnlyISOString(dateRange.endDate);
      
      // Use URL parameters for GET request
      const params = new URLSearchParams();
      params.append('start_date', startDateStr);
      params.append('end_date', endDateStr);
      params.append('limit', pagination.limit);
      params.append('offset', pagination.offset);
      params.append('currency', currency);
      
      const url = `/budget/details?${params.toString()}`;
      
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
    } finally {
      setEntriesLoading(false); // End loading
    }
  };

  const fetchFiles = async () => {
    setFilesLoading(true);
    setFilesError(null);

    try {
      // Use URL parameters for GET request
      const params = new URLSearchParams();

      params.append('limit', pagination.limit);
      params.append('offset', pagination.offset);
      params.append('currency', currency);

      const url = `/budget/files?${params.toString()}`;

      const response = await api.get(url);

      if (!response.error) {
        setFiles(response.data || []);
        setPagination({
          ...pagination,
          total: response.metadata?.total_count || 0
        });
      } else {
        setFilesError(response.error);
        setFiles([]);
      }
    } catch (err) {
      setFilesError("Failed to load files. Please try again.");
      console.error("Error fetching files:", err);
    } finally {
      setFilesLoading(false);
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

  // Handle successful import - refresh data and switch to entries tab
  const handleImportSuccess = (result) => {
    // Refresh data
    fetchSummary();
    fetchDetails();
    fetchFiles();

    // Switch to entries tab to show the imported transactions
    setActiveTab("entries");
  };

  // Handle date range change from filter component
  const handleDateRangeChange = (newRange) => {
    setDateRange(newRange);
    // Reset pagination when changing date range
    setPagination({ ...pagination, offset: 0 });
  };

  // Handle currency change with notification
  const handleCurrencyChange = (newCurrency) => {
    setPrevCurrency(currency);
    setCurrency(newCurrency);
    setShowCurrencyNotification(true);
  };

  const handlePaginationChange = (newPagination) => {
    setPagination(newPagination);
    // Files will be fetched by useEffect when pagination changes
  };

  const balance = summary.income - summary.outcome;

  // Get formatted date range for display
  let dateRangeFormatted;
  if (dateRange.preset === 'current-month') {
    dateRangeFormatted = format(new Date(), 'MMMM yyyy');
  } else if (dateRange.preset === 'custom') {
    dateRangeFormatted = `${format(dateRange.startDate, 'MMM dd')} - ${format(dateRange.endDate, 'MMM dd, yyyy')}`;
  } else {
    dateRangeFormatted = `${format(dateRange.startDate, 'MMMM yyyy')}`;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {showAuthModal === true && (
        <AuthModal
          onAuthenticated={handleAuthentication}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      <div className="max-w-5xl mx-auto px-3 py-4 md:px-6 md:py-12">
        {/* Header */}
        <header className="mb-6 md:mb-10">
          <div className="flex flex-row items-center justify-between gap-2 flex-wrap">
            <div>
              <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-foreground">
                Budget Overview
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {dateRangeFormatted}
                </p>
                {isAuthenticated && (
                  <>
                    <DateRangeFilter
                      dateRange={dateRange}
                      onDateRangeChange={handleDateRangeChange}
                      isLoading={summaryLoading || entriesLoading}
                    />
                    <CurrencyFilter
                      selectedCurrency={currency}
                      onCurrencyChange={handleCurrencyChange}
                      isLoading={summaryLoading || entriesLoading}
                    />
                  </>
                )}
                
                {/* Loading indicator animation */}
                {(summaryLoading || entriesLoading) && (
                  <span className="flex items-center ml-1 animate-pulse">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                )}
              </div>
            </div>

            {isAuthenticated && userData && (
              <div
                className="flex items-center gap-2 cursor-pointer bg-card hover:bg-accent rounded-lg px-3 py-1.5 transition-colors shadow-sm border border-border"
                onClick={() => setShowProfileModal(true)}
              >
                <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded-full p-1">
                  <UserIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-card-foreground truncate max-w-[120px] sm:max-w-full">
                  {userData.name} {userData.last_name}
                </span>
                {(!userData.national_id || userData.national_id === "") && (
                  <div className="flex items-center" title="Missing CUIT - required for transaction filtering">
                    <AlertTriangleIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500" />
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* Balance Card */}
          <Card className={`border-border bg-card backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow ${summaryLoading ? 'relative overflow-hidden' : ''}`}>
            <CardContent className="p-6">
              {summaryLoading && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/10 to-transparent animate-shimmer"></div>
              )}
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Current Balance
                  </p>
                  <p className={`text-2xl font-semibold mt-2 ${balance >= 0 
                    ? "text-emerald-600 dark:text-emerald-400" 
                    : "text-red-500 dark:text-red-400"}`}>
                    {currency === "EUR" ? "€" : "$"}
                    {Math.abs(balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${balance >= 0 
                  ? "bg-emerald-50 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400" 
                  : "bg-red-50 dark:bg-red-900/70 text-red-500 dark:text-red-400"}`}>
                  <WalletIcon className="h-6 w-6" />
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  {balance >= 0 ? "You're in good standing" : "Your expenses exceed income"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Income Card */}
          <Card className={`border-border bg-card backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow ${summaryLoading ? 'relative overflow-hidden' : ''}`}>
            <CardContent className="p-6">
              {summaryLoading && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/10 to-transparent animate-shimmer"></div>
              )}
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Income
                  </p>
                  <p className="text-2xl font-semibold mt-2 text-emerald-600 dark:text-emerald-400">
                    {currency === "EUR" ? "€" : "$"}
                    {summary.income.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-emerald-50 dark:bg-emerald-900/70 text-emerald-600 dark:text-emerald-400">
                  <TrendingUpIcon className="h-6 w-6" />
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Total income for {dateRangeFormatted}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Expenses Card */}
          <Card className={`border-border bg-card backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow ${summaryLoading ? 'relative overflow-hidden' : ''}`}>
            <CardContent className="p-6">
              {summaryLoading && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/10 to-transparent animate-shimmer"></div>
              )}
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Expenses
                  </p>
                  <p className="text-2xl font-semibold mt-2 text-red-500 dark:text-red-400">
                    {currency === "EUR" ? "€" : "$"}
                    {summary.outcome.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-red-50 dark:bg-red-900/70 text-red-500 dark:text-red-400">
                  <TrendingDownIcon className="h-6 w-6" />
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Total expenses for {dateRangeFormatted}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex justify-center w-full">
            <TabsList className="flex bg-card p-1.5 gap-x-1.5 rounded-xl shadow-sm border border-border overflow-x-auto max-w-full w-full sm:w-auto">
              <TabsTrigger
                value="dashboard"
                className="flex-1 sm:flex-none text-muted-foreground data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-emerald-50/70 dark:data-[state=active]:bg-emerald-900/30 data-[state=active]:shadow-sm rounded-lg px-0 sm:px-4 whitespace-nowrap flex items-center justify-center"
              >
                <LayoutDashboardIcon className="h-4 w-4" />
                <span className="hidden sm:inline-block ml-2">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger
                value="entries"
                className="flex-1 sm:flex-none text-muted-foreground data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-emerald-50/70 dark:data-[state=active]:bg-emerald-900/30 data-[state=active]:shadow-sm rounded-lg px-0 sm:px-4 whitespace-nowrap flex items-center justify-center"
              >
                <BarChartIcon className="h-4 w-4" />
                <span className="hidden sm:inline-block ml-2">Activity</span>
              </TabsTrigger>
              <TabsTrigger
                value="new"
                className="flex-1 sm:flex-none text-muted-foreground data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-emerald-50/70 dark:data-[state=active]:bg-emerald-900/30 data-[state=active]:shadow-sm rounded-lg px-0 sm:px-4 whitespace-nowrap flex items-center justify-center"
              >
                <PlusCircleIcon className="h-4 w-4" />
                <span className="hidden sm:inline-block ml-2">Add Transaction</span>
              </TabsTrigger>
              <TabsTrigger
                value="import"
                className="flex-1 sm:flex-none text-muted-foreground data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-emerald-50/70 dark:data-[state=active]:bg-emerald-900/30 data-[state=active]:shadow-sm rounded-lg px-0 sm:px-4 whitespace-nowrap flex items-center justify-center"
              >
                <UploadIcon className="h-4 w-4" />
                <span className="hidden sm:inline-block ml-2">Import Statements</span>
              </TabsTrigger>
              <TabsTrigger
                value="files"
                className="flex-1 sm:flex-none text-muted-foreground data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-emerald-50/70 dark:data-[state=active]:bg-emerald-900/30 data-[state=active]:shadow-sm rounded-lg px-0 sm:px-4 whitespace-nowrap flex items-center justify-center"
              >
                <FolderIcon className="h-4 w-4" />
                <span className="hidden sm:inline-block ml-2">Bank Statements</span>
              </TabsTrigger>
            </TabsList>
          </div>


          {/* Dashboard Tab Content */}
          <TabsContent value="dashboard" className="space-y-4 mt-6 focus-visible:outline-none">
            <Dashboard 
              isAuthenticated={isAuthenticated}
              onSignInClick={() => setShowAuthModal(true)}
              summary={summary}
              entries={entries}
              dateRange={dateRange}
              dateRangeFormatted={dateRangeFormatted}
              currency={currency}
              isLoading={summaryLoading || entriesLoading}
              onTransactionDeleted={() => {
                fetchSummary();
                fetchDetails();
              }}
            />
          </TabsContent>

          {/* Transactions List */}
          <TabsContent value="entries" className="space-y-4 mt-6 focus-visible:outline-none">
            <ActivityList
              isAuthenticated={isAuthenticated}
              entries={entries}
              dateRange={dateRange}
              dateRangeFormatted={dateRangeFormatted}
              currency={currency} // Pass currency to ActivityList
              onSignInClick={() => setShowAuthModal(true)}
              onTransactionDeleted={() => {
                fetchSummary();
                fetchDetails();
              }}
              isLoading={entriesLoading}
            />
          </TabsContent>

          {/* Add New Transaction */}
          <TabsContent value="new" className="mt-6 focus-visible:outline-none">
            <AddTransaction
              isAuthenticated={isAuthenticated}
              defaultCurrency={currency} // Pass currency as defaultCurrency
              onSignInClick={() => setShowAuthModal(true)}
              onTransactionAdded={() => {
                fetchSummary();
                fetchDetails();
              }}
            />
          </TabsContent>

          {/* Import Transactions */}
          <TabsContent value="import" className="mt-6 focus-visible:outline-none">
            <ImportFile
              isAuthenticated={isAuthenticated}
              onSignInClick={() => setShowAuthModal(true)}
              onImportComplete={() => {
                fetchSummary();
                fetchDetails();
              }}
              onImportSuccess={handleImportSuccess}
              className="max-w-2xl mx-auto"
              currency={currency} // Pass currency to ImportFile
            />
          </TabsContent>

          {/* Files List */}
          <TabsContent value="files" className="mt-6 focus-visible:outline-none">
            <FilesList
              isAuthenticated={isAuthenticated}
              onSignInClick={() => setShowAuthModal(true)}
              onFileDeleted={() => {
                fetchSummary();
                fetchDetails();
                fetchFiles();
              }}
              files={files}
              loading={filesLoading}
              error={filesError}
              pagination={pagination}
              onPaginationChange={handlePaginationChange}
              currency={currency} // Pass currency to FilesList
            />
          </TabsContent>
        </Tabs>

        {/* Profile Update Dialog */}
        <ProfileDialog
          open={showProfileModal}
          onOpenChange={setShowProfileModal}
          userData={userData}
          onProfileUpdated={fetchUserProfile}
          onLogout={handleLogout}
        />
        
        {/* Currency change notification */}
        <CurrencyNotification 
          currency={currency}
          isVisible={showCurrencyNotification}
          onClose={() => setShowCurrencyNotification(false)}
        />
      </div>
    </div>
  );
}