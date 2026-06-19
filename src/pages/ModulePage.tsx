import { useState } from "react"
import { motion } from "framer-motion"
import { Plus, Upload, Loader2, Trash2, AlertCircle } from "lucide-react"
import { moduleByEntity } from "@/constants/modules"
import { api } from "@/services/api"
import { useResource } from "@/hooks/useResource"
import { useReferences } from "@/hooks/useReferences"
import { useToast } from "@/hooks/use-toast"
import { DataTable } from "@/components/common/DataTable"
import { EntityForm } from "@/components/common/EntityForm"
import { StudentImport } from "@/components/modules/students/StudentImport"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { EntityName, EntityRecord } from "@/types"

type ModulePageProps = {
  entity: EntityName
}

export function ModulePage({ entity }: ModulePageProps) {
  const definition = moduleByEntity[entity]
  const { records, loading, error, reload } = useResource(entity)
  const references = useReferences()
  const { toast } = useToast()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<EntityRecord | null>(null)
  const [deleting, setDeleting] = useState<EntityRecord | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  if (!definition) {
    return (
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle className="h-5 w-5" />
        <span>Unknown module: {entity}</span>
      </div>
    )
  }

  const Icon = definition.icon

  /** Open the create slide-over */
  function handleAdd() {
    setEditing(null)
    setSheetOpen(true)
  }

  /** Open the edit slide-over */
  function handleEdit(row: EntityRecord) {
    setEditing(row)
    setSheetOpen(true)
  }

  /** Open delete confirmation */
  function handleDeleteRequest(row: EntityRecord) {
    setDeleting(row)
  }

  /** Handle document generation */
  async function handleDocument(row: EntityRecord) {
    try {
      const result = await api.document(entity, row)
      toast({
        title: "Document Ready",
        description: (
          <span>
            Document generated.{" "}
            <a href={result.url} target="_blank" rel="noreferrer" className="underline font-medium">
              Open document
            </a>
          </span>
        ),
      })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Document Generation Failed",
        description: err instanceof Error ? err.message : "Could not generate document.",
      })
    }
  }

  /** Submit create or update */
  async function handleSubmit(values: EntityRecord) {
    setSubmitting(true)
    try {
      if (editing?.id) {
        await api.update(entity, String(editing.id), values)
        toast({ title: `${definition.singular} Updated`, description: "Changes saved successfully." })
      } else {
        await api.create(entity, values)
        toast({ title: `${definition.singular} Created`, description: "New record added successfully." })
      }
      setSheetOpen(false)
      setEditing(null)
      await reload()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: err instanceof Error ? err.message : "Unable to save record.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  /** Confirm delete */
  async function handleDeleteConfirm() {
    if (!deleting?.id) return
    setSubmitting(true)
    try {
      await api.remove(entity, String(deleting.id))
      toast({ title: `${definition.singular} Deleted`, description: "Record removed successfully." })
      setDeleting(null)
      await reload()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: err instanceof Error ? err.message : "Unable to delete record.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  /* Which entities support document generation */
  const documentEntities: EntityName[] = ["students", "attendance", "duties", "ufm"]
  const supportsDocuments = documentEntities.includes(entity)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{definition.title}</h2>
            <p className="text-sm text-muted-foreground">{definition.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {entity === "students" && (
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
          )}
          <Button size="sm" onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add {definition.singular}
          </Button>
        </div>
      </motion.div>

      {/* Data Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <DataTable
          rows={records}
          columns={definition.columns}
          filters={definition.filters}
          references={references}
          loading={loading}
          error={error}
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
          onDocument={supportsDocuments ? handleDocument : undefined}
        />
      </motion.div>

      {/* Create / Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={(open) => { if (!open) setSheetOpen(false) }}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>{editing?.id ? `Edit ${definition.singular}` : `Add New ${definition.singular}`}</SheetTitle>
            <SheetDescription>
              {editing?.id
                ? `Update the ${definition.singular.toLowerCase()} details below.`
                : `Fill in the form to create a new ${definition.singular.toLowerCase()}.`}
            </SheetDescription>
          </SheetHeader>
          <EntityForm
            definition={definition}
            initialValue={editing}
            references={references}
            submitting={submitting}
            onSubmit={handleSubmit}
            onCancel={() => setSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleting)} onOpenChange={(open) => { if (!open) setDeleting(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete {definition.singular}
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. The record will be permanently removed from the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Import Modal */}
      {entity === "students" && (
        <StudentImport
          open={importOpen}
          onClose={() => setImportOpen(false)}
          onSuccess={() => { setImportOpen(false); void reload() }}
        />
      )}
    </div>
  )
}
