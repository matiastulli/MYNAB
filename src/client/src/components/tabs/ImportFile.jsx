import SignInPrompt from "@/components/auth_user/SignInPrompt";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/services/api";
import { BanknotesIcon, CheckCircleIcon, CircleDollarSignIcon, CreditCardIcon, FileIcon, FileTextIcon, UploadCloudIcon, UploadIcon, XCircleIcon } from "lucide-react";
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

  const getCurrencyName = (currency) => {
    const names = {
      'USD': 'US Dollar',
      'EUR': 'Euro',
      'BRL': 'Brazilian Real',
      'ARS': 'Argentine Peso'
    };
    return names[currency] || currency;
  };

  const getBankIcon = (bankName) => {
    switch(bankName) {
      case 'santander_rio':
        return <div className="w-3 h-3 bg-red-500 rounded-full"></div>;
      case 'ICBC':
        return <CreditCardIcon className="h-3 w-3 text-gray-600" />;
      case 'mercado_pago':
        return <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>;
      default:
        return <BanknotesIcon className="h-3 w-3 text-muted-foreground" />;
    }
  };

  // Bank-specific supported formats and their default currencies
  const bankFormats = {
    santander_rio: { format: ".xlsx", defaultCurrency: "ARS", description: "Excel format from online banking" },
    ICBC: { format: ".csv", defaultCurrency: "ARS", description: "CSV export from ICBC portal" },
    mercado_pago: { format: ".pdf", defaultCurrency: "ARS", description: "PDF statement download" }
  };

  const getSupportedFormatText = () => {
    if (!bankName) {
      return "Select a bank to see supported formats";
    }
    const bank = bankFormats[bankName];
    return `${bank.format} format - ${bank.description}`;
  };

  // Use the SignInPrompt component for unauthenticated users
  if (!isAuthenticated) {
    return (
      <SignInPrompt
        title="Sign in to import transactions"
        description="You need to be signed in to import your transactions from Excel, CSV or PDF files."
        onSignInClick={onSignInClick}
        icon={<UploadIcon className="h-6 w-6 text-neutral-400 dark:text-neutral-300" />}
      />
    );
  }

  return (
    <Card className="border-border bg-card backdrop-blur-sm shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
              <UploadIcon className="h-5 w-5 text-accent" />
            </div>
            <CardTitle className="text-xl font-semibold text-foreground">
              Import Statements
            </CardTitle>
          </div>
          <div className="flex items-center gap-2 bg-accent/10 text-accent px-3 py-1.5 rounded-full border border-accent/20">
            <CircleDollarSignIcon className="h-4 w-4" />
            <span className="text-sm font-medium">{currency}</span>
            <span className="text-xs opacity-75">({getCurrencyName(currency)})</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {result ? (
          <div className="flex flex-col items-center py-12 gap-6">
            <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800">
              <CheckCircleIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-foreground">Import Successful!</h3>
              <p className="text-muted-foreground max-w-md">
                {result.message} - {result.count} transactions have been imported to your account.
              </p>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              Redirecting to your transactions in a moment...
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Bank Selection */}
            <div className="space-y-3">
              <Label htmlFor="bank" className="text-sm font-semibold text-foreground">
                Select Bank *
              </Label>
              <Select value={bankName} onValueChange={setBankName}>
                <SelectTrigger className="h-12 border-2 border-border bg-background focus:border-accent">
                  <SelectValue placeholder="Choose your bank or financial institution" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-2 border-border shadow-xl">
                  <SelectItem value="santander_rio" className="text-popover-foreground py-3">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-full bg-red-100 dark:bg-red-900/20">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      </div>
                      <div>
                        <div className="font-medium">Santander Rio</div>
                        <div className="text-xs text-muted-foreground">Excel (.xlsx) format</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="ICBC" className="text-popover-foreground py-3">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-900/20">
                        <CreditCardIcon className="h-3 w-3 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium">ICBC</div>
                        <div className="text-xs text-muted-foreground">CSV (.csv) format</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="mercado_pago" className="text-popover-foreground py-3">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-full bg-yellow-100 dark:bg-yellow-900/20">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      </div>
                      <div>
                        <div className="font-medium">Mercado Pago</div>
                        <div className="text-xs text-muted-foreground">PDF (.pdf) format</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {bankName && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <FileTextIcon className="h-3 w-3" />
                  {getSupportedFormatText()}
                </p>
              )}
            </div>

            {/* File Upload */}
            <div className="space-y-3">
              <Label htmlFor="importFile" className="text-sm font-semibold text-foreground">
                Statement File *
              </Label>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                  isDragging
                    ? 'border-accent bg-accent/5 scale-[1.02]'
                    : file 
                    ? 'border-accent/50 bg-accent/5'
                    : 'border-border hover:border-accent/40 hover:bg-accent/5'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {!file ? (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="p-4 rounded-full bg-accent/10 border border-accent/20">
                      <UploadCloudIcon className="h-10 w-10 text-accent" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-medium text-foreground">
                        Drag & drop your statement file here
                      </p>
                      <p className="text-sm text-muted-foreground">
                        or click the button below to browse
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {bankName ? getSupportedFormatText() : "Select a bank first to see supported formats"}
                      </p>
                    </div>
                    <label htmlFor="importFile" className="cursor-pointer bg-accent hover:bg-accent/90 text-accent-foreground font-medium px-6 py-2.5 rounded-lg text-sm transition-all duration-200 shadow-md hover:shadow-lg">
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
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                      <FileIcon className="h-10 w-10 text-accent" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="font-semibold text-foreground text-lg">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024).toFixed(2)} KB • {file.type || "Unknown format"}
                      </p>
                      <div className="flex items-center justify-center gap-2 text-xs text-accent">
                        <CheckCircleIcon className="h-3 w-3" />
                        <span>File ready for import</span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFile(null)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Choose Different File
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800 shadow-lg">
                <XCircleIcon className="h-5 w-5" />
                <AlertTitle className="text-red-900 dark:text-red-100 font-semibold">Import Failed</AlertTitle>
                <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
              </Alert>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Before importing your file
              </h4>
              <ul className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed space-y-1">
                <li>• Make sure your statement file matches the selected bank format</li>
                <li>• Check that the file contains transaction data in the expected columns</li>
                <li>• Duplicate transactions will be automatically detected and skipped</li>
                <li>• All imported transactions will use the currency: <strong>{currency}</strong></li>
              </ul>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isUploading || !file || !bankName}
              className="w-full h-14 text-lg font-semibold bg-accent hover:bg-accent/90 text-accent-foreground transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 border-2 border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing Import...</span>
                </div>
              ) : (
                <>
                  <UploadIcon className="h-5 w-5 mr-2" />
                  Import {file ? `${file.name}` : 'Statement File'}
                </>
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}