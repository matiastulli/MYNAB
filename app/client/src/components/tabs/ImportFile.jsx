import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, Eyebrow } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { BANK_FORMATS as bankFormats, BANK_LABELS, bankMonogram, banksForCurrency } from "@/lib/banks";
import { getCurrencyName } from "@/lib/currencyUtils";
import { fadeUp, listItem, listParent, snappy } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";
import {
  BankIcon, CheckCircleIcon, CheckIcon, CloudArrowUpIcon, FileCsvIcon, FileIcon, FilePdfIcon, FileXlsIcon,
  UploadSimpleIcon, XCircleIcon, XIcon
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

const FORMAT_ICONS = { ".xlsx": FileXlsIcon, ".xls": FileXlsIcon, ".csv": FileCsvIcon, ".pdf": FilePdfIcon };

export default function ImportFile({ onImportComplete, onImportSuccess, currency }) {
  const [file, setFile] = useState(null);
  const [bankName, setBankName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    // Reset previous results when file changes
    setResult(null);
    setError(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setResult(null);
      setError(null);
    }
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Strip the "data:<mime>;base64," prefix
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !bankName) {
      setError("Please select both a bank and a file to upload");
      return;
    }

    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      const base64File = await convertFileToBase64(file);

      const response = await api.post("/budget/import-file", {
        bank_name: bankName,
        file_content: base64File,
        file_name: file.name,
        currency: currency
      });

      if (response.error) {
        throw new Error(response.error || "Failed to import file");
      }

      const resultData = {
        message: response.message || "Import successful",
        count: response.imported_count || 0,
        skipped: response.skipped_count || 0,
      };

      setResult(resultData);

      // Show the success state briefly, then refresh data and redirect
      setTimeout(() => {
        setFile(null);
        setBankName("");
        setResult(null);

        if (onImportComplete) {
          onImportComplete();
        }

        if (onImportSuccess) {
          onImportSuccess(resultData);
        }
      }, 1500);

    } catch (err) {
      setError(err.message || "An error occurred during import");
    } finally {
      setIsUploading(false);
    }
  };

  const filteredBankKeys = banksForCurrency(currency);
  const selectedBank = bankName ? bankFormats[bankName] : null;
  const FileGlyph = (selectedBank && FORMAT_ICONS[selectedBank.format]) || FileIcon;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <Card className="p-6 md:p-8">
        <AnimatePresence mode="wait" initial={false}>
          {result ? (
            <motion.div key="done" {...fadeUp} className="flex min-h-[420px] flex-col items-start justify-center gap-6">
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 14 }}
                className="grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent"
              >
                <CheckIcon className="size-6" weight="bold" />
              </motion.span>
              <div className="flex flex-col gap-2">
                <h3 className="text-2xl font-semibold tracking-tight">
                  <span className="figure">{result.count}</span> transactions imported
                </h3>
                <p className="text-[15px] text-muted-foreground">
                  {result.skipped > 0 ? <><span className="figure">{result.skipped}</span> duplicates skipped. </> : null}
                  Taking you to Activity.
                </p>
              </div>
              <div className="h-1 w-48 overflow-hidden rounded-full bg-muted">
                <motion.div className="h-full bg-accent" initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }} />
              </div>
            </motion.div>
          ) : (
            <motion.form key="form" {...fadeUp} onSubmit={handleSubmit} className="flex flex-col gap-8">
              <div className="flex flex-col gap-1.5">
                <Eyebrow>Import · {currency}</Eyebrow>
                <h2 className="text-xl font-semibold tracking-tight">Bring in a bank statement</h2>
              </div>

              {/* Step 1 - bank */}
              <fieldset className="flex flex-col gap-3">
                <legend className="mb-3 flex items-center gap-2.5 text-[13px] font-medium">
                  <StepNumber n={1} done={!!bankName} />
                  Choose the bank
                </legend>
                {filteredBankKeys.length === 0 ? (
                  <EmptyState icon={BankIcon} title={`No supported banks for ${currency} yet`} className="rounded-2xl border border-dashed border-border px-5 py-8 md:px-6">
                    Switch to another currency from the sidebar to import from Santander, ICBC, Mercado Pago, BBVA, CommBank or Revolut.
                  </EmptyState>
                ) : (
                  <motion.div variants={listParent} initial="hidden" animate="show" role="radiogroup" aria-label="Bank" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {filteredBankKeys.map((key) => {
                      const bank = bankFormats[key];
                      const active = bankName === key;
                      return (
                        <motion.button
                          key={key}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          variants={listItem}
                          onClick={() => setBankName(key)}
                          className={cn(
                            "relative flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors duration-200 active:scale-[0.99]",
                            active ? "border-foreground/80 bg-card" : "border-border hover:border-foreground/25"
                          )}
                        >
                          <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl text-sm font-semibold transition-colors", active ? "bg-foreground text-background" : "bg-muted text-muted-foreground")}>
                            {bankMonogram(BANK_LABELS[key] || key)}
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col leading-tight">
                            <span className="text-sm font-medium">{BANK_LABELS[key] || key}</span>
                            <span className="truncate text-xs text-muted-foreground">{bank.description}</span>
                          </span>
                          <span className="font-mono figure shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                            {bank.format.replace(".", "")}
                          </span>
                          {active && (
                            <motion.span layoutId="bank-check" transition={snappy} className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-foreground text-background">
                              <CheckIcon className="size-3" weight="bold" />
                            </motion.span>
                          )}
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}
              </fieldset>

              {/* Step 2 - file */}
              <fieldset className="flex flex-col gap-3">
                <legend className="mb-3 flex items-center gap-2.5 text-[13px] font-medium">
                  <StepNumber n={2} done={!!file} />
                  Add the statement file
                </legend>
                <div
                  className={cn(
                    "relative rounded-[1.5rem] border-[1.5px] border-dashed transition-[border-color,background-color,transform] duration-300",
                    isDragging ? "scale-[1.01] border-accent bg-accent-soft/50" : file ? "border-border bg-muted/40" : "border-border hover:border-foreground/30 hover:bg-muted/30"
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {!file ? (
                    <label htmlFor="importFile" className="flex cursor-pointer flex-col items-center gap-4 px-6 py-10 text-center">
                      <motion.span
                        animate={isDragging ? { y: -4, scale: 1.05 } : { y: 0, scale: 1 }}
                        transition={snappy}
                        className="grid size-14 place-items-center rounded-2xl border border-border bg-card text-muted-foreground shadow-[var(--shadow-diffuse)]"
                      >
                        <CloudArrowUpIcon className="size-6" />
                      </motion.span>
                      <span className="flex flex-col gap-1">
                        <span className="text-[15px] font-medium">Drop the file here or <span className="text-accent underline underline-offset-4">browse</span></span>
                        <span className="text-xs text-muted-foreground">
                          {selectedBank ? `${BANK_LABELS[bankName]} expects a ${selectedBank.format} file` : "Pick a bank first to see the expected format"}
                        </span>
                      </span>
                      <input id="importFile" type="file" accept=".xlsx,.xls,.csv,.pdf" onChange={handleFileChange} className="sr-only" />
                    </label>
                  ) : (
                    <div className="flex items-center gap-4 p-4 md:p-5">
                      <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-border bg-card text-foreground">
                        <FileGlyph className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium">{file.name}</p>
                        <p className="figure mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                          <span className="text-border">/</span>
                          <span className="flex items-center gap-1 font-sans text-accent"><CheckCircleIcon className="size-3.5" weight="fill" /> Ready</span>
                        </p>
                      </div>
                      <Button type="button" variant="ghost" size="icon-sm" onClick={() => setFile(null)} aria-label="Remove file">
                        <XIcon />
                      </Button>
                    </div>
                  )}
                </div>
              </fieldset>

              {error && (
                <Alert variant="destructive">
                  <XCircleIcon weight="fill" />
                  <div>
                    <AlertTitle>The import did not go through</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </div>
                </Alert>
              )}

              <div className="flex flex-col gap-3 border-t border-border/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Duplicates across files are skipped automatically.
                </p>
                <Button
                  type="submit"
                  size="xl"
                  className="w-full sm:w-auto"
                  loading={isUploading}
                  loadingText="Reading statement"
                  disabled={!file || !bankName}
                >
                  <UploadSimpleIcon />
                  Import statement
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </Card>

      <div className="flex flex-col gap-4">
        <Card className="p-6 md:p-7">
          <Eyebrow>Before you upload</Eyebrow>
          <ul className="mt-5 flex flex-col divide-y divide-border/70 text-[13px]">
            {[
              "The file is the original export from your bank, not edited or re-saved.",
              "Columns are in the layout the bank produces.",
              <>Every movement in it is in <span className="font-medium text-foreground">{currency}</span> ({getCurrencyName(currency)}).</>,
            ].map((text, i) => (
              <li key={i} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                <span className="font-mono figure mt-px shrink-0 text-[11px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                <span className="leading-relaxed text-muted-foreground">{text}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-6 md:p-7">
          <Eyebrow>What happens next</Eyebrow>
          <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
            Each line is matched to a category by its description, then saved with a link to the file. Delete the
            file from Statements later and its transactions go with it.
          </p>
        </Card>
      </div>
    </div>
  );
}

function StepNumber({ n, done }) {
  return (
    <span className={cn("figure grid size-6 place-items-center rounded-full text-[11px] font-semibold transition-colors duration-300", done ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground")}>
      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.span key="d" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={snappy}>
            <CheckIcon className="size-3" weight="bold" />
          </motion.span>
        ) : (
          <motion.span key="n" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{n}</motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
