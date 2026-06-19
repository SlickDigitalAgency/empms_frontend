import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { ArrowDownUp, Edit, FileDown, Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/common/StatusBadge"
import type { ColumnDef, EntityRecord, FormField, Option, ReferenceState } from "@/types"

type DataTableProps = {
  rows: EntityRecord[]
  columns: ColumnDef[]
  filters?: FormField[]
  references: ReferenceState
  loading?: boolean
  error?: string
  onEdit: (row: EntityRecord) => void
  onDelete: (row: EntityRecord) => void
  onDocument?: (row: EntityRecord) => void
}

const pageSize = 10

function getOptions(field: FormField, references: ReferenceState): Option[] {
  if (field.options) return field.options
  if (!field.optionsFrom) return []
  return (references[field.optionsFrom] ?? []).map((row) => ({
    value: String(row.id ?? ""),
    label: String(row[field.optionLabel ?? "id"] ?? row.id ?? "Untitled"),
  }))
}

function resolveRelation(column: ColumnDef, value: unknown, references: ReferenceState) {
  if (!column.relation) return String(value ?? "")
  const match = (references[column.relation] ?? []).find((row) => String(row.id) === String(value))
  return String(match?.[column.relationLabel ?? "id"] ?? value ?? "")
}

export function DataTable({
  rows,
  columns,
  filters = [],
  references,
  loading,
  error,
  onEdit,
  onDelete,
  onDocument,
}: DataTableProps) {
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState(columns[0]?.key ?? "")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [page, setPage] = useState(1)
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})

  const filteredRows = useMemo(() => {
    const text = search.toLowerCase()
    return rows
      .filter((row) =>
        columns.some((column) => resolveRelation(column, row[column.key], references).toLowerCase().includes(text)),
      )
      .filter((row) =>
        Object.entries(filterValues).every(([key, value]) => !value || value === "all" || String(row[key]) === value),
      )
      .sort((a, b) => {
        const left = String(a[sortKey] ?? "")
        const right = String(b[sortKey] ?? "")
        return sortDirection === "asc" ? left.localeCompare(right) : right.localeCompare(left)
      })
  }, [columns, filterValues, references, rows, search, sortDirection, sortKey])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const visibleRows = filteredRows.slice((page - 1) * pageSize, page * pageSize)

  function toggleSort(key: string) {
    setSortKey(key)
    setSortDirection((current) => (sortKey === key && current === "asc" ? "desc" : "asc"))
  }

  if (error) {
    return <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">{error}</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search records"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Select
              key={filter.name}
              value={filterValues[filter.name] ?? "all"}
              onValueChange={(value) => {
                setFilterValues((current) => ({ ...current, [filter.name]: value }))
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {filter.label}</SelectItem>
                {getOptions(filter, references).map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key}>
                  <button
                    className="inline-flex items-center gap-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    type="button"
                    onClick={() => column.sortable && toggleSort(column.key)}
                  >
                    {column.label}
                    {column.sortable ? <ArrowDownUp className="h-3.5 w-3.5" /> : null}
                  </button>
                </TableHead>
              ))}
              <TableHead className="w-[150px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    {columns.map((column) => (
                      <TableCell key={column.key}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                    <TableCell>
                      <Skeleton className="ml-auto h-8 w-24" />
                    </TableCell>
                  </TableRow>
                ))
              : null}
            {!loading && visibleRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="h-32 text-center text-muted-foreground">
                  No records found.
                </TableCell>
              </TableRow>
            ) : null}
            {!loading
              ? visibleRows.map((row, index) => (
                  <motion.tr
                    key={String(row.id ?? index)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.025 }}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    {columns.map((column) => {
                      const value = resolveRelation(column, row[column.key], references)
                      return (
                        <TableCell key={column.key} className="max-w-[280px] truncate">
                          {column.badge ? <StatusBadge value={value} /> : value || "Not set"}
                        </TableCell>
                      )
                    })}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {onDocument ? (
                          <Button size="icon" variant="ghost" title="Generate document" onClick={() => onDocument(row)}>
                            <FileDown className="h-4 w-4" />
                          </Button>
                        ) : null}
                        <Button size="icon" variant="ghost" title="Edit" onClick={() => onEdit(row)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" title="Delete" onClick={() => onDelete(row)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))
              : null}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>
          Showing {visibleRows.length} of {filteredRows.length} records
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>
            Previous
          </Button>
          <span>
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
