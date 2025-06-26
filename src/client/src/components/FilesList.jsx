import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { FileIcon, TrashIcon, UserIcon } from "lucide-react";
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
      let url = "/budget/files";
      const params = new URLSearchParams();
      params.append("limit", pagination.limit);
      params.append("offset", pagination.offset);
      url += `?${params.toString()}`;

      const response = await api.get(url);

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
      <Card className="border-0 bg-white/60 dark:bg-[#1a1e24]/90 backdrop-blur-sm">
        <CardContent>
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="p-4 rounded-full bg-neutral-100 dark:bg-[#2a303a]">
              <UserIcon className="h-6 w-6 text-neutral-400 dark:text-neutral-300" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                Sign in to view your files
              </h3>
              <p className="text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                You need to be signed in to view the list of your uploaded files.
              </p>
            </div>
            <Button
              onClick={onSignInClick}
              className="mt-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-emerald-800/80 dark:hover:bg-emerald-700/90"
              size="lg"
            >
              Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-white/60 dark:bg-[#1a1e24]/90 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
              Uploaded Files
            </h3>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-e-transparent align-[-0.125em] text-neutral-400"></div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">Loading files...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-3 rounded-md">
              {error}
            </div>
          )}

          {!loading && files.length === 0 && !error && (
            <div className="text-center py-8">
              <FileIcon className="h-12 w-12 mx-auto text-neutral-300 dark:text-neutral-600" />
              <p className="text-neutral-500 dark:text-neutral-400 mt-2">No files uploaded yet</p>
            </div>
          )}

          {files.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead className="w-20 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map((file) => (
                    <TableRow key={file.id}>                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileIcon className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                          <span className="text-white">{file.file_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-white">{formatDate(file.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteFile(file.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
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
            <div className="flex justify-between items-center mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.offset === 0}
                onClick={() => setPagination({
                  ...pagination,
                  offset: Math.max(0, pagination.offset - pagination.limit)
                })}
              >
                Previous
              </Button>
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
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
