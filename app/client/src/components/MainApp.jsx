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
import { setupSystemPreferenceListener } from "@/lib/themeUtils"
import { api } from "@/services/api"
import { useDashboardData } from "@/hooks/useDashboardData"
import { DashboardProvider } from "@/contexts/DashboardContext"
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
  const params = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const tabsRef = useRef(null)
  const [showProfileModal, setShowProfileModal] = useState(false);

  const {
    summary,
    entries,
    files,
    userData,
    currencySummary,
    categories,
    currency,
    dateRange,
    activeTab,
    pagination,
    filesPagination,
    summaryLoading,
    entriesLoading,
    filesLoading,
    filesError,
    fetchSummary,
    fetchDetails,
    fetchFiles,
    fetchUserProfile,
    handleCurrencyChange,
    handleDateRangeChange,
    handleCurrencySelect: hookHandleCurrencySelect,
    handleCurrencyImport: hookHandleCurrencyImport,
    handleTabChange,
    handlePaginationChange,
    handleFilesPaginationChange,
    handleImportSuccess,
    dateRangeFormatted,
  } = useDashboardData({ params, searchParams, navigate })

  useEffect(() => {
    const cleanup = setupSystemPreferenceListener();
    return cleanup;
  }, []);

  const handleLogout = () => {
    api.logout();
    onLogout();
  };

  const handleCurrencySelect = (selectedCurrency) => {
    hookHandleCurrencySelect(selectedCurrency);
    setTimeout(() => {
      if (tabsRef.current) {
        tabsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleCurrencyImport = (selectedCurrency) => {
    hookHandleCurrencyImport(selectedCurrency);
    setTimeout(() => {
      if (tabsRef.current) {
        tabsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  return (
    <DashboardProvider
      currency={currency}
      dateRange={dateRange}
      handleCurrencyChange={handleCurrencyChange}
      handleDateRangeChange={handleDateRangeChange}
    >
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--background))] via-[hsl(var(--background))] to-[hsl(var(--muted))]">
      <div className="max-w-7xl mx-auto px-3 py-4 md:px-6 md:py-12">
        <header className="mb-6 md:mb-10">
          <div className="flex items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <DateRangeFilter
                isLoading={summaryLoading || entriesLoading}
              />
              <CurrencyFilter
                isLoading={summaryLoading || entriesLoading}
              />

              {(summaryLoading || entriesLoading) && (
                <div className="flex items-center">
                  <svg className="animate-spin h-4 w-4 text-[hsl(var(--accent))]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
            </div>

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

        {currency !== "ALL" && (
          <SummaryCards
            summary={summary}
            dateRangeFormatted={dateRangeFormatted}
            isLoading={summaryLoading}
          />
        )}

        {currency === "ALL" && (
          <CurrencyOverview
            currencySummary={currencySummary}
            dateRangeFormatted={dateRangeFormatted}
            isLoading={summaryLoading}
            onCurrencySelect={handleCurrencySelect}
            onCurrencyImport={handleCurrencyImport}
          />
        )}

        {currency !== "ALL" && (
          <Tabs ref={tabsRef} value={activeTab} onValueChange={handleTabChange} className="space-y-8">
            <div className="flex justify-center w-full">
              <TabsList className="flex bg-[hsl(var(--card))] p-1.5 gap-x-1.5 rounded-xl shadow-sm border border-[hsl(var(--border))] overflow-x-auto max-w-full w-full sm:w-auto">
                <TabsTrigger
                  value="dashboard"
                  className="flex-1 sm:flex-none text-[hsl(var(--muted-foreground))] rounded-lg px-0 sm:px-4 whitespace-nowrap flex items-center justify-center"
                  style={{ '--active-color': 'hsl(var(--accent))', '--active-bg': 'hsl(var(--accent) / 0.1)' }}
                  data-state={activeTab === "dashboard" ? "active" : "inactive"}
                >
                  <LayoutDashboardIcon className="h-4 w-4" />
                  <span className="hidden sm:inline-block ml-2">Dashboard</span>
                </TabsTrigger>
                <TabsTrigger
                  value="entries"
                  className="flex-1 sm:flex-none text-[hsl(var(--muted-foreground))] rounded-lg px-0 sm:px-4 whitespace-nowrap flex items-center justify-center"
                  style={{ '--active-color': 'hsl(var(--accent))', '--active-bg': 'hsl(var(--accent) / 0.1)' }}
                  data-state={activeTab === "entries" ? "active" : "inactive"}
                >
                  <BarChartIcon className="h-4 w-4" />
                  <span className="hidden sm:inline-block ml-2">Activity</span>
                </TabsTrigger>
                <TabsTrigger
                  value="new"
                  className="flex-1 sm:flex-none text-[hsl(var(--muted-foreground))] rounded-lg px-0 sm:px-4 whitespace-nowrap flex items-center justify-center"
                  style={{ '--active-color': 'hsl(var(--accent))', '--active-bg': 'hsl(var(--accent) / 0.1)' }}
                  data-state={activeTab === "new" ? "active" : "inactive"}
                >
                  <PlusCircleIcon className="h-4 w-4" />
                  <span className="hidden sm:inline-block ml-2">Add Transaction</span>
                </TabsTrigger>
                <TabsTrigger
                  value="import"
                  className="flex-1 sm:flex-none text-[hsl(var(--muted-foreground))] rounded-lg px-0 sm:px-4 whitespace-nowrap flex items-center justify-center"
                  style={{ '--active-color': 'hsl(var(--accent))', '--active-bg': 'hsl(var(--accent) / 0.1)' }}
                  data-state={activeTab === "import" ? "active" : "inactive"}
                >
                  <UploadIcon className="h-4 w-4" />
                  <span className="hidden sm:inline-block ml-2">Import Statements</span>
                </TabsTrigger>
                <TabsTrigger
                  value="files"
                  className="flex-1 sm:flex-none text-[hsl(var(--muted-foreground))] rounded-lg px-0 sm:px-4 whitespace-nowrap flex items-center justify-center"
                  style={{ '--active-color': 'hsl(var(--accent))', '--active-bg': 'hsl(var(--accent) / 0.1)' }}
                  data-state={activeTab === "files" ? "active" : "inactive"}
                >
                  <FolderIcon className="h-4 w-4" />
                  <span className="hidden sm:inline-block ml-2">Bank Statements</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="dashboard" className="mt-6 focus-visible:outline-none">
              <div className="w-full max-w-7xl mx-auto">
                <Dashboard
                  currency={currency}
                  summary={summary}
                  entries={entries}
                  totalTransactions={pagination.total}
                  isLoading={summaryLoading || entriesLoading}
                />
              </div>
            </TabsContent>

            <TabsContent value="entries" className="mt-6 focus-visible:outline-none">
              <div className="w-full max-w-7xl mx-auto">
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
                  pagination={pagination}
                  onPaginationChange={handlePaginationChange}
                />
              </div>
            </TabsContent>

            <TabsContent value="new" className="mt-6 focus-visible:outline-none">
              <div className="w-full max-w-7xl mx-auto">
                <AddTransaction
                  defaultCurrency={currency}
                  categories={categories}
                  onTransactionAdded={() => {
                    fetchSummary();
                    fetchDetails();
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="import" className="mt-6 focus-visible:outline-none">
              <div className="w-full max-w-7xl mx-auto">
                <ImportFile
                  currency={currency}
                  onImportComplete={() => {
                    fetchSummary();
                    fetchDetails();
                  }}
                  onImportSuccess={handleImportSuccess}
                />
              </div>
            </TabsContent>

            <TabsContent value="files" className="mt-6 focus-visible:outline-none">
              <div className="w-full max-w-7xl mx-auto">
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
                  pagination={filesPagination}
                  onPaginationChange={handleFilesPaginationChange}
                />
              </div>
            </TabsContent>
          </Tabs>
        )}

        <ProfileDialog
          open={showProfileModal}
          onOpenChange={setShowProfileModal}
          userData={userData}
          onProfileUpdated={fetchUserProfile}
          onLogout={handleLogout}
        />
      </div>
    </div>
    </DashboardProvider>
  );
}
