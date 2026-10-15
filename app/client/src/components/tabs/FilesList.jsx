import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { formatDateSafe } from "@/lib/dateUtils";
import { listItem, listParent, snappy } from "@/lib/motion";
import { api } from "@/services/api";
import { FileCsvIcon, FileIcon, FilePdfIcon, FileXlsIcon, FolderSimpleIcon, TrashIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

const iconFor = (name = "") => {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "xlsx" || ext === "xls") return FileXlsIcon;
  if (ext === "csv") return FileCsvIcon;
  if (ext === "pdf") return FilePdfIcon;
  return FileIcon;
};

export default function FilesList({
  onFileDeleted,
  onImportClick,
  files = [],
  loading = false,
  error = null,
  pagination = { limit: 50, offset: 0, total: 0 },
  onPaginationChange,
  currency = "ARS"
}) {
  const [confirmId, setConfirmId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const handleDeleteFile = async (fileId) => {
    setConfirmId(null);
    setDeletingId(fileId);
    setDeleteError(null);
    try {
      const response = await api.delete(`/budget/file/${fileId}`);

      if (!response.error) {
        if (onFileDeleted) onFileDeleted();
      } else {
        console.error("Error deleting file:", response.error);
        setDeleteError("The file could not be deleted. Try again.");
      }
    } catch (err) {
      console.error("Error deleting file:", err);
      setDeleteError("The file could not be deleted. Try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-end justify-between gap-4 border-b border-border/70 px-5 pb-5 pt-6 md:px-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-tight">Statements</h2>
          <p className="text-[13px] text-muted-foreground">
            Imported {currency} files. Deleting one also removes its transactions.
          </p>
        </div>
        {onImportClick && files.length > 0 && (
          <Button variant="outline" size="sm" onClick={onImportClick}>
            <UploadSimpleIcon />
            <span className="hidden sm:inline">Import</span>
          </Button>
        )}
      </div>

      {(error || deleteError) && (
        <p role="alert" className="border-b border-border/70 bg-destructive-soft px-5 py-3 text-[13px] font-medium text-destructive md:px-8">
          {error || deleteError}
        </p>
      )}

      {loading && files.length === 0 && (
        <div className="divide-y divide-border/60">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-5 md:px-8">
              <Skeleton className="size-11 rounded-2xl" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4" style={{ width: `${48 - i * 8}%` }} />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && files.length === 0 && !error && (
        <EmptyState
          icon={FolderSimpleIcon}
          title={`No ${currency} statements yet`}
          action={onImportClick && (
            <Button onClick={onImportClick}>
              <UploadSimpleIcon />
              Import a statement
            </Button>
          )}
        >
          Files you import in {currency} are listed here with how many transactions each one added.
        </EmptyState>
      )}

      {files.length > 0 && (
        <motion.ul variants={listParent} initial="hidden" animate="show" className="divide-y divide-border/60">
          {files.map((file) => {
            const Glyph = iconFor(file.file_name);
            const confirming = confirmId === file.id;
            return (
              <motion.li
                key={file.id}
                variants={listItem}
                className="group flex items-center gap-4 px-5 py-4 transition-colors duration-200 hover:bg-muted/45 md:px-8"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-muted text-muted-foreground">
                  <Glyph className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium">{file.file_name || "Unnamed file"}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                    <span className="figure">{formatDateSafe(file.created_at, 'MMM dd, yyyy')}</span>
                    {file.imported_count ? (
                      <>
                        <span className="text-border">/</span>
                        <span><span className="figure">{file.imported_count}</span> transactions</span>
                      </>
                    ) : null}
                  </p>
                </div>

                <AnimatePresence mode="popLayout" initial={false}>
                  {confirming ? (
                    <motion.div
                      key="confirm"
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={snappy}
                      className="flex items-center gap-1"
                    >
                      <Button variant="ghost" size="xs" onClick={() => setConfirmId(null)}>Keep</Button>
                      <Button variant="destructive" size="xs" onClick={() => handleDeleteFile(file.id)}>Delete file</Button>
                    </motion.div>
                  ) : (
                    <motion.div key="trash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Button
                        variant="destructive-ghost"
                        size="icon-sm"
                        className="opacity-60 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                        onClick={() => setConfirmId(file.id)}
                        disabled={deletingId === file.id}
                        aria-label={`Delete ${file.file_name || "file"}`}
                      >
                        {deletingId === file.id ? <Spinner size="xs" /> : <TrashIcon />}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </motion.ul>
      )}

      {pagination.total > pagination.limit && (
        <div className="flex items-center justify-between gap-3 border-t border-border/70 px-5 py-4 md:px-8">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.offset === 0}
            onClick={() => onPaginationChange({
              ...pagination,
              offset: Math.max(0, pagination.offset - pagination.limit)
            })}
          >
            Previous
          </Button>
          <span className="figure text-xs text-muted-foreground">
            {pagination.offset + 1}–{Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.offset + pagination.limit >= pagination.total}
            onClick={() => onPaginationChange({
              ...pagination,
              offset: pagination.offset + pagination.limit
            })}
          >
            Next
          </Button>
        </div>
      )}
    </Card>
  );
}
