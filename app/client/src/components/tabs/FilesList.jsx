import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
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
  currency = "ARS"
}) {

  const getCurrencyName = (currency) => {
    const names = {
      'USD': 'US Dollar',
      'EUR': 'Euro',
      'BRL': 'Brazilian Real',
      'ARS': 'Argentine Peso'
    };
    return names[currency] || currency;
  };

  const formatDate = (dateString) => {
    return formatDateSafe(dateString, 'MMM dd, yyyy');
  };

  const handleDeleteFile = async (fileId) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      const response = await api.delete(`/budget/file/${fileId}`);

      if (!response.error) {
        if (onFileDeleted) onFileDeleted();
      } else {
        console.error("Error deleting file:", response.error);
      }
    } catch (err) {
      console.error("Error deleting file:", err);
    }
  };

  return (
    <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card))] backdrop-blur-sm shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[hsl(var(--accent)/0.1)] border border-[hsl(var(--accent)/0.2)]">
              <FolderIcon className="h-5 w-5 text-[hsl(var(--accent))]" />
            </div>
            <CardTitle className="text-xl font-semibold text-[hsl(var(--card-foreground))]">
              Bank Statements
            </CardTitle>
          </div>
          <div className="flex items-center gap-2 bg-[hsl(var(--accent)/0.1)] text-[hsl(var(--accent))] px-3 py-1.5 rounded-full border border-[hsl(var(--accent)/0.2)]">
            <CircleDollarSignIcon className="h-4 w-4" />
            <span className="text-sm font-medium">{currency}</span>
            <span className="text-xs opacity-75">({getCurrencyName(currency)})</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          {loading && (
            <div className="text-center py-8 sm:py-12">
              <Spinner size="lg" className="mx-auto mb-3" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading your files...</p>
            </div>
          )}

          {error && (
            <div className="bg-[hsl(var(--destructive)/0.1)] border border-[hsl(var(--destructive)/0.3)] text-[hsl(var(--destructive))] p-3 sm:p-4 rounded-lg shadow-sm text-sm sm:text-base">
              {error}
            </div>
          )}

          {!loading && files.length === 0 && !error && (
            <div className="text-center py-6 sm:py-12 px-2">
              <div className="p-3 sm:p-4 rounded-full bg-[hsl(var(--muted))] inline-flex mx-auto">
                <FileIcon className="h-6 w-6 sm:h-8 sm:w-8 text-[hsl(var(--muted-foreground))]" />
              </div>
              <p className="text-[hsl(var(--foreground))] mt-3 sm:mt-4 text-base sm:text-lg">No {currency} files available</p>
              <p className="text-[hsl(var(--muted-foreground))] mt-2 max-w-md mx-auto text-sm sm:text-base">
                You're currently viewing files in <span className="font-medium">{currency}</span> currency.
              </p>
            </div>
          )}

          {files.length > 0 && (
            <div className="divide-y divide-[hsl(var(--border))]">
              {files.map((file) => (
                <div 
                  key={file.id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-6 hover:bg-[hsl(var(--accent)/0.1)] transition-colors"
                >
                  <div className="flex items-start gap-3 sm:gap-4 w-full sm:w-auto">
                    <div className="p-2 sm:p-3 rounded-xl flex-shrink-0 bg-[hsl(var(--accent)/0.1)]">
                      <FileIcon className="h-4 w-4 sm:h-5 sm:w-5 text-[hsl(var(--accent))]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                        <p className="font-medium text-[hsl(var(--foreground))] mr-1 text-sm sm:text-base">
                          {file.file_name || "Unnamed file"}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-[hsl(var(--muted-foreground))] mt-1">
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
                      className="ml-auto h-8 w-8 p-0 flex items-center justify-center rounded-full hover:bg-[hsl(var(--destructive)/0.1)] hover:text-[hsl(var(--destructive))]"
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
            <div className="flex justify-between items-center mt-6 bg-[hsl(var(--card))] p-2 sm:p-3 rounded-lg text-xs sm:text-sm border border-[hsl(var(--border))]">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.offset === 0}
                onClick={() => onPaginationChange({
                  ...pagination,
                  offset: Math.max(0, pagination.offset - pagination.limit)
                })}
                className="border-0 bg-[hsl(var(--background))] shadow-sm h-8 px-2 sm:px-3 text-xs sm:text-sm text-[hsl(var(--foreground))]"
              >
                Previous
              </Button>
              <span className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] px-1">
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
                className="border-0 bg-[hsl(var(--background))] shadow-sm h-8 px-2 sm:px-3 text-xs sm:text-sm text-[hsl(var(--foreground))]"
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