"use client"

import ProfileDialog from "@/components/auth_user/ProfileDialog"
import CurrencyFilter from "@/components/filters/CurrencyFilter"
import DateRangeFilter from "@/components/filters/DateRangeFilter"
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
import { endOfMonth, format, parseISO, startOfMonth } from 'date-fns'
import {
  AlertTriangleIcon,
  BarChartIcon,
  FolderIcon,
  LayoutDashboardIcon,
  PlusCircleIcon,
  UploadIcon,
  UserIcon
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"

export default function MainApp({ onLogout }) {
  // React Router hooks for URL management
  const params = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Ref for scrolling to tabs section
  const tabsRef = useRef(null)

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

  // Helper function to get date range from URL or default
  const getInitialDateRange = () => {
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const preset = searchParams.get('preset')
    
    if (startDate && endDate) {
      return {
        startDate: parseISO(startDate),
        endDate: parseISO(endDate),
        preset: preset || 'custom'
      }
    }
    
    return {
      startDate: startOfMonth(new Date()),
      endDate: endOfMonth(new Date()),
      preset: 'current-month'
    }
  }

  // New date filter state with URL initialization
  const [dateRange, setDateRange] = useState(getInitialDateRange());

  // New currency state with URL initialization
  const [currency, setCurrency] = useState(params.currency || searchParams.get('currency') || "ALL");

  // Add state for multi-currency summary
  const [currencySummary, setCurrencySummary] = useState({ currencies: [] });

  // Add state for files loading and error
  const [filesLoading, setFilesLoading] = useState(false);
  const [filesError, setFilesError] = useState(null);

  // Add loading states for different data fetches
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [entriesLoading, setEntriesLoading] = useState(false);

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

  // Helper function to update URL with current filters
  const updateURLWithFilters = (newDateRange = dateRange, newCurrency = currency, newTab = activeTab) => {
    const params = new URLSearchParams()
    
    // Add date range to URL
    if (newDateRange.preset !== 'current-month') {
      params.set('startDate', toDateOnlyISOString(newDateRange.startDate))
      params.set('endDate', toDateOnlyISOString(newDateRange.endDate))
      params.set('preset', newDateRange.preset)
    }
    
    // Add currency to URL
    if (newCurrency !== 'ALL') {
      params.set('currency', newCurrency)
    }
    
    // Construct the path
    let path = '/dashboard'
    if (newTab !== 'dashboard') {
      path += `/${newTab}`
    }
    
    // Update the URL
    const newURL = params.toString() ? `${path}?${params.toString()}` : path
    navigate(newURL, { replace: true })
  }

  // Initialize state from URL parameters on mount
  useEffect(() => {
    const tabFromURL = params.tab || 'dashboard'
    setActiveTab(tabFromURL)
    
    // Update currency from URL params
    const currencyFromURL = params.currency || searchParams.get('currency') || 'ALL'
    if (currencyFromURL !== currency) {
      setCurrency(currencyFromURL)
    }
    
    // Update date range from URL params
    const urlDateRange = getInitialDateRange()
    if (urlDateRange.startDate.getTime() !== dateRange.startDate.getTime() || 
        urlDateRange.endDate.getTime() !== dateRange.endDate.getTime()) {
      setDateRange(urlDateRange)
    }
  }, [params.tab, params.currency, searchParams])

  const handleDateRangeChange = (newRange) => {
    setDateRange(newRange);
    setPagination({ ...pagination, offset: 0 });
    updateURLWithFilters(newRange, currency, activeTab);
  };

  const handleCurrencyChange = (newCurrency) => {
    setCurrency(newCurrency);
    updateURLWithFilters(dateRange, newCurrency, activeTab);
  };

  const handleCurrencySelect = (selectedCurrency) => {
    handleCurrencyChange(selectedCurrency);
    setActiveTab("dashboard");
    updateURLWithFilters(dateRange, selectedCurrency, "dashboard");
    
    // Scroll to tabs section after currency selection
    setTimeout(() => {
      if (tabsRef.current) {
        tabsRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100); // Small delay to ensure state updates have completed
  };

  const handleCurrencyImport = (selectedCurrency) => {
    handleCurrencyChange(selectedCurrency);
    setActiveTab("import");
    updateURLWithFilters(dateRange, selectedCurrency, "import");
    
    // Scroll to tabs section after currency selection
    setTimeout(() => {
      if (tabsRef.current) {
        tabsRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100); // Small delay to ensure state updates have completed
  };

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    updateURLWithFilters(dateRange, currency, newTab);
  };

  const handlePaginationChange = (newPagination) => {
    setPagination(newPagination);
  };

  // Get formatted date range for display
  let dateRangeFormatted;
  if (dateRange.preset === 'current-month') {
    dateRangeFormatted = format(new Date(), 'MMMM yyyy');
  } else if (dateRange.preset === 'custom') {
    // For custom ranges, show start and end dates
    const startYear = dateRange.startDate.getFullYear();
    const endYear = dateRange.endDate.getFullYear();
    const startMonth = dateRange.startDate.getMonth();
    const endMonth = dateRange.endDate.getMonth();
    
    if (startYear === endYear && startMonth === endMonth) {
      // Same month and year - show just the month and year
      dateRangeFormatted = format(dateRange.startDate, 'MMMM yyyy');
    } else if (startYear === endYear) {
      // Same year, different months - show "Jan 15 - Mar 20, 2025"
      dateRangeFormatted = `${format(dateRange.startDate, 'MMM dd')} - ${format(dateRange.endDate, 'MMM dd, yyyy')}`;
    } else {
      // Different years - show "Dec 15, 2024 - Jan 20, 2025"
      dateRangeFormatted = `${format(dateRange.startDate, 'MMM dd, yyyy')} - ${format(dateRange.endDate, 'MMM dd, yyyy')}`;
    }
  } else {
    // For preset ranges like "last-3-months", show the range nicely
    const startYear = dateRange.startDate.getFullYear();
    const endYear = dateRange.endDate.getFullYear();
    const startMonth = dateRange.startDate.getMonth();
    const endMonth = dateRange.endDate.getMonth();
    
    if (startYear === endYear && startMonth === endMonth) {
      // Same month and year
      dateRangeFormatted = format(dateRange.startDate, 'MMMM yyyy');
    } else if (startYear === endYear) {
      // Same year, different months - show "January - March 2025"
      dateRangeFormatted = `${format(dateRange.startDate, 'MMMM')} - ${format(dateRange.endDate, 'MMMM yyyy')}`;
    } else {
      // Different years - show "December 2024 - January 2025"
      dateRangeFormatted = `${format(dateRange.startDate, 'MMMM yyyy')} - ${format(dateRange.endDate, 'MMMM yyyy')}`;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--background))] via-[hsl(var(--background))] to-[hsl(var(--muted))]">
      <div className="max-w-7xl mx-auto px-3 py-4 md:px-6 md:py-12">
        {/* Header */}
        <header className="mb-6 md:mb-10">
          {/* Controls Row */}
          <div className="flex items-center justify-between gap-4 mb-8">
            {/* Left side - Filters and Loading */}
            <div className="flex items-center gap-3">
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
                <div className="flex items-center">
                  <svg className="animate-spin h-4 w-4 text-[hsl(var(--accent))]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
            </div>

            {/* Right side - Profile */}
            {userData && (
              <div
                className="flex items-center gap-2 cursor-pointer bg-background hover:bg-muted/50 rounded-lg px-3 py-2 transition-all duration-200 border border-border/60 hover:border-border shadow-sm"
                onClick={() => setShowProfileModal(true)}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[hsl(var(--accent))] to-[hsl(var(--chart-3))] flex items-center justify-center">
                  <UserIcon className="h-3.5 w-3.5 text-[hsl(var(--background))]" />
                </div>
                <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                  {userData.name} {userData.last_name}
                </span>
                {(!userData.national_id || userData.national_id === "") && (
                  <AlertTriangleIcon className="h-4 w-4 text-[hsl(var(--warning-fg))]" title="Missing CUIT - required for transaction filtering" />
                )}
              </div>
            )}
          </div>
          
          {/* Centered Date Title */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-[hsl(var(--accent))/0.1] to-[hsl(var(--chart-3))/0.1] rounded-2xl border border-[hsl(var(--accent))/0.2] backdrop-blur-sm">
              <div className="w-2 h-2 bg-[hsl(var(--accent))] rounded-full animate-pulse"></div>
              <h2 className="text-lg md:text-xl font-semibold bg-gradient-to-r from-[hsl(var(--accent))] to-[hsl(var(--chart-3))] bg-clip-text text-transparent">
                {dateRangeFormatted}
              </h2>
              <div className="w-2 h-2 bg-[hsl(var(--chart-3))] rounded-full animate-pulse"></div>
            </div>
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
            onCurrencyImport={handleCurrencyImport}
          />
        )}

        {/* Main Content - only show for specific currencies, not for ALL */}
        {currency !== "ALL" && (
          <Tabs ref={tabsRef} value={activeTab} onValueChange={handleTabChange} className="space-y-8">
            <div className="flex justify-center w-full">
              <TabsList className="flex bg-[hsl(var(--card))] p-1.5 gap-x-1.5 rounded-xl shadow-sm border border-[hsl(var(--border))] overflow-x-auto max-w-full w-full sm:w-auto">
                <TabsTrigger
                  value="dashboard"
                  className="flex-1 sm:flex-none text-[hsl(var(--muted-foreground))] rounded-lg px-0 sm:px-4 whitespace-nowrap flex items-center justify-center"
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
                  className="flex-1 sm:flex-none text-[hsl(var(--muted-foreground))] rounded-lg px-0 sm:px-4 whitespace-nowrap flex items-center justify-center"
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
                  className="flex-1 sm:flex-none text-[hsl(var(--muted-foreground))] rounded-lg px-0 sm:px-4 whitespace-nowrap flex items-center justify-center"
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
                  className="flex-1 sm:flex-none text-[hsl(var(--muted-foreground))] rounded-lg px-0 sm:px-4 whitespace-nowrap flex items-center justify-center"
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
                  className="flex-1 sm:flex-none text-[hsl(var(--muted-foreground))] rounded-lg px-0 sm:px-4 whitespace-nowrap flex items-center justify-center"
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
      </div>
    </div>
  );
}
