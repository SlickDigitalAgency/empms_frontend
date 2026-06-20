import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Grid2X2, Zap, Loader2, AlertCircle, CheckCircle, ChevronRight, Building2 } from "lucide-react"
import { api } from "@/services/api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import type { EntityRecord } from "@/types"

export function GeneratePlan() {
  const { toast } = useToast()

  // Reference data
  const [exams, setExams] = useState<EntityRecord[]>([])
  const [rooms, setRooms] = useState<EntityRecord[]>([])
  const [papers, setPapers] = useState<EntityRecord[]>([])
  const [seatingPlans, setSeatingPlans] = useState<EntityRecord[]>([])
  const [loadingRefs, setLoadingRefs] = useState(true)

  // Selections
  const [selectedExam, setSelectedExam] = useState("")
  const [selectedRooms, setSelectedRooms] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)

  // Load reference entities
  useEffect(() => {
    async function loadRefs() {
      setLoadingRefs(true)
      try {
        const [examsData, roomsData, papersData, seatingData] = await Promise.all([
          api.list("exams"),
          api.list("rooms"),
          api.list("papers"),
          api.list("registration"), // seating uses registration entity for display
        ])
        setExams(examsData)
        setRooms(roomsData.filter((r) => r.status === "Available"))
        setPapers(papersData)
        setSeatingPlans(seatingData)
      } catch {
        toast({ variant: "destructive", title: "Error", description: "Could not load reference data." })
      } finally {
        setLoadingRefs(false)
      }
    }
    void loadRefs()
  }, [toast])

  function getPaperName(paperId: string) {
    const p = papers.find((p) => String(p.id) === paperId)
    return String(p?.paper_name ?? paperId)
  }

  function toggleRoom(roomId: string) {
    setSelectedRooms((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
    )
  }

  async function handleGenerate() {
    if (!selectedExam) {
      toast({ variant: "destructive", title: "Select an exam", description: "Please choose an exam first." })
      return
    }
    if (selectedRooms.length === 0) {
      toast({ variant: "destructive", title: "Select rooms", description: "Choose at least one room." })
      return
    }
    setGenerating(true)
    try {
      const result = await api.generateSeating(selectedExam, selectedRooms)
      toast({
        title: "Seating Plan Generated",
        description: `${result.created} seats allocated across ${result.roomsUsed} room(s).`,
      })
      // Refresh seating plans view
      const updated = await api.list("registration")
      setSeatingPlans(updated)
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: err instanceof Error ? err.message : "Could not generate seating plan.",
      })
    } finally {
      setGenerating(false)
    }
  }

  if (loadingRefs) return <SeatingPageSkeleton />

  const selectedExamObj = exams.find((e) => String(e.id) === selectedExam)

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Grid2X2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Seating Plan</h2>
            <p className="text-sm text-muted-foreground">
              Select an exam and rooms to automatically generate a seating allocation.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Workflow: Step 1 + Step 2 + Action */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      >
        {/* Step 1 — Select Exam */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
              Select Exam
            </CardTitle>
            <CardDescription className="text-xs">Choose the exam to generate seating for</CardDescription>
          </CardHeader>
          <CardContent>
            {exams.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                No exams scheduled yet.
              </div>
            ) : (
              <Select value={selectedExam} onValueChange={setSelectedExam}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an exam…" />
                </SelectTrigger>
                <SelectContent>
                  {exams.map((exam) => (
                    <SelectItem key={String(exam.id)} value={String(exam.id)}>
                      {getPaperName(String(exam.paper_id))} — {String(exam.exam_date)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {selectedExamObj && (
              <div className="mt-3 rounded-lg bg-muted p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paper</span>
                  <span className="font-medium">{getPaperName(String(selectedExamObj.paper_id))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{String(selectedExamObj.exam_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium">{String(selectedExamObj.start_time)} – {String(selectedExamObj.end_time)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <Badge variant="secondary" className="text-[10px] py-0">{String(selectedExamObj.exam_type)}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2 — Select Rooms */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
              Select Rooms
            </CardTitle>
            <CardDescription className="text-xs">Available rooms ({rooms.length} ready)</CardDescription>
          </CardHeader>
          <CardContent>
            {rooms.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                No available rooms. Add rooms first.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {rooms.map((room) => {
                  const id = String(room.id)
                  const checked = selectedRooms.includes(id)
                  return (
                    <label
                      key={id}
                      htmlFor={`room-${id}`}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                        checked ? "border-primary/50 bg-primary/5" : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <Checkbox
                        id={`room-${id}`}
                        checked={checked}
                        onCheckedChange={() => toggleRoom(id)}
                      />
                      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{String(room.room_number)}</p>
                        <p className="text-xs text-muted-foreground">{String(room.building)} · Capacity: {String(room.capacity)}</p>
                      </div>
                    </label>
                  )
                })}
              </div>
            )}
            {selectedRooms.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                {selectedRooms.length} room(s) selected ·{" "}
                {rooms
                  .filter((r) => selectedRooms.includes(String(r.id)))
                  .reduce((sum, r) => sum + Number(r.capacity ?? 0), 0)}{" "}
                total seats
              </p>
            )}
          </CardContent>
        </Card>

        {/* Step 3 — Generate */}
        <Card className="shadow-card flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</span>
              Generate Plan
            </CardTitle>
            <CardDescription className="text-xs">
              The system will automatically allocate registered students to seats
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 flex-1">
            {/* Checklist */}
            <div className="space-y-2 text-sm">
              <div className={`flex items-center gap-2 ${selectedExam ? "text-foreground" : "text-muted-foreground"}`}>
                {selectedExam ? <CheckCircle className="h-4 w-4 text-green-500" /> : <ChevronRight className="h-4 w-4" />}
                Exam selected
              </div>
              <div className={`flex items-center gap-2 ${selectedRooms.length > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                {selectedRooms.length > 0 ? <CheckCircle className="h-4 w-4 text-green-500" /> : <ChevronRight className="h-4 w-4" />}
                Rooms selected ({selectedRooms.length})
              </div>
            </div>

            <div className="mt-auto">
              <Button
                className="w-full"
                onClick={handleGenerate}
                disabled={generating || !selectedExam || selectedRooms.length === 0}
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Generate Seating Plan
                  </>
                )}
              </Button>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                Existing seating for this exam will be replaced.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Generated Seating Plans Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Current Seating Registrations</CardTitle>
            <CardDescription>Student–exam registrations used as the base for seating allocation</CardDescription>
          </CardHeader>
          <CardContent>
            {seatingPlans.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                <Grid2X2 className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No registrations found. Register students for exams first.</p>
              </div>
            ) : (
              <div className="overflow-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Exam ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {seatingPlans.slice(0, 50).map((row, i) => (
                      <TableRow key={String(row.id ?? i)}>
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell>{String(row.student_id)}</TableCell>
                        <TableCell>{String(row.exam_id)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {seatingPlans.length > 50 && (
                  <p className="px-4 py-2 text-xs text-muted-foreground">
                    Showing 50 of {seatingPlans.length} registrations.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

function SeatingPageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
      <Skeleton className="h-64" />
    </div>
  )
}
