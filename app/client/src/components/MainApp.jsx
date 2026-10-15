"use client"

import CurrencyFilter from "@/components/filters/CurrencyFilter"
import DateRangeFilter from "@/components/filters/DateRangeFilter"
import CurrencyOverview from "@/components/summary/CurrencyOverview"
import SummaryCards from "@/components/summary/SummaryCards"
import ActivityList from "@/components/tabs/ActivityList"
import AddTransaction from "@/components/tabs/AddTransaction"
import Dashboard from "@/components/tabs/Dashboard"
import FilesList from "@/components/tabs/FilesList"
import ImportFile from "@/components/tabs/ImportFile"
import { Avatar } from "@/components/ui/avatar"
import { StatusDot } from "@/components/ui/status-dot"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardProvider } from "@/contexts/DashboardContext"
import { useDashboardData } from "@/hooks/useDashboardData"
import { usePWAInstall } from "@/hooks/usePWAInstall"
import { getCurrencyName } from "@/lib/currencyUtils"
import { snappy, spring } from "@/lib/motion"
import { setupSystemPreferenceListener } from "@/lib/themeUtils"
import { cn } from "@/lib/utils"
import {
  CalendarBlankIcon,
  CaretDownIcon,
  DownloadSimpleIcon,
  FolderSimpleIcon,
  ListBulletsIcon,
  PlusCircleIcon,
  SidebarSimpleIcon,
  SquaresFourIcon,
  UploadSimpleIcon,
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react"
import { AnimatePresence, motion } from "framer-motion"
import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import { Link, Outlet, matchPath, useLocation, useMatch, useNavigate, useParams, useSearchParams } from "react-router-dom"

const TABS = [
  { value: "dashboard", label: "Overview", icon: SquaresFourIcon },
  { value: "entries", label: "Activity", icon: ListBulletsIcon },
  { value: "new", label: "Add", icon: PlusCircleIcon },
  { value: "import", label: "Import", icon: UploadSimpleIcon },
  { value: "files", label: "Statements", icon: FolderSimpleIcon },
]

export default function MainApp() {
  const params = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const isProfile = useMatch("/profile") !== null
  const profileFrom = isProfile ? location.state?.from : undefined

  // /profile has no tab, currency or dates of its own: feed the hook the dashboard view the user
  // came from, so it never rewrites the URL or resets the tab, and a currency click returns there
  const profileDashboard = useMemo(() => {
    if (!isProfile) return null
    const url = new URL(profileFrom ?? "/dashboard", window.location.origin)
    return {
      params: matchPath("/dashboard/:tab?/:currency?", url.pathname)?.params ?? {},
      searchParams: url.searchParams,
    }
  }, [isProfile, profileFrom])

  const tabsRef = useRef(null)
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
    handleCurrencyChange,
    handleDateRangeChange,
    handleCurrencySelect: hookHandleCurrencySelect,
    handleCurrencyImport: hookHandleCurrencyImport,
    handleTabChange,
    handlePaginationChange,
    handleFilesPaginationChange,
    handleImportSuccess,
    dateRangeFormatted,
  } = useDashboardData({
    params: profileDashboard?.params ?? params,
    searchParams: profileDashboard?.searchParams ?? searchParams,
    navigate,
  })

  // Declared after useDashboardData so activeTab/currency are in scope
  const activeTabRef = useRef(activeTab)
  const currencyRef = useRef(currency)
  const isProfileRef = useRef(isProfile)

  useEffect(() => {
    const cleanup = setupSystemPreferenceListener();
    return cleanup;
  }, []);

  // Keep refs in sync so the popstate handler never has a stale closure
  useEffect(() => { activeTabRef.current = activeTab }, [activeTab])
  useEffect(() => { currencyRef.current = currency }, [currency])
  useEffect(() => { isProfileRef.current = isProfile }, [isProfile])

  // Android/TWA hardware back button handler
  useEffect(() => {
    // The exit trap only belongs on dashboard entries; on /profile it would add a duplicate entry the back button has to get through
    if (!isProfileRef.current) window.history.pushState({ mynab: true }, '')

    const handlePopState = () => {
      // React Router renders the popped location in a transition, so the ref still describes the page being left.
      // Leaving /profile is a plain back navigation to the dashboard URL it was opened from: no tab reset, no exit toast.
      if (isProfileRef.current) return

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
  }, [handleTabChange, isProfile])

  const scrollToTabs = () => {
    setTimeout(() => {
      if (tabsRef.current) {
        tabsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleCurrencySelect = (selectedCurrency) => {
    hookHandleCurrencySelect(selectedCurrency);
    scrollToTabs();
  };

  const handleCurrencyImport = (selectedCurrency) => {
    hookHandleCurrencyImport(selectedCurrency);
    scrollToTabs();
  };

  const isBusy = summaryLoading || entriesLoading
  const missingCuit = userData && (!userData.national_id || userData.national_id === "")
  const fullName = userData ? [userData.name, userData.last_name].filter(Boolean).join(" ") : ""
  // Re-opening the profile from /profile keeps the original "from" instead of pointing it at itself
  const profileLinkProps = isProfile
    ? { to: "/profile", state: location.state, replace: true }
    : { to: "/profile", state: { from: location.pathname + location.search } }

  return (
    <DashboardProvider
      currency={isProfile ? null : currency}
      dateRange={dateRange}
      handleCurrencyChange={handleCurrencyChange}
      handleDateRangeChange={handleDateRangeChange}
    >
    <div className="flex min-h-[100dvh] bg-background">

      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 76 : 248 }}
        transition={spring}
        className="sticky top-0 hidden h-[100dvh] shrink-0 flex-col gap-6 overflow-hidden border-r border-border/70 px-3.5 py-5 md:flex"
      >
        {/* Brand */}
        <div className={cn("flex h-9 items-center", sidebarCollapsed ? "justify-center" : "gap-2.5 px-1")}>
          <button
            onClick={() => sidebarCollapsed && toggleSidebar(false)}
            className={cn("group/brand relative size-8 shrink-0 rounded-[10px]", !sidebarCollapsed && "pointer-events-none")}
            aria-label={sidebarCollapsed ? "Expand sidebar" : undefined}
            tabIndex={sidebarCollapsed ? 0 : -1}
          >
            <img src="/android-chrome-192x192.png" alt="MYNAB" className="size-8 rounded-[10px] object-cover transition-opacity duration-200 group-hover/brand:opacity-0" />
            <SidebarSimpleIcon className="absolute inset-0 m-auto size-4 text-foreground opacity-0 transition-opacity duration-200 group-hover/brand:opacity-100" />
          </button>
          {!sidebarCollapsed && (
            <>
              <div className="flex min-w-0 flex-1 flex-col leading-none">
                <span className="text-[15px] font-semibold tracking-tight">MYNAB</span>
                <span className="mt-1 text-[11px] text-muted-foreground">Personal ledger</span>
              </div>
              <button
                onClick={() => toggleSidebar(true)}
                className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Collapse sidebar"
              >
                <SidebarSimpleIcon className="size-4" />
              </button>
            </>
          )}
        </div>

        {/* Currencies */}
        {!sidebarCollapsed && (
          <div className="flex flex-col gap-2">
            <p className="px-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Currencies</p>
            <CurrencyFilter
              isLoading={isBusy}
              availableCurrencies={currencySummary?.currencies?.map(c => c.currency)}
              vertical
            />
          </div>
        )}

        <div className="flex-1" />

        {/* User */}
        {userData && (
          <Link
            {...profileLinkProps}
            aria-current={isProfile ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-2xl border border-transparent p-2 text-left transition-colors duration-200 hover:border-border hover:bg-card active:scale-[0.99]",
              isProfile && "border-border/80 bg-card shadow-[var(--shadow-diffuse)]",
              sidebarCollapsed && "justify-center"
            )}
            title={fullName}
          >
            <span className="relative">
              <Avatar user={userData} className="size-9" />
              {missingCuit && (
                <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-background bg-warning" />
              )}
            </span>
            {!sidebarCollapsed && (
              <span className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate text-[13px] font-medium">{fullName}</span>
                <span className={cn("truncate text-[11px]", missingCuit ? "text-warning" : "text-muted-foreground")}>
                  {missingCuit ? "Add your CUIT" : userData.email || "Profile"}
                </span>
              </span>
            )}
          </Link>
        )}
      </motion.aside>

      {/* Exit toast — shown on first back press when already on home */}
      <AnimatePresence>
        {showExitToast && (
          <motion.div
            initial={{ opacity: 0, y: 8, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 8, x: "-50%" }}
            transition={snappy}
            className="fixed bottom-28 left-1/2 z-50 whitespace-nowrap rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-[var(--shadow-lift)] md:hidden"
          >
            Press back again to exit
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile floating bottom bar */}
      <div className="fixed inset-x-4 bottom-4 z-40 md:hidden">
        <div className="flex items-center gap-2 rounded-full border border-border/80 bg-card/85 p-1.5 backdrop-blur-xl [box-shadow:var(--shadow-lift),inset_0_1px_0_hsl(0_0%_100%/0.06)]">
          {userData && (
            <Link
              {...profileLinkProps}
              aria-current={isProfile ? "page" : undefined}
              className="relative shrink-0 rounded-full active:scale-95"
              aria-label="Open profile"
            >
              <Avatar user={userData} className="size-11" ring={isProfile} />
              {missingCuit && (
                <span className="absolute right-0 top-0 size-2.5 rounded-full border-2 border-card bg-warning" />
              )}
            </Link>
          )}
          <CurrencyFilter
            isLoading={isBusy}
            availableCurrencies={currencySummary?.currencies?.map(c => c.currency)}
          />
        </div>
      </div>

      {/* Main content */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* Mobile app bar: brand + period */}
        <header
          className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl md:hidden"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="flex h-14 items-center justify-between gap-3 px-4">
            <span className="text-[19px] font-bold tracking-tight">MYNAB</span>
            <DateRangeFilter
              isLoading={isBusy}
              trigger={
                <button className="inline-flex h-9 min-w-0 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-[13px] font-medium transition-colors active:scale-[0.97]">
                  <CalendarBlankIcon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{dateRangeFormatted}</span>
                  <CaretDownIcon className="size-3 shrink-0 text-muted-foreground" weight="bold" />
                </button>
              }
            />
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-4 pb-32 pt-5 md:px-10 md:pb-12 md:pt-9">

          {/* PWA install banner */}
          <AnimatePresence>
            {canInstall && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={spring}
                className="mb-6 flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
              >
                <DownloadSimpleIcon className="size-4 shrink-0 text-accent" />
                <span className="flex-1 text-sm">Install MYNAB to open it like an app, even offline.</span>
                <button onClick={handleInstall} className="shrink-0 text-[13px] font-semibold text-accent hover:underline">
                  Install
                </button>
                <button
                  onClick={handleDismiss}
                  className="grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Dismiss"
                >
                  <XIcon className="size-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {isProfile ? (
            <Suspense fallback={null}>
              <Outlet />
            </Suspense>
          ) : (
          <>
            {/* Page header: period on the left, context on the right */}
            {/* Page title: period on desktop; on mobile the period lives in the app bar, so the title names the currency */}
            <header className="mb-6 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between md:gap-5">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  <StatusDot busy={isBusy} />
                  <span className="md:hidden">{isBusy ? "Updating" : currency === "ALL" ? "Overview" : currency}</span>
                  <span className="hidden md:inline">{isBusy ? "Updating" : currency === "ALL" ? "All currencies" : `${currency} · ${getCurrencyName(currency)}`}</span>
                </div>
                <h1 className="text-[1.75rem] font-semibold leading-none tracking-tighter md:hidden">
                  {currency === "ALL" ? "All currencies" : getCurrencyName(currency)}
                </h1>
                <DateRangeFilter
                  isLoading={isBusy}
                  trigger={
                    <button className="group -ml-1 hidden w-fit items-center gap-2 rounded-xl px-1 text-left active:scale-[0.99] md:inline-flex">
                      <h1 className="text-[1.75rem] font-semibold leading-none tracking-tighter text-foreground md:text-[2.5rem]">
                        {dateRangeFormatted}
                      </h1>
                      <span className="grid size-7 place-items-center rounded-full border border-border text-muted-foreground transition-colors duration-200 group-hover:border-foreground/30 group-hover:text-foreground md:mt-1">
                        <CaretDownIcon className="size-3.5" weight="bold" />
                      </span>
                    </button>
                  }
                />
              </div>

              {missingCuit && (
                <Link
                  to="/profile"
                  state={{ from: location.pathname + location.search, focus: "national_id" }}
                  className="flex w-fit items-center gap-2 rounded-full border border-warning/30 text-left bg-warning-soft px-3.5 py-1.5 text-[13px] font-medium text-warning transition-colors hover:border-warning/50"
                >
                  <WarningCircleIcon className="size-4" />
                  <span className="md:hidden">Add your CUIT</span>
                  <span className="hidden md:inline">Add your CUIT to skip transfers between your accounts</span>
                </Link>
              )}
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
            <Tabs ref={tabsRef} value={activeTab} onValueChange={handleTabChange} className="scroll-mt-6 gap-6">
              <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
                <TabsList className="w-full sm:w-auto">
                  {TABS.map(({ value, label, icon: Icon }) => {
                    const isActive = activeTab === value
                    return (
                      <TabsTrigger key={value} value={value} className="flex-1 px-3 sm:flex-none sm:px-4" aria-label={label}>
                        {isActive && (
                          <motion.span
                            layoutId="tab-active"
                            transition={snappy}
                            className="absolute inset-0 rounded-full border border-border/80 bg-card shadow-[0_1px_2px_hsl(var(--shadow-tint)/0.08)]"
                          />
                        )}
                        <Icon className="relative size-4" weight={isActive ? "fill" : "regular"} />
                        <span className="relative hidden sm:inline">{label}</span>
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
              </div>

              <TabsContent value="dashboard">
                <Dashboard
                  currency={currency}
                  summary={summary}
                  entries={entries}
                  totalTransactions={pagination.total}
                  isLoading={summaryLoading || entriesLoading}
                />
              </TabsContent>

              <TabsContent value="entries">
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
              </TabsContent>

              <TabsContent value="new">
                <AddTransaction
                  defaultCurrency={currency}
                  categories={categories}
                  onTransactionAdded={() => {
                    fetchSummary();
                    fetchDetails();
                  }}
                />
              </TabsContent>

              <TabsContent value="import">
                <ImportFile
                  currency={currency}
                  onImportComplete={() => {
                    fetchSummary();
                    fetchDetails();
                  }}
                  onImportSuccess={handleImportSuccess}
                />
              </TabsContent>

              <TabsContent value="files">
                <FilesList
                  currency={currency}
                  onFileDeleted={() => {
                    fetchSummary();
                    fetchDetails();
                    fetchFiles();
                  }}
                  onImportClick={() => handleTabChange('import')}
                  files={files}
                  loading={filesLoading}
                  error={filesError}
                  pagination={filesPagination}
                  onPaginationChange={handleFilesPaginationChange}
                />
              </TabsContent>
            </Tabs>
          )}
          </>
          )}
        </div>
      </main>
    </div>
    </DashboardProvider>
  );
}
