import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Settings, CheckCircle, Loader2, AlertCircle, Link2, Plus, Edit, Trash2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { api, getApiUrl } from "@/services/api"
import { useResource } from "@/hooks/useResource"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { EntityForm } from "@/components/common/EntityForm"
import { moduleByEntity } from "@/constants/modules"
import type { EntityRecord } from "@/types"

// ─── API Config Form ────────────────────────────────────────────────────────

const apiConfigSchema = z.object({
  apiUrl: z.string().trim().url("Enter a valid URL").min(1, "URL is required"),
})

type ApiConfigForm = z.infer<typeof apiConfigSchema>

const API_OVERRIDE_KEY = "empms_api_url_override"

function ApiConfigTab() {
  const { toast } = useToast()
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null)

  const form = useForm<ApiConfigForm>({
    resolver: zodResolver(apiConfigSchema),
    defaultValues: {
      apiUrl: localStorage.getItem(API_OVERRIDE_KEY) ?? getApiUrl(),
    },
  })

  function handleSave(values: ApiConfigForm) {
    localStorage.setItem(API_OVERRIDE_KEY, values.apiUrl)
    // Patch window so api.ts picks it up at runtime without reload
    ;(window as Record<string, unknown>).__EMPMS_API_URL__ = values.apiUrl
    toast({ title: "API URL Saved", description: "The new URL will be used for all requests." })
  }

  async function handleTest() {
    const url = form.getValues("apiUrl")
    if (!url) return
    setTesting(true)
    setTestResult(null)
    try {
      // Quick health ping — just checks if the Apps Script responds
      const res = await fetch(`${url}?route=ping&test=1`)
      setTestResult(res.ok ? "success" : "error")
    } catch {
      setTestResult("error")
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="h-4 w-4 text-primary" />
          Google Apps Script API URL
        </CardTitle>
        <CardDescription>
          Paste the deployed web app URL from your Google Apps Script project. All CRUD operations use this endpoint.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
            <FormField
              control={form.control}
              name="apiUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Base URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://script.google.com/macros/s/…/exec"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-3">
              <Button type="submit" size="sm">Save URL</Button>
              <Button type="button" variant="outline" size="sm" onClick={handleTest} disabled={testing}>
                {testing ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                Test Connection
              </Button>
              {testResult === "success" && (
                <span className="flex items-center gap-1.5 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" /> Connected
                </span>
              )}
              {testResult === "error" && (
                <span className="flex items-center gap-1.5 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" /> Connection failed
                </span>
              )}
            </div>
          </form>
        </Form>

        <div className="rounded-lg border bg-muted/50 p-4 text-sm space-y-2">
          <p className="font-medium">Setup Instructions</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs leading-relaxed">
            <li>Open <strong>Google Apps Script</strong> and paste the backend code.</li>
            <li>Click <strong>Deploy → New Deployment → Web App</strong>.</li>
            <li>Set "Execute as: Me" and "Who has access: Anyone".</li>
            <li>Copy the generated URL and paste it above.</li>
            <li>Set the admin password in Script Properties: <code className="bg-background px-1 rounded">ADMIN_PASSWORD</code>.</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Sessions CRUD ───────────────────────────────────────────────────────────

function SessionsTab() {
  const definition = moduleByEntity["sessions"]
  const { records, loading, error, reload } = useResource("sessions")
  const { toast } = useToast()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<EntityRecord | null>(null)
  const [deleting, setDeleting] = useState<EntityRecord | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(values: EntityRecord) {
    setSubmitting(true)
    try {
      if (editing?.id) {
        await api.update("sessions", String(editing.id), values)
        toast({ title: "Session Updated" })
      } else {
        await api.create("sessions", values)
        toast({ title: "Session Created" })
      }
      setSheetOpen(false)
      setEditing(null)
      await reload()
    } catch (err) {
      toast({ variant: "destructive", title: "Save Failed", description: err instanceof Error ? err.message : "Error" })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteConfirm() {
    if (!deleting?.id) return
    setSubmitting(true)
    try {
      await api.remove("sessions", String(deleting.id))
      toast({ title: "Session Deleted" })
      setDeleting(null)
      await reload()
    } catch (err) {
      toast({ variant: "destructive", title: "Delete Failed", description: err instanceof Error ? err.message : "Error" })
    } finally {
      setSubmitting(false)
    }
  }

  if (error) return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
  )

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base">Academic Sessions</CardTitle>
          <CardDescription>Manage exam sessions and their date ranges.</CardDescription>
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setSheetOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" /> Add Session
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableCell key={j}><div className="h-4 w-full rounded bg-muted shimmer" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : null}
              {!loading && records.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No sessions yet. Add the first session.
                  </TableCell>
                </TableRow>
              )}
              {!loading && records.map((row) => (
                <TableRow key={String(row.id)}>
                  <TableCell className="font-medium">{String(row.session_name)}</TableCell>
                  <TableCell>{String(row.start_date)}</TableCell>
                  <TableCell>{String(row.end_date)}</TableCell>
                  <TableCell>
                    <Badge variant={row.status === "Active" ? "default" : "secondary"} className="text-xs">
                      {String(row.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => { setEditing(row); setSheetOpen(true) }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleting(row)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Create/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={(v) => { if (!v) setSheetOpen(false) }}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>{editing?.id ? "Edit Session" : "Add Session"}</SheetTitle>
            <SheetDescription>Fill in session details below.</SheetDescription>
          </SheetHeader>
          <EntityForm
            definition={definition}
            initialValue={editing}
            references={{}}
            submitting={submitting}
            onSubmit={handleSubmit}
            onCancel={() => setSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <Dialog open={Boolean(deleting)} onOpenChange={(v) => { if (!v) setDeleting(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
            <DialogDescription>This will permanently remove the session.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={submitting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

// ─── Settings Page ───────────────────────────────────────────────────────────

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Settings</h2>
            <p className="text-sm text-muted-foreground">Configure system settings and manage academic sessions.</p>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <Tabs defaultValue="sessions">
          <TabsList className="mb-4">
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="api">API Configuration</TabsTrigger>
          </TabsList>
          <TabsContent value="sessions"><SessionsTab /></TabsContent>
          <TabsContent value="api"><ApiConfigTab /></TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
