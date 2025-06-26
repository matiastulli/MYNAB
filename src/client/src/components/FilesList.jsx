import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SignInPrompt from "@/components/SignInPrompt";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/services/api";
import { format } from "date-fns";
import { FileIcon, FolderIcon, TrashIcon } from "lucide-react";
import { useEffect, useState } from "react";

export default function FilesList({ 
  isAuthenticated, 
  onSignInClick,
  onFileDeleted
}) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    total: 0
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchFiles();
    }
  }, [isAuthenticated, pagination.offset, pagination.limit]);

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = "/budget/files";
      
      // Send limit and offset in the request body instead of URL parameters
      const response = await api.post(url, {
        limit: pagination.limit,
        offset: pagination.offset
      });

      if (!response.error) {
        setFiles(response.data || []);
        setPagination({
          ...pagination,
          total: response.metadata?.total_count || 0
        });
      } else {
        setError(response.error);
        setFiles([]);
      }
    } catch (err) {
      setError("Failed to load files. Please try again.");
      console.error("Error fetching files:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      const response = await api.delete(`/budget/file/${fileId}`);
      
      if (!response.error) {
        fetchFiles();
        if (onFileDeleted) onFileDeleted();
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError("Failed to delete file. Please try again.");
      console.error("Error deleting file:", err);
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return dateString;
    }
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
          Uploaded Files
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
            <div className="bg-white dark:bg-[#212630] rounded-lg overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-neutral-200 dark:border-neutral-800">
                    <TableHead className="font-medium text-neutral-600 dark:text-neutral-300">File</TableHead>
                    <TableHead className="font-medium text-neutral-600 dark:text-neutral-300">Upload Date</TableHead>
                    <TableHead className="w-20 text-right font-medium text-neutral-600 dark:text-neutral-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map((file) => (
                    <TableRow key={file.id} className="hover:bg-neutral-50 dark:hover:bg-[#252b36] border-0">
                      <TableCell className="py-4 font-medium">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-md bg-neutral-100 dark:bg-[#2a303a]">
                            <FileIcon className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                          </div>
                          <span className="text-neutral-900 dark:text-white text-sm">{file.file_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-neutral-600 dark:text-neutral-400 text-sm">{formatDate(file.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteFile(file.id)}
                          className="text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:text-neutral-500 dark:hover:text-red-400 dark:hover:bg-red-900/20"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {pagination.total > pagination.limit && (
            <div className="flex justify-between items-center mt-6 bg-white/50 dark:bg-[#1e232a]/50 p-3 rounded-lg">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.offset === 0}
                onClick={() => setPagination({
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
                onClick={() => setPagination({
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
                variant="outline"
                size="sm"
                disabled={pagination.offset + pagination.limit >= pagination.total}
                onClick={() => setPagination({
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
