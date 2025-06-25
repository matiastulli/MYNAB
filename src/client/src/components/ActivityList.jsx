import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/services/api";
import { ArrowDownIcon, ArrowUpIcon, TrashIcon, UserIcon, WalletIcon } from "lucide-react";
import { useState } from "react";

export default function ActivityList({
  isAuthenticated,
  entries = [],
  onSignInClick,
  onTransactionDeleted
}) {
  const [deletingId, setDeletingId] = useState(null);

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
      <Card className="border-0 bg-white/60 dark:bg-[#1a1e24]/90 backdrop-blur-sm">
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 rounded-full bg-neutral-100 dark:bg-[#2a303a]">
              <UserIcon className="h-6 w-6 text-neutral-400 dark:text-neutral-300" />
            </div>
            <p className="text-neutral-500 dark:text-neutral-300">Please sign in to view your transactions</p>
            <Button
              onClick={onSignInClick}
              className="mt-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-emerald-800/80 dark:hover:bg-emerald-700/90"
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
      <Card className="border-0 bg-white/60 dark:bg-[#1a1e24]/90 backdrop-blur-sm">
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 rounded-full bg-neutral-100 dark:bg-[#2a303a]">
              <WalletIcon className="h-6 w-6 text-neutral-400 dark:text-neutral-300" />
            </div>
            <p className="text-neutral-500 dark:text-neutral-300">No transactions this month</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-white/60 dark:bg-[#1a1e24]/90 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-6 hover:bg-neutral-50/50 dark:hover:bg-[#2a303a]/70 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-2.5 rounded-full ${entry.type === "income"
                    ? "bg-emerald-50 dark:bg-emerald-900/70"
                    : "bg-red-50 dark:bg-red-900/70"
                    }`}
                >
                  {entry.type === "income" ? (
                    <ArrowUpIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 text-red-500 dark:text-red-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">
                    {entry.description || "No description"}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                    <span>
                      {new Date(entry.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    {entry.source && (
                      <>
                        <span>•</span>
                        <span className="capitalize">{entry.source.replace('_', ' ')}</span>
                      </>
                    )}
                    {entry.currency && entry.currency !== 'ARS' && (
                      <>
                        <span>•</span>
                        <span>{entry.currency}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">                <p
                className={`font-semibold ${entry.type === "income"
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-neutral-400 hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400"
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