
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialValue } from "@/components/ui/financial-value";
import { Spinner } from "@/components/ui/spinner";
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

  const getCurrencyName = (currency) => {
    const names = {
      'USD': 'US Dollar',
      'EUR': 'Euro',
      'BRL': 'Brazilian Real',
      'ARS': 'Argentine Peso'
    };
    return names[currency] || currency;
  };

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
        <CardContent className="p-8 sm:p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-muted text-muted-foreground">
              <FilterIcon className="h-6 w-6" />
            </div>
            <div className="max-w-sm">
              <h3 className="text-lg font-medium mb-2 text-foreground">
                No {currency} transactions for {dateRangeFormatted}
              </h3>

              {/* Currency filter notice */}
              <div className="flex items-center justify-center gap-2 p-3 bg-info-bg text-info-fg rounded-md max-w-xs mx-auto mb-4">
                <CircleDollarSignIcon className="h-4 w-4 flex-shrink-0" />
                <p className="text-sm text-left">
                  You're viewing <span className="font-semibold">{currency}</span> transactions only. Try changing the currency filter to see more.
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
    <Card className="border-border bg-card backdrop-blur-sm shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
                <BarChartIcon className="h-5 w-5 text-accent" />
              </div>
              <CardTitle className="text-xl font-semibold text-foreground">
                Activity
              </CardTitle>
            </div>
            <div className="flex items-center gap-2 bg-accent/10 text-accent px-3 py-1.5 rounded-full border border-accent/20">
              <CircleDollarSignIcon className="h-4 w-4" />
              <span className="text-sm font-medium">{currency}</span>
              <span className="text-xs opacity-75">({getCurrencyName(currency)})</span>
            </div>
          </div>
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto mt-2">
            <div className="relative flex-1 sm:min-w-[240px]">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search transactions..."
                className="w-full h-9 py-2 pl-9 pr-4 rounded-lg text-sm bg-muted border-0 focus:outline-none focus:ring-2 focus:ring-accent/20 text-foreground placeholder:text-muted-foreground"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSortDirection}
                title={
                  sortDirection === 'asc' ? "Sorting: Low to High" :
                    sortDirection === 'desc' ? "Sorting: High to Low" :
                      "Sort by Amount"
                }
                className={`h-9 px-3 rounded-lg ${sortDirection ? 'bg-accent/10 text-accent' :
                  'text-muted-foreground hover:bg-muted'
                  }`}
              >
                {sortDirection === 'asc' ? (
                  <ArrowUpIcon className="h-4 w-4" />
                ) : sortDirection === 'desc' ? (
                  <ArrowDownIcon className="h-4 w-4" />
                ) : (
                  <span className="text-xs">Sort</span>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleGroupByDate}
                title={groupByDate ? "Showing grouped by date" : "Showing all transactions"}
                className={`h-9 px-3 rounded-lg ${groupByDate ? 'bg-accent/10 text-accent' :
                  'text-muted-foreground hover:bg-muted'}`}
              >
                {groupByDate ? (
                  <BarChart2Icon className="h-4 w-4" />
                ) : (
                  <BarChartIcon className="h-4 w-4" />
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="ml-2 flex items-center gap-2"
                onClick={handleExportXLSX}
                title="Download all transactions as .xlsx"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" /></svg>
                <span className="hidden sm:inline">Export .xlsx</span>
              </Button>
            </div>
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
                {/* Date header (only if grouping by date) */}
                {groupByDate && dateGroup !== 'ungrouped' && (
                  <div className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-foreground flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon className="h-3.5 w-3.5 text-accent/80" />
                      {formatDisplayDate(dateGroup)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {entriesForGroup.length} transaction{entriesForGroup.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}

                {/* Entries */}
                {entriesForGroup.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-start gap-4 w-full sm:w-auto">
                      <div
                        className={`p-2.5 rounded-xl flex-shrink-0 ${entry.type === "income"
                          ? "bg-success-bg text-success-fg"
                          : "bg-destructive/10 text-destructive"
                          }`}
                      >
                        <CircleDollarSignIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2 sm:gap-1">
                          <p className="font-medium text-foreground mr-auto line-clamp-1">
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
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground mt-1">
                          {!groupByDate && (
                            <div className="flex items-center gap-1">
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
                            <>
                              {!groupByDate && <span className="hidden xs:inline">•</span>}
                              <span className="capitalize">{entry.source.replace('_', ' ')}</span>
                            </>
                          )}
                          {entry.currency && entry.currency !== currency && (
                            <>
                              <span className="hidden xs:inline">•</span>
                              <span>{entry.currency}</span>
                            </>
                          )}
                          {entry.reference_id && (
                            <>
                              <span className="hidden xs:inline">•</span>
                              <span className="italic text-xs opacity-80 break-all max-w-[120px] truncate">
                                ref: {entry.reference_id.substring(0, 12)}
                                {entry.reference_id.length > 12 ? '...' : ''}
                              </span>
                            </>
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

                      {/* Delete button with confirmation */}
                      {showDeleteConfirm && confirmDelete === entry.id ? (
                        <div className="flex items-center gap-1 ml-auto">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmDelete(null)}
                            className="h-8 px-2 text-xs hover:bg-background"
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(entry.id)}
                            disabled={deletingId === entry.id}
                            className="h-8 px-3 text-xs"
                          >
                            {deletingId === entry.id ? (
                              <Spinner size="xs" />
                            ) : (
                              "Confirm"
                            )}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto sm:ml-4 hover:bg-destructive/10 hover:text-destructive h-8 w-8 p-0"
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