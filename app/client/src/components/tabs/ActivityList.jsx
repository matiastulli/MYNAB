import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FinancialValue, formatMoney } from "@/components/ui/financial-value";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { getCurrencySymbol } from "@/lib/currencyUtils";
import { parseDatePreservingDay, toDateOnlyISOString } from "@/lib/dateUtils";
import { snappy } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";
import {
  ArrowDownLeftIcon, ArrowUpRightIcon, ArrowsDownUpIcon, DownloadSimpleIcon, ListBulletsIcon,
  MagnifyingGlassIcon, RowsIcon, SortAscendingIcon, SortDescendingIcon, TrashIcon, XIcon
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function ActivityList({
  entries = [],
  dateRangeFormatted,
  dateRange,
  onTransactionDeleted,
  isLoading = false,
  currency = "ARS",
  pagination = { limit: 25, offset: 0, total: 0 },
  onPaginationChange = () => {}
}) {
  const [deletingId, setDeletingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEntries, setFilteredEntries] = useState(entries);
  const [sortDirection, setSortDirection] = useState(null);
  const [groupByDate, setGroupByDate] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    // Apply filtering and sorting
    let result = [...entries];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(entry =>
        entry.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting by amount if direction is set
    if (sortDirection === 'asc') {
      result = [...result].sort((a, b) => a.amount - b.amount);
    } else if (sortDirection === 'desc') {
      result = [...result].sort((a, b) => b.amount - a.amount);
    }

    setFilteredEntries(result);
  }, [entries, searchTerm, sortDirection]);

  useEffect(() => {
    onPaginationChange({ ...pagination, offset: 0 });
  }, [searchTerm]);

  const toggleSortDirection = () => {
    if (sortDirection === null) {
      setSortDirection('desc'); // Start with highest amount first
    } else if (sortDirection === 'desc') {
      setSortDirection('asc'); // Toggle to lowest first
    } else {
      setSortDirection(null); // Toggle back to default order
    }
  };

  const groupedEntries = () => {
    if (!groupByDate) return { ungrouped: filteredEntries };

    return filteredEntries.reduce((groups, entry) => {
      // Format the date as "YYYY-MM-DD" for grouping
      const date = entry.date.split('T')[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(entry);
      return groups;
    }, {});
  };

  const formatDisplayDate = (dateString) => {
    const date = parseDatePreservingDay(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleExportXLSX = async () => {
    setExportError(null);
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      params.append('currency', currency);

      if (dateRange) {
        if (dateRange.startDate) {
          params.append('start_date', toDateOnlyISOString(dateRange.startDate));
        }
        if (dateRange.endDate) {
          params.append('end_date', toDateOnlyISOString(dateRange.endDate));
        }
      }

      // Large limit so the export covers every transaction in range
      params.append('limit', '10000');
      params.append('offset', '0');

      const response = await api.get(`/budget/export-xlsx?${params.toString()}`);

      if (response.error) {
        console.error("Export error:", response.error);
        setExportError(`Export failed: ${response.error}`);
        return;
      }

      if (!response.file_data) {
        setExportError(response.message || "No transactions found for export");
        return;
      }

      const filename = response.filename || "transactions.xlsx";
      const dataUrl = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${response.file_data}`;

      const downloadLink = document.createElement("a");
      downloadLink.href = dataUrl;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      console.error("Export failed:", err);
      setExportError("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const groups = groupedEntries();

  const handleDeleteConfirm = (id) => {
    setConfirmDelete(id);
    setShowDeleteConfirm(true);

    // Auto-hide after 3 seconds
    setTimeout(() => {
      setShowDeleteConfirm(false);
    }, 3000);
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    setConfirmDelete(null);
    setShowDeleteConfirm(false);
    setDeleteError(null);

    try {
      const response = await api.delete(`/budget/entry/${id}`);
      if (!response.error) {
        onTransactionDeleted();
      } else {
        console.error("Error deleting entry:", response.error);
        setDeleteError("That transaction could not be deleted. Try again.");
      }
    } catch (error) {
      console.error("Failed to delete entry:", error);
      setDeleteError("That transaction could not be deleted. Try again.");
    } finally {
      setDeletingId(null);
    }
  };

  if (entries.length === 0) {
    return (
      <Card className="overflow-hidden">
        {isLoading ? (
          <ActivitySkeleton />
        ) : (
          <EmptyState icon={ListBulletsIcon} title={`No ${currency} transactions in ${dateRangeFormatted}`}>
            Try a wider period from the date at the top, switch currency, or import a statement from the
            Import tab.
          </EmptyState>
        )}
      </Card>
    );
  }

  const symbol = getCurrencySymbol(currency);
  let rowIndex = 0;

  return (
    <Card className="relative overflow-clip">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 border-b border-border/70 px-5 pb-5 pt-6 md:px-8">
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold tracking-tight">Activity</h2>
            <p className="text-[13px] text-muted-foreground">
              <span className="figure">{pagination.total}</span> transaction{pagination.total !== 1 ? 's' : ''}
              {searchTerm && filteredEntries.length !== entries.length && (
                <span> · <span className="figure">{filteredEntries.length}</span> match on this page</span>
              )}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleExportXLSX} loading={isExporting} loadingText="Exporting" title="Download all transactions as .xlsx">
            <DownloadSimpleIcon />
            <span className="hidden sm:inline">Export .xlsx</span>
          </Button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              aria-label="Search transactions"
              placeholder="Search by description"
              className="h-10 w-full rounded-full border border-input bg-background/60 pl-10 pr-10 text-sm transition-[border-color,box-shadow] duration-300 hover:border-foreground/25 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Clear search"
              >
                <XIcon className="size-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={sortDirection ? "secondary" : "ghost"}
              size="sm"
              onClick={toggleSortDirection}
              className={cn("border", sortDirection ? "border-border" : "border-transparent")}
              aria-label={
                sortDirection === 'asc' ? "Sorted by amount, low to high" :
                  sortDirection === 'desc' ? "Sorted by amount, high to low" :
                    "Sort by amount"
              }
            >
              {sortDirection === 'asc' ? <SortAscendingIcon /> : sortDirection === 'desc' ? <SortDescendingIcon /> : <ArrowsDownUpIcon />}
              <span>{sortDirection === 'asc' ? "Low first" : sortDirection === 'desc' ? "High first" : "Amount"}</span>
            </Button>
            <Segmented
              size="sm"
              ariaLabel="Grouping"
              value={groupByDate ? "day" : "flat"}
              onChange={(v) => setGroupByDate(v === "day")}
              options={[
                { value: "day", label: "By day", icon: RowsIcon },
                { value: "flat", label: "Flat", icon: ListBulletsIcon },
              ]}
            />
          </div>
        </div>

        {(exportError || deleteError) && (
          <p role="alert" className="text-[13px] font-medium text-destructive">{exportError || deleteError}</p>
        )}
      </div>

      {/* Refresh overlay */}
      {isLoading && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-0.5 overflow-hidden">
          <div className="h-full w-1/3 animate-shimmer bg-accent" />
        </div>
      )}

      <div className={cn("transition-opacity duration-300", isLoading && "opacity-60")}>
        {Object.keys(groups).map(dateGroup => {
          const entriesForGroup = groups[dateGroup];
          if (!entriesForGroup || entriesForGroup.length === 0) return null;

          const dayNet = entriesForGroup.reduce(
            (sum, e) => sum + (e.type === "income" ? e.amount : -e.amount),
            0
          );

          return (
            <section key={dateGroup}>
              {groupByDate && dateGroup !== 'ungrouped' && (
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/70 bg-card/90 px-5 py-2.5 backdrop-blur-md md:px-8">
                  <span className="text-[13px] font-semibold tracking-tight">{formatDisplayDate(dateGroup)}</span>
                  <span className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span>{entriesForGroup.length} item{entriesForGroup.length !== 1 ? 's' : ''}</span>
                    <span className={cn("figure font-medium", dayNet >= 0 ? "text-positive" : "text-foreground")}>
                      {dayNet >= 0 ? "+" : "−"}{symbol}{formatMoney(dayNet)}
                    </span>
                  </span>
                </div>
              )}

              <ul className="divide-y divide-border/60">
                {entriesForGroup.map((entry) => {
                  const i = rowIndex++;
                  const isIncome = entry.type === "income";
                  const confirming = showDeleteConfirm && confirmDelete === entry.id;
                  return (
                    <li
                      key={entry.id}
                      className={cn("group flex items-center gap-4 px-5 py-4 transition-colors duration-200 hover:bg-muted/45 md:px-8", i < 24 && "cascade")}
                      style={{ "--i": i }}
                    >
                      <span
                        className={cn(
                          "grid size-10 shrink-0 place-items-center rounded-2xl",
                          isIncome ? "bg-accent-soft text-accent" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {isIncome ? <ArrowDownLeftIcon className="size-4" weight="bold" /> : <ArrowUpRightIcon className="size-4" weight="bold" />}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium leading-snug">
                          {entry.description || <span className="text-muted-foreground">No description</span>}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          {!groupByDate && (
                            <span className="figure">
                              {parseDatePreservingDay(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          )}
                          {entry.source && (
                            <span className="capitalize">{entry.source.replace('_', ' ')}</span>
                          )}
                          {entry.currency && entry.currency !== currency && (
                            <span className="rounded-full bg-muted px-1.5 py-px font-medium text-foreground">{entry.currency}</span>
                          )}
                          {entry.reference_id && (
                            <span className="figure max-w-[160px] truncate opacity-75" title={entry.reference_id}>
                              #{entry.reference_id}
                            </span>
                          )}
                        </div>
                      </div>

                      <FinancialValue
                        value={entry.amount}
                        type={entry.type}
                        currency={entry.currency}
                        showSign={true}
                        size="md"
                        className="shrink-0"
                      />

                      <div className="relative flex w-8 shrink-0 justify-end">
                        <AnimatePresence initial={false}>
                          {confirming && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.92, x: 8 }}
                              animate={{ opacity: 1, scale: 1, x: 0 }}
                              exit={{ opacity: 0, scale: 0.92, x: 8 }}
                              transition={snappy}
                              className="absolute right-0 top-1/2 z-10 flex -translate-y-1/2 items-center gap-1 rounded-full border border-border bg-popover p-1 shadow-[var(--shadow-lift)]"
                            >
                              <Button variant="ghost" size="xs" onClick={() => setConfirmDelete(null)}>
                                Keep
                              </Button>
                              <Button variant="destructive" size="xs" onClick={() => handleDelete(entry.id)}>
                                Delete
                              </Button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <Button
                          variant="destructive-ghost"
                          size="icon-sm"
                          className={cn("opacity-60 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100", confirming && "invisible")}
                          onClick={() => handleDeleteConfirm(entry.id)}
                          disabled={deletingId === entry.id}
                          aria-label="Delete transaction"
                        >
                          {deletingId === entry.id ? <Spinner size="xs" /> : <TrashIcon />}
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      {pagination.total > pagination.limit && (
        <div className="flex items-center justify-between gap-3 border-t border-border/70 px-5 py-4 md:px-8">
          <p className="figure text-xs text-muted-foreground">
            {pagination.offset + 1}–{Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPaginationChange({ ...pagination, offset: pagination.offset - pagination.limit })}
              disabled={pagination.offset === 0}
            >
              Previous
            </Button>
            <span className="figure hidden px-1 text-xs text-muted-foreground sm:inline">
              {Math.floor(pagination.offset / pagination.limit) + 1} / {Math.ceil(pagination.total / pagination.limit)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPaginationChange({ ...pagination, offset: pagination.offset + pagination.limit })}
              disabled={pagination.offset + pagination.limit >= pagination.total}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function ActivitySkeleton() {
  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-border/70 px-5 pb-5 pt-6 md:px-8">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-10 w-full rounded-full" />
      </div>
      <div className="divide-y divide-border/60">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 md:px-8">
            <Skeleton className="size-10 rounded-2xl" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4" style={{ width: `${62 - i * 6}%` }} />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
