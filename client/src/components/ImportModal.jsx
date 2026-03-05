import { useState, useRef, useCallback } from "react";
import {
  Upload,
  X,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Download,
} from "lucide-react";

export default function ImportModal({ isOpen, onClose, onImport }) {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (
      dropped &&
      (dropped.name.endsWith(".csv") || dropped.type === "text/csv")
    ) {
      processFile(dropped);
    }
  }, []);

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (selected) processFile(selected);
  };

  const processFile = (f) => {
    setFile(f);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split("\n").filter((l) => l.trim());
      const headers = lines[0]?.split(",").map((h) => h.trim());
      const rows = lines.slice(1, 6).map((line) => {
        const values = line.split(",").map((v) => v.trim());
        const row = {};
        headers?.forEach((h, i) => (row[h] = values[i] || ""));
        return row;
      });
      setPreview({ headers: headers || [], rows, totalRows: lines.length - 1 });
    };
    reader.readAsText(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await onImport(file);
      setResult(res);
    } catch (err) {
      setResult({
        imported: 0,
        skipped: 0,
        total: 0,
        errors: [
          err.response?.data?.error?.message || err.message || "Upload failed",
        ],
      });
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const downloadTemplate = () => {
    const csv =
      "name,stage,amount,currency,contactName,contactEmail\nAcme Corp Deal,discovery,50000,USD,John Smith,john@acme.com\nBeta Solutions,proposal,120000,USD,Jane Doe,jane@beta.com";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "deal_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] overflow-auto border border-border dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border dark:border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-dark dark:text-white">
              Import Deals from CSV
            </h2>
            <p className="text-sm text-muted dark:text-gray-400 mt-0.5">
              Upload a CSV file to bulk import deals
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-muted dark:text-gray-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Result Banner */}
          {result && (
            <div
              className={`rounded-xl p-4 ${result.imported > 0 ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800" : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"}`}
            >
              <div className="flex items-start gap-3">
                {result.imported > 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                )}
                <div>
                  <p className="font-semibold text-sm text-dark dark:text-white">
                    {result.imported > 0 ? "Import Complete" : "Import Failed"}
                  </p>
                  <p className="text-sm text-muted dark:text-gray-400 mt-1">
                    {result.imported} imported · {result.skipped} skipped ·{" "}
                    {result.total} total
                  </p>
                  {result.errors?.length > 0 && (
                    <div className="mt-2 text-xs text-red-600 dark:text-red-400 space-y-0.5">
                      {result.errors.slice(0, 5).map((e, i) => (
                        <p key={i}>• {e}</p>
                      ))}
                      {result.errors.length > 5 && (
                        <p className="text-muted dark:text-gray-500">
                          ...and {result.errors.length - 5} more
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Drop Zone */}
          {!file && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                dragOver
                  ? "border-primary bg-primary/5 dark:bg-primary/10"
                  : "border-gray-300 dark:border-gray-600 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-750"
              }`}
            >
              <Upload
                className={`w-10 h-10 mx-auto mb-3 ${dragOver ? "text-primary" : "text-gray-400 dark:text-gray-500"}`}
              />
              <p className="text-sm font-semibold text-dark dark:text-white">
                Drop CSV file here or click to browse
              </p>
              <p className="text-xs text-muted dark:text-gray-400 mt-1">
                Maximum 500 deals · 5MB file size limit
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* File Info */}
          {file && !result && (
            <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-750 rounded-xl p-4 border border-border dark:border-gray-700">
              <FileText className="w-8 h-8 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-dark dark:text-white truncate">
                  {file.name}
                </p>
                <p className="text-xs text-muted dark:text-gray-400">
                  {(file.size / 1024).toFixed(1)} KB · {preview?.totalRows || 0}{" "}
                  rows detected
                </p>
              </div>
              <button
                onClick={reset}
                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-muted dark:text-gray-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Preview Table */}
          {preview && !result && (
            <div className="overflow-x-auto">
              <p className="text-xs font-semibold text-muted dark:text-gray-400 mb-2 uppercase tracking-wide">
                Preview (first 5 rows)
              </p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-750">
                    {preview.headers.map((h) => (
                      <th
                        key={h}
                        className="px-3 py-2 text-left font-semibold text-muted dark:text-gray-400 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row, i) => (
                    <tr
                      key={i}
                      className="border-t border-border dark:border-gray-700"
                    >
                      {preview.headers.map((h) => (
                        <td
                          key={h}
                          className="px-3 py-2 text-dark dark:text-gray-200 truncate max-w-[150px]"
                        >
                          {row[h] || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Download Template */}
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 text-xs text-primary hover:text-primary-hover font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download CSV template
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border dark:border-gray-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-muted dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {result ? "Close" : "Cancel"}
          </button>
          {file && !result && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm disabled:opacity-60 active:scale-95"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Import {preview?.totalRows || 0} deals
                </>
              )}
            </button>
          )}
          {result && (
            <button
              onClick={reset}
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm active:scale-95"
            >
              Import Another
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
