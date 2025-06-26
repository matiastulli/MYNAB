import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/services/api";
import { ArrowDownIcon, ArrowUpIcon, CalendarIcon, CircleDollarSignIcon, SearchIcon, TrashIcon, UserIcon, WalletIcon } from "lucide-react";
import { useEffect, useState } from "react";

// Add xs breakpoint to Tailwind if it doesn't exist
// This is used for small mobile screens
// You can add this to your tailwind.config.js screens section if not already there
// screens: { xs: '480px', ...defaultTheme.screens }

export default function ActivityList({
  isAuthenticated,
  entries = [],
  onSignInClick,
  onTransactionDeleted
}) {
  const [deletingId, setDeletingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEntries, setFilteredEntries] = useState(entries);

  useEffect(() => {
    if (searchTerm) {
      setFilteredEntries(entries.filter(entry => 
        entry.description?.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    } else {
      setFilteredEntries(entries);
    }
  }, [entries, searchTerm]);

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
      <Card className="border-0 bg-white/80 dark:bg-[#1a1e24]/80 backdrop-blur-sm shadow-sm">
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-neutral-100 dark:bg-[#2a303a]">
              <UserIcon className="h-6 w-6 text-neutral-400 dark:text-neutral-300" />
            </div>
            <div className="max-w-sm">
              <h3 className="text-lg font-medium mb-2 text-neutral-900 dark:text-white">Sign in to view transactions</h3>
              <p className="text-neutral-500 dark:text-neutral-300 mb-4">Track your spending and income by signing in to your account</p>
            </div>
            <Button
              onClick={onSignInClick}
              className="bg-emerald-600 hover:bg-emerald-700 text-white border-0"
              size="lg"
            >
              Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
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
              <h3 className="text-lg font-medium mb-2 text-neutral-900 dark:text-white">No transactions yet</h3>
              <p className="text-neutral-500 dark:text-neutral-300">Add your first transaction or import from your bank statements</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-white/80 dark:bg-[#1a1e24]/80 backdrop-blur-sm shadow-sm">
      <CardHeader className="pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <CardTitle className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
          Recent Activity
        </CardTitle>
        
        <div className="relative w-full sm:w-auto sm:min-w-[240px]">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input 
            type="search" 
            placeholder="Search transactions..." 
            className="w-full h-9 py-2 pl-9 pr-4 rounded-lg text-sm bg-neutral-100 dark:bg-[#252a34] border-0 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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