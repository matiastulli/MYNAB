
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialValue } from "@/components/ui/financial-value";
import { Spinner } from "@/components/ui/spinner";
import { getCurrencyName } from "@/lib/currencyUtils";
import { parseDatePreservingDay, toDateOnlyISOString } from "@/lib/dateUtils";
import { api } from "@/services/api";
import {
  ArrowDownIcon, ArrowUpIcon, BarChart2Icon, BarChartIcon, CalendarIcon,
  CircleDollarSignIcon, FilterIcon, SearchIcon, TrashIcon
} from "lucide-react";
import { useEffect, useState } from "react";

export default function ActivityList({
  isAuthenticated,
  entries = [],
  dateRangeFormatted,
  dateRange,
  onSignInClick,
  onTransactionDeleted,
  isLoading = false,
  currency = "ARS"
}) {
  const [deletingId, setDeletingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEntries, setFilteredEntries] = useState(entries);
  const [sortDirection, setSortDirection] = useState(null);
  const [groupByDate, setGroupByDate] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const toggleSortDirection = () => {
    if (sortDirection === null) {
      setSortDirection('desc'); // Start with highest amount first
    } else if (sortDirection === 'desc') {
      setSortDirection('asc'); // Toggle to lowest first
    } else {
      setSortDirection(null); // Toggle back to default order
    }
  };

  const toggleGroupByDate = () => {
    setGroupByDate(!groupByDate);
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
    try {
      // Build query parameters manually
      const params = new URLSearchParams();
      params.append('currency', currency);

      // Add date range parameters if available
      if (dateRange) {
        if (dateRange.startDate) {
          params.append('start_date', toDateOnlyISOString(dateRange.startDate));
        }
        if (dateRange.endDate) {
          params.append('end_date', toDateOnlyISOString(dateRange.endDate));
        }
      }

      // Add pagination parameters to export all data
      params.append('limit', '10000'); // Large limit to get all transactions
      params.append('offset', '0');

      // Build the URL with query parameters
      const url = `/budget/export-xlsx?${params.toString()}`;

      const response = await api.get(url);

      if (response.error) {
        console.error("Export error:", response.error);
        alert("Failed to download transactions: " + response.error);
        return;
      }

      // Check if we have file data
      if (!response.file_data) {
        alert(response.message || "No transactions found for export");
        return;
      }

      // Use filename from backend response
      const filename = response.filename || "transactions.xlsx";
      
      // Create data URL and download directly
      const dataUrl = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${response.file_data}`;
      
      const downloadLink = document.createElement("a");
      downloadLink.href = dataUrl;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Show success message with file info
      if (response.record_count) {
        console.log(`Successfully exported ${response.record_count} transactions to ${filename}`);
      }
      
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to download transactions. Please try again.");
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

    try {
      const response = await api.delete(`/budget/entry/${id}`);
      if (!response.error) {
        // Notify parent component to refresh data
        onTransactionDeleted();
      } else {
        console.error("Error deleting entry:", response.error);
      }
    } catch (error) {
      console.error("Failed to delete entry:", error);
    } finally {
      setDeletingId(null);
    }
  };

  if (entries.length === 0) {
    return (
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-8 sm:p-16 text-center">
          <div className="flex flex-col items-center gap-6 max-w-md mx-auto">
            {/* Enhanced Icon with gradient background */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-xl"></div>
              <div className="relative p-6 rounded-full bg-gradient-to-br from-muted to-muted/50 text-muted-foreground border border-border/50">
                <FilterIcon className="h-8 w-8" />
              </div>
            </div>

            {/* Enhanced messaging */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">
                  No {currency} transactions found
                </h3>
                <p className="text-sm text-muted-foreground">
                  for the period: <span className="font-medium text-foreground">{dateRangeFormatted}</span>
                </p>
              </div>

              {/* Enhanced currency filter notice */}
              <div className="bg-gradient-to-r from-info-bg/50 to-info-bg/30 border border-info-fg/20 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-center gap-2 text-info-fg">
                  <CircleDollarSignIcon className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">Currency Filter Active</span>
                </div>
                <p className="text-sm text-info-fg/80 leading-relaxed">
                  You're currently viewing <span className="font-semibold bg-info-fg/10 px-1.5 py-0.5 rounded text-info-fg">{currency}</span> transactions only.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }


  // Download all transactions as .xlsx

  return (
    <Card className="border-border bg-card backdrop-blur-sm shadow-lg overflow-hidden">
      <CardHeader className="pb-4 bg-gradient-to-r from-card to-card/80">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-accent/10 rounded-lg blur-sm"></div>
                <div className="relative p-2.5 rounded-lg bg-gradient-to-br from-accent/15 to-accent/5 border border-accent/20">
                  <BarChartIcon className="h-5 w-5 text-accent" />
                </div>
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-foreground">
                  Transaction Activity
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {filteredEntries.length} transaction{filteredEntries.length !== 1 ? 's' : ''} found
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-accent/10 to-accent/5 text-accent px-4 py-2 rounded-full border border-accent/20 backdrop-blur-sm">
              <CircleDollarSignIcon className="h-4 w-4" />
              <span className="text-sm font-medium">{currency}</span>
              <span className="text-xs opacity-75">({getCurrencyName(currency)})</span>
            </div>
          </div>
          {/* Enhanced Controls Section */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full">
            {/* Search Input */}
            <div className="relative flex-1 sm:min-w-[280px]">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search transactions by description..."
                className="w-full h-10 py-2 pl-10 pr-4 rounded-lg text-sm bg-background/50 border border-border/50 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20 text-foreground placeholder:text-muted-foreground backdrop-blur-sm transition-all duration-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <button
                    onClick={() => setSearchTerm("")}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Clear search"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            
            {/* Control Buttons */}
            <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border border-border/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSortDirection}
                title={
                  sortDirection === 'asc' ? "Sorting: Low to High" :
                    sortDirection === 'desc' ? "Sorting: High to Low" :
                      "Sort by Amount"
                }
                className={`h-8 px-3 rounded-md transition-all duration-200 ${sortDirection ? 'bg-accent text-accent-foreground shadow-sm' :
                  'text-muted-foreground hover:bg-background/50 hover:text-foreground'
                  }`}
              >
                {sortDirection === 'asc' ? (
                  <ArrowUpIcon className="h-4 w-4" />
                ) : sortDirection === 'desc' ? (
                  <ArrowDownIcon className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-medium">Sort</span>
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleGroupByDate}
                title={groupByDate ? "Showing grouped by date" : "Showing all transactions"}
                className={`h-8 px-3 rounded-md transition-all duration-200 ${groupByDate ? 'bg-accent text-accent-foreground shadow-sm' :
                  'text-muted-foreground hover:bg-background/50 hover:text-foreground'}`}
              >
                {groupByDate ? (
                  <BarChart2Icon className="h-4 w-4" />
                ) : (
                  <BarChartIcon className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Export Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex items-center gap-2 bg-background/50 backdrop-blur-sm border-border/50 hover:bg-accent/5 hover:border-accent/30 transition-all duration-200"
              onClick={handleExportXLSX}
              title="Download all transactions as .xlsx"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
              </svg>
              <span className="hidden sm:inline font-medium">Export</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading && entries.length > 0 && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/5 to-transparent animate-shimmer z-10"></div>
        )}

        {isLoading && entries.length === 0 && (
          <div className="py-12 flex flex-col items-center justify-center">
            <Spinner size="lg" className="mb-4" />
            <p className="text-muted-foreground">Loading transactions...</p>
          </div>
        )}

        <div className="divide-y divide-border">
          {Object.keys(groups).map(dateGroup => {
            const entriesForGroup = groups[dateGroup];

            // Skip rendering if no entries (shouldn't happen, but just in case)
            if (!entriesForGroup || entriesForGroup.length === 0) return null;

            return (
              <div key={dateGroup} className="divide-y divide-border/50">
                {/* Enhanced Date header */}
                {groupByDate && dateGroup !== 'ungrouped' && (
                  <div className="sticky top-0 z-10 bg-gradient-to-r from-muted/90 to-muted/80 backdrop-blur-md border-b border-border/30 px-4 py-2.5 text-sm font-medium text-foreground">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-accent rounded-full"></div>
                        <CalendarIcon className="h-4 w-4 text-accent/80" />
                        <span className="font-semibold">{formatDisplayDate(dateGroup)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground bg-background/50 px-2 py-1 rounded-full">
                          {entriesForGroup.length} transaction{entriesForGroup.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced transaction entries */}
                {entriesForGroup.map((entry) => (
                  <div
                    key={entry.id}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 hover:bg-gradient-to-r hover:from-accent/5 hover:to-accent/3 transition-all duration-200 border-l-2 border-l-transparent hover:border-l-accent/30"
                  >
                    <div className="flex items-start gap-4 w-full sm:w-auto">
                      <div
                        className={`p-3 rounded-xl flex-shrink-0 transition-all duration-200 group-hover:scale-105 ${entry.type === "income"
                          ? "bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-700 border border-emerald-200 dark:from-emerald-900/30 dark:to-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                          : "bg-gradient-to-br from-red-100 to-red-50 text-red-700 border border-red-200 dark:from-red-900/30 dark:to-red-900/20 dark:text-red-400 dark:border-red-800"
                          }`}
                      >
                        <CircleDollarSignIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2 sm:gap-1">
                          <p className="font-semibold text-foreground mr-auto line-clamp-1 group-hover:text-accent transition-colors duration-200">
                            {entry.description || "No description"}
                          </p>
                          {/* Mobile-only amount display */}
                          <div className="sm:hidden">
                            <FinancialValue
                              value={entry.amount}
                              type={entry.type}
                              currency={entry.currency}
                              showSign={true}
                              size="md"
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mt-2">
                          {!groupByDate && (
                            <div className="flex items-center gap-1.5">
                              <CalendarIcon className="h-3.5 w-3.5 opacity-70" />
                              <span>
                                {(() => {
                                  const entryDate = parseDatePreservingDay(entry.date);
                                  return entryDate.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  });
                                })()}
                              </span>
                            </div>
                          )}
                          {entry.source && (
                            <div className="flex items-center gap-1">
                              {!groupByDate && <span className="hidden xs:inline text-muted-foreground/50">•</span>}
                              <span className="capitalize bg-muted/50 px-2 py-0.5 rounded-full text-xs">
                                {entry.source.replace('_', ' ')}
                              </span>
                            </div>
                          )}
                          {entry.currency && entry.currency !== currency && (
                            <div className="flex items-center gap-1">
                              <span className="hidden xs:inline text-muted-foreground/50">•</span>
                              <span className="bg-accent/10 text-accent px-2 py-0.5 rounded-full text-xs font-medium">
                                {entry.currency}
                              </span>
                            </div>
                          )}
                          {entry.reference_id && (
                            <div className="flex items-center gap-1">
                              <span className="hidden xs:inline text-muted-foreground/50">•</span>
                              <span className="italic text-xs opacity-70 bg-muted/30 px-2 py-0.5 rounded-full max-w-[140px] truncate">
                                ref: {entry.reference_id.substring(0, 12)}
                                {entry.reference_id.length > 12 ? '...' : ''}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-4 sm:mt-0">
                      {/* Desktop-only amount display */}
                      <div className="hidden sm:block">
                        <FinancialValue
                          value={entry.amount}
                          type={entry.type}
                          currency={entry.currency}
                          showSign={true}
                          size="lg"
                        />
                      </div>

                      {/* Enhanced Delete button with confirmation */}
                      {showDeleteConfirm && confirmDelete === entry.id ? (
                        <div className="flex items-center gap-2 ml-auto bg-background/80 backdrop-blur-sm border border-border rounded-lg p-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmDelete(null)}
                            className="h-8 px-3 text-xs hover:bg-muted transition-all duration-200"
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(entry.id)}
                            disabled={deletingId === entry.id}
                            className="h-8 px-3 text-xs bg-red-600 hover:bg-red-700 transition-all duration-200"
                          >
                            {deletingId === entry.id ? (
                              <Spinner size="xs" />
                            ) : (
                              "Delete"
                            )}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto sm:ml-4 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 h-8 w-8 p-0 rounded-lg transition-all duration-200 group-hover:opacity-100 opacity-0 sm:opacity-100"
                          onClick={() => handleDeleteConfirm(entry.id)}
                          disabled={deletingId === entry.id}
                          title="Delete transaction"
                        >
                          {deletingId === entry.id ? (
                            <Spinner size="xs" />
                          ) : (
                            <TrashIcon className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}