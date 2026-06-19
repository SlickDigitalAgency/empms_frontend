import { useRef, useState } from "react"
import Papa from "papaparse"
import { Upload, FileText, AlertCircle, CheckCircle, X, Loader2, Download } from "lucide-react"
import { api } from "@/services/api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { EntityRecord } from "@/types"

// Expected CSV column headers (case-insensitive)
const REQUIRED_COLUMNS = ["roll_number", "registration_number", "student_name", "father_name", "program_id", "session_id", "level", "status"]
const OPTIONAL_COLUMNS = ["cnic", "phone"]
const ALL_COLUMNS = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS]

type ImportResult = {
  inserted: number
  skipped: number
  errors: string[]
}

type StudentImportProps = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

type ParsedRow = Record<string, string>

function normalizeHeaders(row: ParsedRow): ParsedRow {
  // Normalize all keys to lowercase with underscores
  return Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k.trim().toLowerCase().replace(/\s+/g, "_"), String(v ?? "").trim()])
  )
}

function validateRow(row: ParsedRow, index: number): string | null {
  for (const col of REQUIRED_COLUMNS) {
    if (!row[col]) return `Row ${index + 1}: Missing required field "${col}"`
  }
  return null
}

export function StudentImport({ open, onClose, onSuccess }: StudentImportProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ParsedRow[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  function reset() {
    setFile(null)
    setPreview([])
    setParseErrors([])
    setResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return
    setFile(selected)
    setResult(null)
    setParseErrors([])

    Papa.parse<ParsedRow>(selected, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const normalized = results.data.map(normalizeHeaders)
        const errors: string[] = []

        // Check required columns exist in file
        if (normalized.length > 0) {
          for (const col of REQUIRED_COLUMNS) {
            if (!(col in normalized[0])) {
              errors.push(`Missing column: "${col}"`)
            }
          }
        }

        // Validate each row
        normalized.forEach((row, i) => {
          const err = validateRow(row, i)
          if (err) errors.push(err)
        })

        setParseErrors(errors)
        setPreview(normalized.slice(0, 5)) // Show first 5 as preview
      },
      error(error) {
        setParseErrors([`Parse error: ${error.message}`])
      },
    })
  }

  async function handleImport() {
    if (!file || parseErrors.length > 0) return
    setImporting(true)
    setResult(null)

    // Re-parse full file
    Papa.parse<ParsedRow>(file, {
      header: true,
      skipEmptyLines: true,
      async complete(results) {
        try {
          const rows: EntityRecord[] = results.data.map(normalizeHeaders)
          const importResult = await api.importStudents(rows)
          setResult(importResult)
          toast({
            title: "Import Complete",
            description: `${importResult.inserted} inserted, ${importResult.skipped} skipped.`,
          })
          if (importResult.inserted > 0) {
            onSuccess()
          }
        } catch (err) {
          toast({
            variant: "destructive",
            title: "Import Failed",
            description: err instanceof Error ? err.message : "Could not import students.",
          })
        } finally {
          setImporting(false)
        }
      },
      error() {
        setImporting(false)
        toast({ variant: "destructive", title: "Parse Error", description: "Could not read file." })
      },
    })
  }

  function downloadTemplate() {
    const headers = ALL_COLUMNS.join(",")
    const example = "A001,REG001,John Smith,Muhammad Smith,prog_id_here,session_id_here,Year 1,Active,3520101234567,03001234567"
    const blob = new Blob([headers + "\n" + example], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "students_import_template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const hasFile = Boolean(file)
  const canImport = hasFile && parseErrors.length === 0 && !result

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Import Students from CSV
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk-import students. Download the template to see required columns.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Template download */}
          <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
            <div className="text-sm">
              <p className="font-medium">Need the template?</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Required: {REQUIRED_COLUMNS.join(", ")}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="mr-2 h-4 w-4" /> Template
            </Button>
          </div>

          {/* File drop zone */}
          <div
            className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer hover:bg-muted/30 ${
              hasFile ? "border-primary/40 bg-primary/5" : "border-border"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
            {hasFile ? (
              <>
                <FileText className="h-8 w-8 text-primary mb-2" />
                <p className="text-sm font-medium text-foreground">{file!.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{(file!.size / 1024).toFixed(1)} KB</p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); reset() }}
                  className="mt-2 rounded-full p-1 hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm font-medium">Click to upload or drag & drop</p>
                <p className="text-xs text-muted-foreground mt-1">CSV, XLSX files supported</p>
              </>
            )}
          </div>

          {/* Parse errors */}
          {parseErrors.length > 0 && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-1">
              <p className="flex items-center gap-2 text-sm font-medium text-destructive">
                <AlertCircle className="h-4 w-4" /> {parseErrors.length} validation issue(s)
              </p>
              <ul className="list-disc list-inside space-y-0.5">
                {parseErrors.map((e, i) => (
                  <li key={i} className="text-xs text-destructive">{e}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview */}
          {preview.length > 0 && parseErrors.length === 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                Preview (first 5 rows)
              </p>
              <div className="overflow-auto rounded-lg border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/60">
                      {ALL_COLUMNS.filter((col) => col in (preview[0] ?? {})).map((col) => (
                        <th key={col} className="px-3 py-2 text-left font-semibold text-muted-foreground whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-t">
                        {ALL_COLUMNS.filter((col) => col in (preview[0] ?? {})).map((col) => (
                          <td key={col} className="px-3 py-2 whitespace-nowrap max-w-[150px] truncate">
                            {row[col] || <span className="text-muted-foreground/50">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900/30 dark:bg-green-900/10 p-4 space-y-2">
              <p className="flex items-center gap-2 font-medium text-green-700 dark:text-green-400">
                <CheckCircle className="h-4 w-4" /> Import completed
              </p>
              <div className="flex gap-3">
                <Badge className="bg-green-600 text-white">{result.inserted} inserted</Badge>
                <Badge variant="secondary">{result.skipped} skipped</Badge>
              </div>
              {result.errors.length > 0 && (
                <ul className="list-disc list-inside space-y-0.5 mt-2">
                  {result.errors.map((e, i) => (
                    <li key={i} className="text-xs text-muted-foreground">{e}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={handleClose}>
            {result ? "Close" : "Cancel"}
          </Button>
          <Button onClick={handleImport} disabled={!canImport || importing}>
            {importing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing…
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import Students
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
