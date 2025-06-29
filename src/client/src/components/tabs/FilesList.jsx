import SignInPrompt from "@/components/auth_user/SignInPrompt";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateSafe } from "@/lib/dateUtils";
import { api } from "@/services/api";
import { CalendarIcon, CircleDollarSignIcon, FileIcon, FolderIcon, TrashIcon } from "lucide-react";

export default function FilesList({
  isAuthenticated,
  onSignInClick,
  onFileDeleted,
  files = [],
  loading = false,
  error = null,
  pagination = { limit: 50, offset: 0, total: 0 },
  onPaginationChange,
  currency = "ARS" // Add currency prop
}) {
  const handleDeleteFile = async (fileId) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      const response = await api.delete(`/budget/file/${fileId}`);

      if (!response.error) {
        // Instead of fetching here, notify parent to refresh data
        if (onFileDeleted) onFileDeleted();
      } else {
        // Error handling should be done by the parent component
        console.error("Error deleting file:", response.error);
      }
    } catch (err) {
      console.error("Error deleting file:", err);
    }
  };

  // Update this function to use our safe date formatter
  const formatDate = (dateString) => {
    return formatDateSafe(dateString, 'MMM dd, yyyy');
  };

  if (!isAuthenticated) {
    return (
      <SignInPrompt
        title="Sign in to view your files"
        description="You need to be signed in to view the list of your uploaded files."
        onSignInClick={onSignInClick}
      />
    );
  }

  return (
    <Card className="border-0 bg-white/80 dark:bg-[#1a1e24]/80 backdrop-blur-sm shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
          <div className="flex items-center gap-2">
          <CardTitle className="text-lg font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <FolderIcon className="h-5 w-5 text-emerald-500" />
            Bank Statements
          </CardTitle>
          {/* Currency indicator - improved for mobile */}
          <div className="flex items-center text-xs bg-blue-50/70 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800/30 w-fit ml-0 xs:ml-2">
            <CircleDollarSignIcon className="h-3 w-3 mr-1" />
            {currency}
          </div>
        </div>
      </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          {loading && (
            <div className="text-center py-8 sm:py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-solid border-emerald-500 border-r-transparent align-[-0.125em]"></div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-4">Loading your files...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-3 sm:p-4 rounded-lg shadow-sm text-sm sm:text-base">
              {error}
            </div>
          )}

          {!loading && files.length === 0 && !error && (
            <div className="text-center py-6 sm:py-12 px-2">
              <div className="p-3 sm:p-4 rounded-full bg-neutral-100 dark:bg-[#2a303a] inline-flex mx-auto">
                <FileIcon className="h-6 w-6 sm:h-8 sm:w-8 text-neutral-400 dark:text-neutral-500" />
              </div>
              <p className="text-neutral-600 dark:text-neutral-400 mt-3 sm:mt-4 text-base sm:text-lg">No {currency} files available</p>
              <p className="text-neutral-500 dark:text-neutral-500 mt-2 max-w-md mx-auto text-sm sm:text-base">
                You're currently viewing files in <span className="font-medium">{currency}</span> currency.
              </p>
              
              {/* Currency filter notice - more compact on mobile */}
              <div className="flex items-center justify-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-md max-w-xs mx-auto mt-4 text-xs sm:text-sm">
                <CircleDollarSignIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <p className="text-blue-700 dark:text-blue-200 text-left">
                  Files are filtered based on their currency.
                </p>
              </div>
              
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white mt-4 h-9 px-3 text-sm"
                size="sm"
                onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
              >
                Change Currency Filter
              </Button>
            </div>
          )}

          {files.length > 0 && (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {files.map((file) => (
                <div 
                  key={file.id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-6 hover:bg-neutral-50 dark:hover:bg-[#212630] transition-colors"
                >
                  <div className="flex items-start gap-3 sm:gap-4 w-full sm:w-auto">
                    <div className="p-2 sm:p-3 rounded-xl flex-shrink-0 bg-neutral-100 dark:bg-[#2a303a]">
                      <FileIcon className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                        <p className="font-medium text-neutral-900 dark:text-neutral-100 mr-1 text-sm sm:text-base">
                          {file.file_name || "Unnamed file"}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 opacity-70" />
                          <span>
                            {formatDate(file.created_at)}
                          </span>
                        </div>
                        {file.imported_count && (
                          <div className="flex items-center gap-1">
                            <span>•</span>
                            <span>{file.imported_count} transactions</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto h-8 w-8 p-0 flex items-center justify-center rounded-full text-neutral-400 hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => handleDeleteFile(file.id)}
                    >
                      <TrashIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pagination.total > pagination.limit && (
            <div className="flex justify-between items-center mt-6 bg-white/50 dark:bg-[#1e232a]/50 p-2 sm:p-3 rounded-lg text-xs sm:text-sm">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.offset === 0}
                onClick={() => onPaginationChange({
                  ...pagination,
                  offset: Math.max(0, pagination.offset - pagination.limit)
                })}
                className="border-0 bg-white dark:bg-[#252b36] shadow-sm h-8 px-2 sm:px-3 text-xs sm:text-sm"
              >
                Previous
              </Button>
              <span className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 px-1">
                {pagination.offset + 1}-{Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.offset + pagination.limit >= pagination.total}
                onClick={() => onPaginationChange({
                  ...pagination,
                  offset: pagination.offset + pagination.limit
                })}
                className="border-0 bg-white dark:bg-[#252b36] shadow-sm h-8 px-2 sm:px-3 text-xs sm:text-sm"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}