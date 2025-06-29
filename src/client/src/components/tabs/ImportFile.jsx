import SignInPrompt from "@/components/auth_user/SignInPrompt";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/services/api";
import { CheckCircleIcon, CircleDollarSignIcon, FileIcon, UploadCloudIcon, UploadIcon, XCircleIcon } from "lucide-react";
import { useState } from "react";

export default function ImportFile({ onImportComplete, onImportSuccess, isAuthenticated, onSignInClick, currency }) {
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

  // Function to convert file to Base64
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove the "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64," prefix
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
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
      // Convert file to Base64
      const base64File = await convertFileToBase64(file);

      // Send the file as base64 string using the regular post method
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
      };

      setResult(resultData);

      // Show success message before redirecting
      setTimeout(() => {
        // Reset form state
        setFile(null);
        setBankName("");
        setResult(null);

        // Call the callback to refresh data and redirect
        if (onImportComplete) {
          onImportComplete();
        }

        // Redirect to main entries view
        if (onImportSuccess) {
          onImportSuccess(resultData);
        }
      }, 1500); // Show success message for 1.5 seconds before redirecting

    } catch (err) {
      setError(err.message || "An error occurred during import");
    } finally {
      setIsUploading(false);
    }
  };

  // Bank-specific supported formats and their default currencies
  const bankFormats = {
    santander_rio: { format: ".xlsx", defaultCurrency: "ARS" },
    ICBC: { format: ".csv", defaultCurrency: "ARS" },
    mercado_pago: { format: ".pdf", defaultCurrency: "ARS" }
  };

  // Get supported format text based on selected bank
  const getSupportedFormatText = () => {
    if (!bankName) {
      return "Supported formats: .xlsx, .csv, .pdf";
    }
    return `Supported format: ${bankFormats[bankName].format}`;
  };

  // Check if selected currency matches bank's default currency
  const isCurrencyMismatch = bankName && bankFormats[bankName].defaultCurrency !== currency;

  // Use the SignInPrompt component for unauthenticated users
  if (!isAuthenticated) {
    return (
      <SignInPrompt
        title="Sign in to import transactions"
        description="You need to be signed in to import your transactions from Excel or CSV or PDF files."
        onSignInClick={onSignInClick}
        icon={<UploadIcon className="h-6 w-6 text-neutral-400 dark:text-neutral-300" />}
      />
    );
  }

  return (
  <Card className="border-border bg-card backdrop-blur-sm shadow-sm">
    <CardHeader className="pb-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
          <div className="flex items-center gap-2">
        <CardTitle className="text-lg font-medium text-foreground flex items-center gap-2">
          <UploadIcon className="h-5 w-5 text-accent" />
          Import Statements
        </CardTitle>
        {/* Currency indicator - positioned next to the title */}
        <div className="flex items-center text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded border border-accent/20">
          <CircleDollarSignIcon className="h-3 w-3 mr-1" />
          {currency}
        </div>
      </div>
      </div>
    </CardHeader>
    <CardContent className="p-6">

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="bank" className="text-sm font-medium text-foreground">
            Select Bank
          </Label>
          <Select value={bankName} onValueChange={setBankName}>
            <SelectTrigger
              id="bank"
              className="border-0 bg-muted focus:bg-background h-[42px] text-foreground placeholder:text-muted-foreground"
            >
              <SelectValue
                placeholder="Select your bank"
                className="text-foreground placeholder:text-muted-foreground"
              />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="santander_rio" className="text-popover-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  Santander Rio
                </div>
              </SelectItem>
              <SelectItem value="ICBC" className="text-popover-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-foreground rounded-full"></div>
                  ICBC
                </div>
              </SelectItem>
              <SelectItem value="mercado_pago" className="text-popover-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  Mercado Pago
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          {/* Currency mismatch warning */}
          {isCurrencyMismatch && (
            <p className="text-xs badge badge-warning flex items-center mt-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              This bank typically uses {bankFormats[bankName].defaultCurrency}, but your currency filter is set to {currency}.
            </p>
          )}
          
          <p className="text-xs badge badge-info mt-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Tip: When naming your file, include the bank name and date (e.g., "santander_rio_202404") to easily identify it later.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="importFile" className="text-sm font-medium text-foreground">
            Statement File
          </Label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center ${isDragging
              ? 'border-accent bg-accent/5'
              : 'border-border hover:border-accent/40'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {!file ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="p-3 rounded-full bg-muted">
                  <UploadCloudIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Drag & drop your file here or
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getSupportedFormatText()}
                  </p>
                </div>
                <label htmlFor="importFile" className="cursor-pointer bg-accent/10 hover:bg-accent/20 text-accent font-medium px-4 py-2 rounded-lg text-sm transition-colors inline-block">
                  Browse Files
                </label>
                <Input
                  id="importFile"
                  type="file"
                  accept=".xlsx,.xls,.csv,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
                <div className="p-3 bg-accent/10 rounded-lg">
                  <FileIcon className="h-6 w-6 text-accent" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024).toFixed(2)} KB • {file.type || "unknown type"}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFile(null)}
                  className="text-muted-foreground border-0"
                >
                  Change
                </Button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/30 shadow-sm">
            <XCircleIcon className="h-4 w-4" />
            <AlertTitle className="text-destructive font-medium">Error</AlertTitle>
            <AlertDescription className="text-destructive/90">{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert className="bg-success-bg text-success-fg border-success-fg/30 shadow-sm">
            <CheckCircleIcon className="h-4 w-4" />
            <AlertTitle className="font-medium">Success</AlertTitle>
            <AlertDescription>
              {result.message} ({result.count} transactions imported)
            </AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          variant="success"
          disabled={isUploading || !file || !bankName}
          className="w-full transition-colors h-12"
        >
          {isUploading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 border-2 border-t-transparent rounded-full animate-spin"></div>
              <span>Processing...</span>
            </div>
          ) : (
            <>
              <UploadIcon className="h-5 w-5 mr-2" />
              Import Transactions
            </>
          )}
        </Button>
      </form>
    </CardContent>
  </Card>
  );
}
