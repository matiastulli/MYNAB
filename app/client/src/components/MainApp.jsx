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
  ChevronLeftIcon,
  ChevronRightIcon,
  DollarSignIcon,
  DownloadIcon,
  FolderIcon,
  LayoutDashboardIcon,
  PlusCircleIcon,
  UploadIcon,
  UserIcon,
  XIcon
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { usePWAInstall } from "@/hooks/usePWAInstall"

export default function MainApp({ onLogout }) {
  const params = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const tabsRef = useRef(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem('sidebarCollapsed') === 'true'
  )
  const toggleSidebar = (val) => {
    setSidebarCollapsed(val)
    localStorage.setItem('sidebarCollapsed', String(val))
  }
  const [showExitToast, setShowExitToast] = useState(false)
  const { canInstall, handleInstall, handleDismiss } = usePWAInstall()
  const exitPending = useRef(false)
  const exitTimer = useRef(null)

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

  // Declared after useDashboardData so activeTab/currency are in scope
  const activeTabRef = useRef(activeTab)
  const currencyRef = useRef(currency)

  useEffect(() => {
    const cleanup = setupSystemPreferenceListener();
    return cleanup;
  }, []);

  // Keep refs in sync so the popstate handler never has a stale closure
  useEffect(() => { activeTabRef.current = activeTab }, [activeTab])
  useEffect(() => { currencyRef.current = currency }, [currency])

  // Android/TWA hardware back button handler
  useEffect(() => {
    window.history.pushState({ mynab: true }, '')

    const handlePopState = () => {
      const isHome = currencyRef.current === 'ALL' || activeTabRef.current === 'dashboard'

      if (!isHome) {
        handleTabChange('dashboard')
        window.history.pushState({ mynab: true }, '')
        return
      }

      if (exitPending.current) {
        // Second press within window — let the app close
        clearTimeout(exitTimer.current)
        exitPending.current = false
        setShowExitToast(false)
        return
      }

      // First press on home — show toast, hold exit for 2 s
      window.history.pushState({ mynab: true }, '')
      exitPending.current = true
      setShowExitToast(true)
      exitTimer.current = setTimeout(() => {
        exitPending.current = false
        setShowExitToast(false)
      }, 2000)
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
      clearTimeout(exitTimer.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleTabChange])

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
      <aside className={`relative hidden md:flex flex-col shrink-0 sticky top-0 h-screen border-r border-[hsl(var(--border))] bg-[var(--glass-bg-heavy)] backdrop-blur-2xl py-6 gap-4 transition-all duration-200 ${sidebarCollapsed ? 'w-14 px-2' : 'w-56 px-4'}`}>
        {/* Brand */}
        <div className={`flex pb-4 border-b border-[hsl(var(--border))] ${sidebarCollapsed ? 'justify-center' : 'items-center gap-2'}`}>
          {sidebarCollapsed ? (
            <button
              onClick={() => toggleSidebar(false)}
              title="Expand sidebar"
              aria-label="Expand sidebar"
              className="group/brand relative w-7 h-7 rounded-lg bg-gradient-to-br from-[hsl(var(--accent)/0.2)] to-[hsl(var(--accent)/0.1)] flex items-center justify-center"
            >
              <DollarSignIcon className="h-4 w-4 text-[hsl(var(--accent))] transition-opacity duration-150 group-hover/brand:opacity-0" />
              <ChevronRightIcon className="h-3.5 w-3.5 text-[hsl(var(--foreground))] absolute opacity-0 group-hover/brand:opacity-100 transition-opacity duration-150" />
            </button>
          ) : (
            <>
              <div className={`w-7 h-7 rounded-lg bg-gradient-to-br from-[hsl(var(--accent)/0.2)] to-[hsl(var(--accent)/0.1)] flex items-center justify-center shrink-0 ${(summaryLoading || entriesLoading) ? 'animate-pulse' : ''}`}>
                <DollarSignIcon className="h-4 w-4 text-[hsl(var(--accent))]" />
              </div>
              <div className="flex items-center gap-2 flex-1 overflow-hidden">
                <span className="font-bold text-sm tracking-wider text-[hsl(var(--foreground))] whitespace-nowrap">MYNAB</span>
                {(summaryLoading || entriesLoading) && (
                  <svg className="animate-spin h-3.5 w-3.5 text-[hsl(var(--accent))] shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
              </div>
              <button
                onClick={() => toggleSidebar(true)}
                className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] ml-auto shrink-0"
                title="Collapse sidebar"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Filters */}
        {!sidebarCollapsed && (
          <div className="flex flex-col gap-1 w-full">
            <CurrencyFilter
              isLoading={summaryLoading || entriesLoading}
              availableCurrencies={currencySummary?.currencies?.map(c => c.currency)}
              vertical
            />
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
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[hsl(var(--accent))] to-[hsl(var(--chart-3))] flex items-center justify-center overflow-hidden">
                  {userData?.avatar_data ? (
                    <img
                      src={`data:image/jpeg;base64,${userData.avatar_data}`}
                      alt="avatar"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <UserIcon className="h-3.5 w-3.5 text-[hsl(var(--background))]" />
                  )}
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
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[hsl(var(--accent))] to-[hsl(var(--chart-3))] flex items-center justify-center shrink-0 overflow-hidden">
                  {userData?.avatar_data ? (
                    <img
                      src={`data:image/jpeg;base64,${userData.avatar_data}`}
                      alt="avatar"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <UserIcon className="h-3.5 w-3.5 text-[hsl(var(--background))]" />
                  )}
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

      {/* Exit toast — shown on first back press when already on home */}
      <div className={`md:hidden fixed bottom-24 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${showExitToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
        <div className="px-5 py-2.5 rounded-2xl bg-[hsl(var(--foreground)/0.88)] backdrop-blur-xl text-[hsl(var(--background))] text-sm font-medium whitespace-nowrap shadow-xl">
          Press back again to exit
        </div>
      </div>

      {/* Mobile floating bottom bar */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
        <div className="flex items-center gap-3 px-4 py-3 rounded-[22px] border border-[hsl(var(--border))] bg-[hsl(var(--background)/0.82)] backdrop-blur-2xl shadow-2xl">
          {/* User avatar */}
          {userData && (
            <button
              onClick={() => setShowProfileModal(true)}
              className="relative shrink-0"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[hsl(var(--accent))] to-[hsl(var(--chart-3))] flex items-center justify-center overflow-hidden">
                {userData?.avatar_data ? (
                  <img
                    src={`data:image/jpeg;base64,${userData.avatar_data}`}
                    alt="avatar"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <UserIcon className="h-4 w-4 text-[hsl(var(--background))]" />
                )}
              </div>
              {(!userData.national_id || userData.national_id === "") && (
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[hsl(var(--warning-fg))] border border-[hsl(var(--background))]" />
              )}
            </button>
          )}

          {/* Divider */}
          <div className="w-px h-5 bg-[hsl(var(--border)/0.6)] shrink-0" />

          {/* Currency chips — scrollable if many */}
          <div className="flex-1 overflow-x-auto">
            <CurrencyFilter
              isLoading={summaryLoading || entriesLoading}
              availableCurrencies={currencySummary?.currencies?.map(c => c.currency)}
            />
          </div>

          {/* Loading indicator */}
          {(summaryLoading || entriesLoading) && (
            <>
              <div className="w-px h-5 bg-[hsl(var(--border)/0.6)] shrink-0" />
              <svg className="animate-spin h-4 w-4 text-[hsl(var(--accent))] shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="px-4 py-6 pb-28 md:pb-10 md:px-8 md:py-10 flex flex-col flex-1 min-h-0">

          {/* PWA install banner */}
          {canInstall && (
            <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-[var(--glass-radius-sm)] bg-[hsl(var(--accent)/0.1)] border border-[hsl(var(--accent)/0.25)] backdrop-blur-xl">
              <DownloadIcon className="h-4 w-4 text-[hsl(var(--accent))] shrink-0" />
              <span className="flex-1 text-sm text-[hsl(var(--foreground))]">Install MYNAB for a faster, offline-ready experience.</span>
              <button
                onClick={handleInstall}
                className="shrink-0 text-xs font-semibold text-[hsl(var(--accent))] hover:underline"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="shrink-0 p-0.5 rounded text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                aria-label="Dismiss"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <header className="mb-4 md:mb-6">
            <div className="text-center">
              <DateRangeFilter
                isLoading={summaryLoading || entriesLoading}
                trigger={
                  <button className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-[hsl(var(--accent))/0.1] to-[hsl(var(--chart-3))/0.1] rounded-2xl border border-[hsl(var(--accent))/0.2] backdrop-blur-sm hover:border-[hsl(var(--accent))/0.5] hover:shadow-md transition-all duration-150 cursor-pointer">
                    <h2 className="text-lg md:text-xl font-semibold bg-gradient-to-r from-[hsl(var(--accent))] to-[hsl(var(--chart-3))] bg-clip-text text-transparent">
                      {dateRangeFormatted}
                    </h2>
                    
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
          <div className="flex-1 min-h-0">
            <CurrencyOverview
              currencySummary={currencySummary}
              dateRangeFormatted={dateRangeFormatted}
              isLoading={summaryLoading}
              onCurrencySelect={handleCurrencySelect}
              onCurrencyImport={handleCurrencyImport}
            />
          </div>
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
