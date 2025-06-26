import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/services/api";
import { CheckCircleIcon, FileIcon, UploadCloudIcon, UploadIcon, XCircleIcon } from "lucide-react";
import { useState } from "react";

export default function ImportFile({ onImportComplete }) {
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

      console.log("Base64 File Content:", base64File); // Debugging line
      
      // Send the file as base64 string using the regular post method
      const response = await api.post("/budget/import-file", {
        bank_name: bankName,
        file_content: base64File,
        file_name: file.name
      });

      if (response.error) {
        throw new Error(response.error || "Failed to import file");
      }

      setResult({
        message: response.message || "Import successful",
        count: response.imported_count || 0,
      });
      
      // Call the callback to refresh data if needed
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (err) {
      setError(err.message || "An error occurred during import");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="border-0 bg-white/80 dark:bg-[#1a1e24]/80 backdrop-blur-sm shadow-sm max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <UploadIcon className="h-5 w-5 text-emerald-500" />
          Import Bank Statement
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="bank" className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
              Select Bank
            </Label>
            <Select value={bankName} onValueChange={setBankName}>
              <SelectTrigger
                id="bank"
                className="border-0 bg-neutral-100 dark:bg-[#2a303a] focus:bg-white dark:focus:bg-[#353b47] h-[42px]"
              >
                <SelectValue placeholder="Select your bank" className="text-neutral-500 dark:text-white" />
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
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
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
                      Supported formats: .xlsx, .xls, .csv, .pdf
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