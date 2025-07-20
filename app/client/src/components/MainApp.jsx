"use client"

import ProfileDialog from "@/components/auth_user/ProfileDialog"
import CurrencyFilter from "@/components/filters/CurrencyFilter"
import DateRangeFilter from "@/components/filters/DateRangeFilter"
import CurrencyNotification from "@/components/notifications/CurrencyNotification"
import CurrencyOverview from "@/components/summary/CurrencyOverview"
import SummaryCards from "@/components/summary/SummaryCards"
import ActivityList from "@/components/tabs/ActivityList"
import AddTransaction from "@/components/tabs/AddTransaction"
import Dashboard from "@/components/tabs/Dashboard"
import FilesList from "@/components/tabs/FilesList"
import ImportFile from "@/components/tabs/ImportFile"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toDateOnlyISOString } from "@/lib/dateUtils"
import { setupSystemPreferenceListener } from "@/lib/themeUtils"
import { api } from "@/services/api"
import { endOfMonth, format, startOfMonth } from 'date-fns'
import {
    AlertTriangleIcon,
    BarChartIcon,
    FolderIcon,
    LayoutDashboardIcon,
    PlusCircleIcon,
    UploadIcon,
    UserIcon
} from "lucide-react"
import { useEffect, useState } from "react"

export default function MainApp({ onLogout }) {
  // Application state variables
  const [summary, setSummary] = useState({ income: 0, outcome: 0, categories: [] })
  const [entries, setEntries] = useState([])
  const [files, setFiles] = useState([])
  const [userData, setUserData] = useState(null)
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    total: 0
  });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  // New date filter state
  const [dateRange, setDateRange] = useState({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
    preset: 'current-month'
  });

  // New currency state
  const [currency, setCurrency] = useState("ALL");

  // Add state for multi-currency summary
  const [currencySummary, setCurrencySummary] = useState({ currencies: [] });

  // Add state for files loading and error
  const [filesLoading, setFilesLoading] = useState(false);
  const [filesError, setFilesError] = useState(null);

  // Add loading states for different data fetches
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [entriesLoading, setEntriesLoading] = useState(false);

  // New state for currency notification
  const [showCurrencyNotification, setShowCurrencyNotification] = useState(false);
  const [prevCurrency, setPrevCurrency] = useState(null);

  // Load user data and initial data on component mount
  useEffect(() => {
    fetchUserProfile();
    fetchSummary();
    fetchDetails();
    fetchFiles();
  }, []);

  // Add effect to reload data when date range changes
  useEffect(() => {
    fetchSummary();
    fetchDetails();
  }, [dateRange.startDate, dateRange.endDate]);

  // Add effect to reload data when currency changes
  useEffect(() => {
    fetchSummary();
    fetchDetails();
    fetchFiles();
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
    setSummaryLoading(true);
    try {
      if (currency === "ALL") {
        await fetchCurrencySummary();
        setSummary({ income: 0, outcome: 0, categories: [] });
      } else {
        const startDateStr = toDateOnlyISOString(dateRange.startDate);
        const endDateStr = toDateOnlyISOString(dateRange.endDate);
        
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
      }
    } catch (error) {
      console.error("Failed to fetch summary:", error);
      setSummary({ income: 0, outcome: 0, categories: [] });
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchCurrencySummary = async () => {
    try {
      const startDateStr = toDateOnlyISOString(dateRange.startDate);
      const endDateStr = toDateOnlyISOString(dateRange.endDate);
      
      const params = new URLSearchParams();
      params.append('start_date', startDateStr);
      params.append('end_date', endDateStr);
      
      const url = `/budget/summary-by-currency?${params.toString()}`;
      const data = await api.get(url);
      
      if (!data.error) {
        setCurrencySummary(data);
      } else {
        console.error("Error fetching currency summary:", data.error);
        setCurrencySummary({ currencies: [] });
      }
    } catch (error) {
      console.error("Failed to fetch currency summary:", error);
      setCurrencySummary({ currencies: [] });
    }
  };

  const fetchDetails = async () => {
    if (currency === "ALL") {
      setEntries([]);
      return;
    }

    setEntriesLoading(true);
    try {
      const startDateStr = toDateOnlyISOString(dateRange.startDate);
      const endDateStr = toDateOnlyISOString(dateRange.endDate);
      
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
      setEntriesLoading(false);
    }
  };

  const fetchFiles = async () => {
    if (currency === "ALL") {
      setFiles([]);
      return;
    }

    setFilesLoading(true);
    setFilesError(null);

    try {
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
    // Clear local state
    setUserData(null);
    setSummary({ income: 0, outcome: 0, categories: [] });
    setEntries([]);
    setFiles([]);
    // Call parent logout handler to return to landing page
    onLogout();
  };

  const handleImportSuccess = (result) => {
    fetchSummary();
    fetchDetails();
    fetchFiles();
    setActiveTab("dashboard");
  };

  const handleDateRangeChange = (newRange) => {
    setDateRange(newRange);
    setPagination({ ...pagination, offset: 0 });
  };

  const handleCurrencyChange = (newCurrency) => {
    setPrevCurrency(currency);
    setCurrency(newCurrency);
    setShowCurrencyNotification(true);
  };

  const handleCurrencySelect = (selectedCurrency) => {
    handleCurrencyChange(selectedCurrency);
    setActiveTab("dashboard");
  };

  const handlePaginationChange = (newPagination) => {
    setPagination(newPagination);
  };

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
      <div className="max-w-7xl mx-auto px-3 py-4 md:px-6 md:py-12">
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

            {userData && (
              <div
                className="flex items-center gap-2 cursor-pointer bg-card hover:bg-accent rounded-lg px-3 py-1.5 transition-colors shadow-sm border border-border"
                onClick={() => setShowProfileModal(true)}
              >
                <div
                  className="rounded-full p-1"
                  style={{
                    backgroundColor: "hsl(var(--success-bg))",
                    color: "hsl(var(--success-fg))"
                  }}
                >
                  <UserIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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

        {/* Summary Cards - only show for specific currencies, not for ALL */}
        {currency !== "ALL" && (
          <SummaryCards
            summary={summary}
            currency={currency}
            dateRangeFormatted={dateRangeFormatted}
            isLoading={summaryLoading}
          />
        )}

        {/* Currency Overview - only show when ALL is selected */}
        {currency === "ALL" && (
          <CurrencyOverview
            currencySummary={currencySummary}
            dateRangeFormatted={dateRangeFormatted}
            isLoading={summaryLoading}
            onCurrencySelect={handleCurrencySelect}
          />
        )}

        {/* Main Content - only show for specific currencies, not for ALL */}
        {currency !== "ALL" && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <div className="flex justify-center w-full">
              <TabsList className="flex bg-card p-1.5 gap-x-1.5 rounded-xl shadow-sm border border-border overflow-x-auto max-w-full w-full sm:w-auto">
                <TabsTrigger
                  value="dashboard"
                  className="flex-1 sm:flex-none text-muted-foreground rounded-lg px-0 sm:px-4 whitespace-nowrap flex items-center justify-center"
                  style={{
                    '--active-color': 'hsl(var(--accent))',
                    '--active-bg': 'hsl(var(--accent) / 0.1)'
                  }}
                  data-state={activeTab === "dashboard" ? "active" : "inactive"}
                >
                  <LayoutDashboardIcon className="h-4 w-4" />
                  <span className="hidden sm:inline-block ml-2">Dashboard</span>
                </TabsTrigger>
                <TabsTrigger
                  value="entries"
                  className="flex-1 sm:flex-none text-muted-foreground rounded-lg px-0 sm:px-4 whitespace-nowrap flex items-center justify-center"
                  style={{
                    '--active-color': 'hsl(var(--accent))',
                    '--active-bg': 'hsl(var(--accent) / 0.1)'
                  }}
                  data-state={activeTab === "entries" ? "active" : "inactive"}
                >
                  <BarChartIcon className="h-4 w-4" />
                  <span className="hidden sm:inline-block ml-2">Activity</span>
                </TabsTrigger>
                <TabsTrigger
                  value="new"
                  className="flex-1 sm:flex-none text-muted-foreground rounded-lg px-0 sm:px-4 whitespace-nowrap flex items-center justify-center"
                  style={{
                    '--active-color': 'hsl(var(--accent))',
                    '--active-bg': 'hsl(var(--accent) / 0.1)'
                  }}
                  data-state={activeTab === "new" ? "active" : "inactive"}
                >
                  <PlusCircleIcon className="h-4 w-4" />
                  <span className="hidden sm:inline-block ml-2">Add Transaction</span>
                </TabsTrigger>
                <TabsTrigger
                  value="import"
                  className="flex-1 sm:flex-none text-muted-foreground rounded-lg px-0 sm:px-4 whitespace-nowrap flex items-center justify-center"
                  style={{
                    '--active-color': 'hsl(var(--accent))',
                    '--active-bg': 'hsl(var(--accent) / 0.1)'
                  }}
                  data-state={activeTab === "import" ? "active" : "inactive"}
                >
                  <UploadIcon className="h-4 w-4" />
                  <span className="hidden sm:inline-block ml-2">Import Statements</span>
                </TabsTrigger>
                <TabsTrigger
                  value="files"
                  className="flex-1 sm:flex-none text-muted-foreground rounded-lg px-0 sm:px-4 whitespace-nowrap flex items-center justify-center"
                  style={{
                    '--active-color': 'hsl(var(--accent))',
                    '--active-bg': 'hsl(var(--accent) / 0.1)'
                  }}
                  data-state={activeTab === "files" ? "active" : "inactive"}
                >
                  <FolderIcon className="h-4 w-4" />
                  <span className="hidden sm:inline-block ml-2">Bank Statements</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Dashboard Tab Content */}
            <TabsContent value="dashboard" className="space-y-4 mt-6 focus-visible:outline-none">
              <Dashboard
                currency={currency}
                summary={summary}
                entries={entries}
                isLoading={summaryLoading || entriesLoading}
              />
            </TabsContent>

            {/* Transactions List */}
            <TabsContent value="entries" className="space-y-4 mt-6 focus-visible:outline-none">
              <ActivityList
                currency={currency}
                entries={entries}
                dateRangeFormatted={dateRangeFormatted}
                dateRange={dateRange}
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
                defaultCurrency={currency}
                onTransactionAdded={() => {
                  fetchSummary();
                  fetchDetails();
                }}
              />
            </TabsContent>

            {/* Import Transactions */}
            <TabsContent value="import" className="mt-6 focus-visible:outline-none">
              <ImportFile
                currency={currency}
                onImportComplete={() => {
                  fetchSummary();
                  fetchDetails();
                }}
                onImportSuccess={handleImportSuccess}
                className="max-w-2xl mx-auto"
              />
            </TabsContent>

            {/* Files List */}
            <TabsContent value="files" className="mt-6 focus-visible:outline-none">
              <FilesList
                currency={currency}
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
              />
            </TabsContent>
          </Tabs>
        )}

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
