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
import { DashboardProvider } from "@/contexts/DashboardContext"
import { useDashboardData } from "@/hooks/useDashboardData"
import { setupSystemPreferenceListener } from "@/lib/themeUtils"
import { api } from "@/services/api"
import {
  AlertTriangleIcon,
  BarChartIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleDollarSignIcon,
  DollarSignIcon,
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
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

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
    <div className="flex min-h-screen bg-gradient-to-br from-[hsl(var(--background))] via-[hsl(var(--background))] to-[hsl(var(--muted))]">

      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-col shrink-0 sticky top-0 h-screen border-r border-[hsl(var(--border))] bg-[var(--glass-bg-heavy)] backdrop-blur-2xl py-6 gap-4 transition-all duration-200 ${sidebarCollapsed ? 'w-14 px-2' : 'w-56 px-4'}`}>
        {/* Brand */}
        <div className={`flex items-center pb-4 border-b border-[hsl(var(--border))] ${sidebarCollapsed ? 'flex-col gap-2' : 'gap-2'}`}>
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[hsl(var(--accent)/0.2)] to-[hsl(var(--accent)/0.1)] flex items-center justify-center shrink-0">
            <DollarSignIcon className="h-4 w-4 text-[hsl(var(--accent))]" />
          </div>
          {!sidebarCollapsed && (
            <>
              <span className="font-bold text-sm tracking-wider text-[hsl(var(--foreground))]">MYNAB</span>
              {(summaryLoading || entriesLoading) && (
                <svg className="animate-spin h-3.5 w-3.5 text-[hsl(var(--accent))]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
            </>
          )}
          <button
            onClick={() => setSidebarCollapsed(v => !v)}
            className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] ml-auto shrink-0"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed
              ? <ChevronRightIcon className="h-4 w-4" />
              : <ChevronLeftIcon className="h-4 w-4" />
            }
          </button>
        </div>

        {/* Filters */}
        {sidebarCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              title="Date range"
            >
              <CalendarIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              title="Currency"
            >
              <CircleDollarSignIcon className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 w-full">
            <CurrencyFilter isLoading={summaryLoading || entriesLoading} />
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* User */}
        {userData && (
          <div className="border-t border-[hsl(var(--border))] pt-4">
            {sidebarCollapsed ? (
              <button
                onClick={() => setShowProfileModal(true)}
                className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors relative"
                title={`${userData.name} ${userData.last_name}`}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[hsl(var(--accent))] to-[hsl(var(--chart-3))] flex items-center justify-center">
                  <UserIcon className="h-3.5 w-3.5 text-[hsl(var(--background))]" />
                </div>
                {(!userData.national_id || userData.national_id === "") && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[hsl(var(--warning-fg))]" />
                )}
              </button>
            ) : (
              <button
                onClick={() => setShowProfileModal(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors text-left"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[hsl(var(--accent))] to-[hsl(var(--chart-3))] flex items-center justify-center shrink-0">
                  <UserIcon className="h-3.5 w-3.5 text-[hsl(var(--background))]" />
                </div>
                <span className="text-sm font-medium text-[hsl(var(--foreground))] truncate">
                  {userData.name} {userData.last_name}
                </span>
                {(!userData.national_id || userData.national_id === "") && (
                  <AlertTriangleIcon className="h-4 w-4 text-[hsl(var(--warning-fg))] shrink-0 ml-auto" />
                )}
              </button>
            )}
          </div>
        )}
      </aside>

      {/* Mobile floating bottom bar */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-[22px] border border-[hsl(var(--border))] bg-[hsl(var(--background)/0.82)] backdrop-blur-2xl shadow-2xl">
          {/* User avatar */}
          {userData && (
            <button
              onClick={() => setShowProfileModal(true)}
              className="relative p-1 rounded-full shrink-0"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[hsl(var(--accent))] to-[hsl(var(--chart-3))] flex items-center justify-center">
                <UserIcon className="h-4 w-4 text-[hsl(var(--background))]" />
              </div>
              {(!userData.national_id || userData.national_id === "") && (
                <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-[hsl(var(--warning-fg))] border border-[hsl(var(--background))]" />
              )}
            </button>
          )}

          {/* Divider */}
          <div className="w-px h-6 bg-[hsl(var(--border))] shrink-0" />

          {/* Filters */}
          <div className="flex items-center gap-2 flex-1 justify-center">
            
            <CurrencyFilter isLoading={summaryLoading || entriesLoading} />
          </div>

          {/* Loading indicator */}
          {(summaryLoading || entriesLoading) && (
            <>
              <div className="w-px h-6 bg-[hsl(var(--border))] shrink-0" />
              <svg className="animate-spin h-4 w-4 text-[hsl(var(--accent))] shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="px-4 py-6 pb-28 md:pb-10 md:px-8 md:py-10">
          <header className="mb-4 md:mb-6">
            <div className="text-center">
              <DateRangeFilter
                isLoading={summaryLoading || entriesLoading}
                trigger={
                  <button className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-[hsl(var(--accent))/0.1] to-[hsl(var(--chart-3))/0.1] rounded-2xl border border-[hsl(var(--accent))/0.2] backdrop-blur-sm hover:border-[hsl(var(--accent))/0.5] hover:shadow-md transition-all duration-150 cursor-pointer">
                    <h2 className="text-lg md:text-xl font-semibold bg-gradient-to-r from-[hsl(var(--accent))] to-[hsl(var(--chart-3))] bg-clip-text text-transparent">
                      {dateRangeFormatted}
                    </h2>
                    <CalendarIcon className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
                  </button>
                }
              />
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
              <TabsList className="flex p-1.5 gap-x-1.5 overflow-x-auto max-w-full w-full sm:w-auto">
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
      </div>{/* end inner padding */}
    </div>{/* end flex-1 main */}
  </div>{/* end outer flex */}
    </DashboardProvider>
  );
}
