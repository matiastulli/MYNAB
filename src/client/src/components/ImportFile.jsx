import SignInPrompt from "@/components/SignInPrompt"; // Import the reusable component
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
  <Card className="border-0 bg-white/80 dark:bg-[#1a1e24]/80 backdrop-blur-sm shadow-sm">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
        <UploadIcon className="h-5 w-5 text-emerald-500" />
        Import Statements
      </CardTitle>
    </CardHeader>
    <CardContent className="p-6">
      {/* Currency Notice Alert */}
      <Alert className="mb-6 bg-blue-50/80 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 text-blue-800 dark:text-blue-300">
        <div className="flex items-center gap-2">
          <CircleDollarSignIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle>Currency filter is set to {currency}</AlertTitle>
        </div>
        <AlertDescription className="text-blue-700 dark:text-blue-200 mt-1">
          You're currently viewing {currency} transactions. Make sure the statement you're uploading contains transactions in this currency.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="bank" className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
            Select Bank
          </Label>
          <Select value={bankName} onValueChange={setBankName}>
            <SelectTrigger
              id="bank"
              className="border-0 bg-white dark:bg-[#2a303a] focus:bg-white dark:focus:bg-[#353b47] h-[42px] text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-200"
            >
              <SelectValue
                placeholder="Select your bank"
                className="text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-200"
              />
            </SelectTrigger>
            <SelectContent className="dark:bg-[#1e232a] dark:border-neutral-700">
              <SelectItem value="santander_rio" className="text-neutral-900 dark:text-white">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  Santander Rio
                </div>
              </SelectItem>
              <SelectItem value="ICBC" className="text-neutral-900 dark:text-white">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white dark:bg-neutral-200 rounded-full"></div>
                  ICBC
                </div>
              </SelectItem>
              <SelectItem value="mercado_pago" className="text-neutral-900 dark:text-white">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  Mercado Pago
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          {/* Currency mismatch warning */}
          {isCurrencyMismatch && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              This bank typically uses {bankFormats[bankName].defaultCurrency}, but your currency filter is set to {currency}.
            </p>
          )}
          
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Tip: When naming your file, include the bank name and date (e.g., "santander_rio_202404") to easily identify it later.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="importFile" className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
            Statement File
          </Label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center ${isDragging
              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10'
              : 'border-neutral-200 dark:border-neutral-700 hover:border-emerald-400 dark:hover:border-emerald-700'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {!file ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="p-3 rounded-full bg-neutral-100 dark:bg-[#2a303a]">
                  <UploadCloudIcon className="h-8 w-8 text-neutral-500 dark:text-neutral-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Drag & drop your file here or
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {getSupportedFormatText()}
                  </p>
                </div>
                <label htmlFor="importFile" className="cursor-pointer bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-medium px-4 py-2 rounded-lg text-sm transition-colors inline-block">
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
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <FileIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="font-medium text-neutral-900 dark:text-white">{file.name}</p>
                  <p className="text-xs text-neutral-500 mt-1">{(file.size / 1024).toFixed(2)} KB • {file.type || "unknown type"}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFile(null)}
                  className="text-neutral-600 dark:text-neutral-400 border-0"
                >
                  Change
                </Button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="dark:bg-red-900/30 dark:border-red-800 border shadow-sm">
            <XCircleIcon className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert className="dark:bg-emerald-900/30 dark:border-emerald-800 border shadow-sm">
            <CheckCircleIcon className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              {result.message} ({result.count} transactions imported)
            </AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          disabled={isUploading || !file || !bankName}
          className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white transition-colors h-12"
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
