import SignInPrompt from "@/components/SignInPrompt";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/services/api";
import { ArrowDownIcon, ArrowUpIcon, CalendarIcon, CircleDollarSignIcon, SearchIcon, TrashIcon, WalletIcon } from "lucide-react";
import { useEffect, useState } from "react";

export default function ActivityList({
  isAuthenticated,
  entries = [],
  dateRange,
  dateRangeFormatted,
  onSignInClick,
  onTransactionDeleted
}) {
  const [deletingId, setDeletingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEntries, setFilteredEntries] = useState(entries);
  const [sortDirection, setSortDirection] = useState(null); // null, 'asc', or 'desc'

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

  const handleDelete = async (id) => {
    setDeletingId(id);
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

  if (!isAuthenticated) {
    return (
      <SignInPrompt
        title="Sign in to view transactions"
        description="Track your spending and income by signing in to your account"
        onSignInClick={onSignInClick}
      />
    );
  }

  if (entries.length === 0) {
    return (
      <Card className="border-0 bg-white/80 dark:bg-[#1a1e24]/80 backdrop-blur-sm shadow-sm">
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-emerald-50 dark:bg-emerald-900/30">
              <WalletIcon className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />
            </div>
            <div className="max-w-sm">
              <h3 className="text-lg font-medium mb-2 text-neutral-900 dark:text-white">
                No transactions for {dateRangeFormatted}
              </h3>
              <p className="text-neutral-500 dark:text-neutral-300">Add your first transaction or import from your bank statements</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-white/80 dark:bg-[#1a1e24]/80 backdrop-blur-sm shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <WalletIcon className="h-5 w-5 text-emerald-500" />
              Activity
            </CardTitle>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:min-w-[240px]">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="search"
                placeholder="Search transactions..."
                className="w-full h-9 py-2 pl-9 pr-4 rounded-lg text-sm bg-neutral-100 dark:bg-[#252a34] border-0 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSortDirection}
              title={
                sortDirection === 'asc' ? "Sorting: Low to High" :
                  sortDirection === 'desc' ? "Sorting: High to Low" :
                    "Sort by Amount"
              }
              className={`h-9 px-3 rounded-lg ${sortDirection ? 'bg-neutral-100 dark:bg-[#252a34] text-emerald-600 dark:text-emerald-400' :
                  'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-[#252a34]'
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
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 hover:bg-neutral-50 dark:hover:bg-[#212630] transition-colors"
            >
              <div className="flex items-start gap-4 w-full sm:w-auto">
                <div
                  className={`p-3 rounded-xl flex-shrink-0 ${entry.type === "income"
                    ? "bg-emerald-50 dark:bg-emerald-900/50"
                    : "bg-red-50 dark:bg-red-900/50"
                    }`}
                >
                  {entry.type === "income" ? (
                    <CircleDollarSignIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <CircleDollarSignIcon className="h-5 w-5 text-red-500 dark:text-red-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2 sm:gap-1">
                    <p className="font-medium text-neutral-900 dark:text-neutral-100 mr-auto">
                      {entry.description || "No description"}
                    </p>
                    <p
                      className={`sm:hidden font-semibold text-base ${entry.type === "income"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-500 dark:text-red-400"
                        }`}
                    >
                      {entry.type === "income" ? "+" : "-"}
                      {entry.currency === 'USD' ? '$' : entry.currency === 'EUR' ? '€' : '$'}
                      {Number.parseFloat(entry.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      {entry.currency && entry.currency !== 'USD' && entry.currency !== 'EUR' && entry.currency !== 'ARS' && (
                        <span className="text-xs ml-1 opacity-75">{entry.currency}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-3.5 w-3.5 opacity-70" />
                      <span>
                        {new Date(entry.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    {entry.source && (
                      <>
                        <span className="hidden xs:inline">•</span>
                        <span className="capitalize">{entry.source.replace('_', ' ')}</span>
                      </>
                    )}
                    {entry.currency && entry.currency !== 'ARS' && (
                      <>
                        <span className="hidden xs:inline">•</span>
                        <span>{entry.currency}</span>
                      </>
                    )}
                    {entry.reference_id && (
                      <>
                        <span className="hidden xs:inline">•</span>
                        <span className="italic text-xs opacity-80 break-all">
                          ref: {entry.reference_id.substring(0, 12)}
                          {entry.reference_id.length > 12 ? '...' : ''}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-4 sm:mt-0">
                <p
                  className={`hidden sm:block text-lg font-semibold ${entry.type === "income"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-500 dark:text-red-400"
                    }`}
                >
                  {entry.type === "income" ? "+" : "-"}
                  {entry.currency === 'USD' ? '$' : entry.currency === 'EUR' ? '€' : '$'}
                  {Number.parseFloat(entry.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto sm:ml-4 text-neutral-400 hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => handleDelete(entry.id)}
                  disabled={deletingId === entry.id}
                >
                  {deletingId === entry.id ? (
                    <div className="h-4 w-4 border-2 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <TrashIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}