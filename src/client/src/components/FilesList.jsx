import SignInPrompt from "@/components/SignInPrompt";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateSafe } from "@/lib/date-utils";
import { api } from "@/services/api";
import { CalendarIcon, FileIcon, FolderIcon, TrashIcon } from "lucide-react";

export default function FilesList({
  isAuthenticated,
  onSignInClick,
  onFileDeleted,
  files = [],
  loading = false,
  error = null,
  pagination = { limit: 50, offset: 0, total: 0 },
  onPaginationChange
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
        <CardTitle className="text-lg font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <FolderIcon className="h-5 w-5 text-emerald-500" />
          Bank Statements
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-solid border-emerald-500 border-r-transparent align-[-0.125em]"></div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-4">Loading your files...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-lg shadow-sm">
              {error}
            </div>
          )}

          {!loading && files.length === 0 && !error && (
            <div className="text-center py-12">
              <div className="p-4 rounded-full bg-neutral-100 dark:bg-[#2a303a] inline-flex mx-auto">
                <FileIcon className="h-8 w-8 text-neutral-400 dark:text-neutral-500" />
              </div>
              <p className="text-neutral-600 dark:text-neutral-400 mt-4 text-lg">No files uploaded yet</p>
              <p className="text-neutral-500 dark:text-neutral-500 mt-2 max-w-md mx-auto">
                Use the Import tab to upload bank statements and track your transactions
              </p>
            </div>
          )}

          {files.length > 0 && (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {files.map((file) => (
                <div 
                  key={file.id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 hover:bg-neutral-50 dark:hover:bg-[#212630] transition-colors"
                >
                  <div className="flex items-start gap-4 w-full sm:w-auto">
                    <div className="p-3 rounded-xl flex-shrink-0 bg-neutral-100 dark:bg-[#2a303a]">
                      <FileIcon className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-neutral-900 dark:text-neutral-100 mr-auto">
                        {file.file_name || "Unnamed file"}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3.5 w-3.5 opacity-70" />
                          <span>
                            {formatDate(file.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-4 w-full sm:w-auto mt-4 sm:mt-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto sm:ml-4 text-neutral-400 hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => handleDeleteFile(file.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pagination.total > pagination.limit && (
            <div className="flex justify-between items-center mt-6 bg-white/50 dark:bg-[#1e232a]/50 p-3 rounded-lg">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.offset === 0}
                onClick={() => onPaginationChange({
                  ...pagination,
                  offset: Math.max(0, pagination.offset - pagination.limit)
                })}
                className="border-0 bg-white dark:bg-[#252b36] shadow-sm"
              >
                Previous
              </Button>
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} files
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.offset + pagination.limit >= pagination.total}
                onClick={() => onPaginationChange({
                  ...pagination,
                  offset: pagination.offset + pagination.limit
                })}
                className="border-0 bg-white dark:bg-[#252b36] shadow-sm"
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