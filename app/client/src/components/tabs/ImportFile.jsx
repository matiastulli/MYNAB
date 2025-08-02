import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCurrencyName } from "@/lib/currencyUtils";
import { api } from "@/services/api";
import { CheckCircleIcon, CircleDollarSignIcon, FileIcon, FileTextIcon, UploadCloudIcon, UploadIcon, XCircleIcon } from "lucide-react";
import { useState } from "react";

export default function ImportFile({ onImportComplete, onImportSuccess, isAuthenticated, onSignInClick, currency }) {
  const [file, setFile] = useState(null);
  const [bankName, setBankName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const bankFormats = {
    santander_rio: { format: ".xlsx", defaultCurrency: "ARS", description: "Excel format from online banking" },
    ICBC: { format: ".csv", defaultCurrency: "ARS", description: "CSV export from ICBC portal" },
    mercado_pago: { format: ".pdf", defaultCurrency: "ARS", description: "PDF statement download" },
    comm_bank: { format: ".csv", defaultCurrency: "AUD", description: "CSV export from Commonwealth Bank" }
  };

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
        // Remove the "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64," prefix
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

  const getSupportedFormatText = () => {
    if (!bankName) {
      return "Select a bank to see supported formats";
    }
    const bank = bankFormats[bankName];
    return `${bank.format} format - ${bank.description}`;
  };

  return (
    <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card))] backdrop-blur-sm shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[hsl(var(--accent)/0.1)] border border-[hsl(var(--accent)/0.2)]">
              <UploadIcon className="h-5 w-5 text-[hsl(var(--accent))]" />
            </div>
            <CardTitle className="text-xl font-semibold text-[hsl(var(--card-foreground))]">
              Import Statements
            </CardTitle>
          </div>
          <div className="flex items-center gap-2 bg-[hsl(var(--muted)/0.1)] text-[hsl(var(--muted-foreground))] px-3 py-1.5 rounded-full border border-[hsl(var(--muted)/0.2)]">
            <CircleDollarSignIcon className="h-4 w-4" />
            <span className="text-sm font-medium">{currency}</span>
            <span className="text-xs opacity-75">({getCurrencyName(currency)})</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {result ? (
          <div className="flex flex-col items-center py-12 gap-6">
            <div className="p-4 rounded-full bg-[hsl(var(--positive)/0.1)] border-2 border-[hsl(var(--positive)/0.2)]">
              <CheckCircleIcon className="h-8 w-8 text-[hsl(var(--positive))]" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-[hsl(var(--foreground))]">Import Successful!</h3>
              <p className="text-[hsl(var(--muted-foreground))] max-w-md">
                {result.message} - {result.count} transactions have been imported to your account.
              </p>
            </div>
            <div className="text-center text-sm text-[hsl(var(--muted-foreground))]">
              Redirecting to your transactions in a moment...
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Info Box */}
            <div className="bg-[hsl(var(--info-bg))] border-2 border-[hsl(var(--info-fg)/0.2)] rounded-lg p-4">
              <h4 className="font-semibold text-[hsl(var(--info-fg))] flex items-center gap-2 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Before Importing Your File
              </h4>
              <div className="text-[hsl(var(--info-fg)/0.85)] text-sm space-y-3">
                <p>Please check the following:</p>
                <ul className="space-y-1.5 ml-1">
                  <li className="flex items-start gap-2">
                    <span className="select-none">•</span>
                    <span>The file format uses the required by the bank you selected.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="select-none">•</span>
                    <span>Transaction data is organized in the correct columns.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="select-none">•</span>
                    <span>Transactions are in the correct currency: <strong>{currency}</strong>.</span>
                  </li>
                </ul>
                <p className="text-[hsl(var(--info-fg)/0.75)] italic">
                  Don't worry, we'll automatically skip any duplicate transactions between attached files.
                </p>
              </div>
            </div>

            {/* Bank Selection */}
            <div className="space-y-3">
              <Label htmlFor="bank" className="text-sm font-semibold text-[hsl(var(--foreground))]">
                Select Bank *
              </Label>
              <Select value={bankName} onValueChange={setBankName}>
                <SelectTrigger className="h-12 border-2 border-[hsl(var(--border))] bg-[hsl(var(--background))] focus:border-[hsl(var(--accent))]">
                  <SelectValue placeholder="Choose your bank or financial institution" />
                </SelectTrigger>
                <SelectContent className="bg-[hsl(var(--popover))] border-2 border-[hsl(var(--border))] shadow-xl">
                  <SelectItem value="santander_rio" className="text-[hsl(var(--popover-foreground))] py-3">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-full bg-[hsl(var(--destructive)/0.1)]">
                        <div className="w-3 h-3 bg-[hsl(var(--destructive))] rounded-full"></div>
                      </div>
                      <div>
                        <div className="font-medium">Santander Rio</div>
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">Excel (.xlsx) format</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="mercado_pago" className="text-[hsl(var(--popover-foreground))] py-3">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-full bg-[hsl(var(--warning)/0.1)]">
                        <div className="w-3 h-3 bg-[hsl(var(--warning))] rounded-full"></div>
                      </div>
                      <div>
                        <div className="font-medium">Mercado Pago</div>
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">PDF (.pdf) format</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="ICBC" className="text-[hsl(var(--popover-foreground))] py-3">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-full bg-[hsl(var(--destructive)/0.1)]">
                        <div className="w-3 h-3 bg-[hsl(var(--destructive))] rounded-full"></div>
                      </div>
                      <div>
                        <div className="font-medium">ICBC</div>
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">CSV (.csv) format</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="comm_bank" className="text-[hsl(var(--popover-foreground))] py-3">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-full bg-[hsl(var(--info)/0.1)]">
                        <div className="w-3 h-3 bg-[hsl(var(--info))] rounded-full"></div>
                      </div>
                      <div>
                        <div className="font-medium">CommBank</div>
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">CSV (.csv) format</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {bankName && (
                <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1">
                  <FileTextIcon className="h-3 w-3" />
                  {getSupportedFormatText()}
                </p>
              )}
            </div>

            {/* File Upload */}
            <div className="space-y-3">
              <Label htmlFor="importFile" className="text-sm font-semibold text-[hsl(var(--foreground))]">
                Statement File *
              </Label>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${isDragging
                  ? 'border-[hsl(var(--accent))] bg-[hsl(var(--accent)/0.05)] scale-[1.02]'
                  : file
                    ? 'border-[hsl(var(--accent)/0.5)] bg-[hsl(var(--accent)/0.05)]'
                    : 'border-[hsl(var(--border))] hover:border-[hsl(var(--accent)/0.4)] hover:bg-[hsl(var(--accent)/0.05)]'
                  }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {!file ? (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="p-4 rounded-full bg-[hsl(var(--accent)/0.1)] border border-[hsl(var(--accent)/0.2)]">
                      <UploadCloudIcon className="h-10 w-10 text-[hsl(var(--accent))]" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-medium text-[hsl(var(--foreground))]">
                        Drag & drop your statement file here
                      </p>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">
                        or click the button below to browse
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {bankName ? getSupportedFormatText() : "Select a bank first to see supported formats"}
                      </p>
                    </div>
                    <label htmlFor="importFile" className="cursor-pointer bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent)/0.9)] text-[hsl(var(--accent-foreground))] font-medium px-6 py-2.5 rounded-lg text-sm transition-all duration-200 shadow-md hover:shadow-lg">
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
                    <div className="p-4 bg-[hsl(var(--accent)/0.1)] rounded-lg border border-[hsl(var(--accent)/0.2)]">
                      <FileIcon className="h-10 w-10 text-[hsl(var(--accent))]" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="font-semibold text-[hsl(var(--foreground))] text-lg">{file.name}</p>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">
                        {(file.size / 1024).toFixed(2)} KB • {file.type || "Unknown format"}
                      </p>
                      <div className="flex items-center justify-center gap-2 text-xs text-[hsl(var(--accent))]">
                        <CheckCircleIcon className="h-3 w-3" />
                        <span>File ready for import</span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFile(null)}
                      className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                    >
                      Choose Different File
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="bg-[hsl(var(--destructive)/0.05)] border-2 border-[hsl(var(--destructive)/0.2)] shadow-lg">
                <XCircleIcon className="h-5 w-5" />
                <AlertTitle className="text-[hsl(var(--destructive))] font-semibold">Import Failed</AlertTitle>
                <AlertDescription className="text-[hsl(var(--destructive)/0.9)]">{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="success"
              size="xl"
              disabled={isUploading || !file || !bankName}
              className="w-full text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
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