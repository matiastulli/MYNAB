import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/services/api";
import { CheckCircleIcon, UploadIcon, XCircleIcon } from "lucide-react";
import { useState } from "react";

export default function ImportFile({ onImportComplete }) {
  const [file, setFile] = useState(null);
  const [bankName, setBankName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

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
    <Card className="border-0 bg-white/60 dark:bg-[#1a1e24]/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
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
                className="border-0 bg-neutral-100 dark:bg-[#2a303a] focus:bg-white dark:focus:bg-[#353b47]"
              >
                <SelectValue placeholder="Select your bank" className="text-neutral-500 dark:text-white" />
              </SelectTrigger>
              <SelectContent className="dark:bg-[#1e232a] dark:border-neutral-700">
                <SelectItem value="santander_rio" className="text-neutral-900 dark:text-white">Santander Rio</SelectItem>
                <SelectItem value="ICBC" className="text-neutral-900 dark:text-white">ICBC</SelectItem>
                <SelectItem value="mercado_pago" className="text-neutral-900 dark:text-white">Mercado Pago</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="importFile" className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
              File Statement
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="importFile"
                type="file"
                accept=".xlsx,.xls,.csv,.pdf"
                onChange={handleFileChange}
                className="border-0 bg-neutral-100 dark:bg-[#2a303a] focus:bg-white dark:focus:bg-[#353b47] file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-neutral-200 dark:file:bg-[#353b47] file:text-neutral-700 dark:file:text-white
                hover:file:bg-neutral-300 cursor-pointer"
              />
              {file && <p className="text-sm text-neutral-500 dark:text-neutral-400">{file.name}</p>}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Only .xlsx and .xls and .csv and .pdf files are supported
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="dark:bg-red-900/30 dark:border-red-800 border">
              <XCircleIcon className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert className="dark:bg-emerald-900/30 dark:border-emerald-800 border">
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
            className="w-full bg-neutral-900 hover:bg-neutral-800 dark:bg-emerald-800/80 dark:hover:bg-emerald-700/90 dark:text-white transition-colors"
          >
            {isUploading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 border-2 border-t-transparent rounded-full animate-spin"></div>
                <span>Uploading...</span>
              </div>
            ) : (
              <>
                <UploadIcon className="h-4 w-4 mr-2" />
                Upload File
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}