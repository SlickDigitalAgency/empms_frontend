import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { FileBarChart, Download, RefreshCw, Loader2, Users, BookOpen, Building2, ShieldAlert } from "lucide-react"
import { api } from "@/services/api"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { EntityRecord } from "@/types"

export function ReportsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState<string | null>(null)

  const [students, setStudents] = useState<EntityRecord[]>([])
  const [programs, setPrograms] = useState<EntityRecord[]>([])
  const [exams, setExams] = useState<EntityRecord[]>([])
  const [rooms, setRooms] = useState<EntityRecord[]>([])
  const [ufm, setUfm] = useState<EntityRecord[]>([])
  const [attendance, setAttendance] = useState<EntityRecord[]>([])
  const [papers, setPapers] = useState<EntityRecord[]>([])

  async function loadAll() {
    setLoading(true)
    try {
      const [s, p, e, r, u, a, pa] = await Promise.all([
        api.list("students"),
        api.list("programs"),
        api.list("exams"),
        api.list("rooms"),
        api.list("ufm"),
        api.list("attendance"),
        api.list("papers"),
      ])
      setStudents(s)
      setPrograms(p)
      setExams(e)
      setRooms(r)
      setUfm(u)
      setAttendance(a)
      setPapers(pa)
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Could not load report data." })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadAll() }, [])

  function getProgramName(id: string) {
    return String(programs.find((p) => String(p.id) === id)?.program_name ?? id)
  }
  function getPaperName(id: string) {
    return String(papers.find((p) => String(p.id) === id)?.paper_name ?? id)
  }
  function getStudentName(id: string) {
    return String(students.find((s) => String(s.id) === id)?.student_name ?? id)
  }

  async function handleExport(kind: string, label: string) {
    setExporting(kind)
    try {
      const result = await api.document(kind, {})
      window.open(result.url, "_blank")
    } catch (err) {
      toast({
        variant: "destructive",
        title: `${label} Export Failed`,
        description: err instanceof Error ? err.message : "Could not generate report.",
      })
    } finally {
      setExporting(null)
    }
  }

  if (loading) return <ReportsSkeleton />

  // Summary stats
  const activeStudents = students.filter((s) => s.status === "Active").length
  const upcomingExams = exams.filter((e) => new Date(String(e.exam_date)) >= new Date()).length
  const availableRooms = rooms.filter((r) => r.status === "Available").length
  const openUfm = ufm.filter((u) => u.status === "Open").length
  const presentAttendance = attendance.filter((a) => a.attendance_status === "Present").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <FileBarChart className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Reports</h2>
            <p className="text-sm text-muted-foreground">System-wide analytics and data exports</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={loadAll}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </motion.div>

      {/* Summary cards */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
      >
        {[
          { label: "Active Students", value: activeStudents, icon: Users, color: "text-indigo-500" },
          { label: "Upcoming Exams", value: upcomingExams, icon: BookOpen, color: "text-teal-500" },
          { label: "Available Rooms", value: availableRooms, icon: Building2, color: "text-amber-500" },
          { label: "Open UFM Cases", value: openUfm, icon: ShieldAlert, color: "text-rose-500" },
          { label: "Present (All Time)", value: presentAttendance, icon: Users, color: "text-green-500" },
        ].map((stat) => (
          <Card key={stat.label} className="shadow-card">
            <CardContent className="p-4">
              <stat.icon className={`h-5 w-5 mb-2 ${stat.color}`} />
              <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Tabs defaultValue="students">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="exams">Exams</TabsTrigger>
              <TabsTrigger value="rooms">Rooms</TabsTrigger>
              <TabsTrigger value="ufm">UFM Cases</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
            </TabsList>
          </div>

          {/* Students tab */}
          <TabsContent value="students">
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base">Student Report</CardTitle>
                  <CardDescription>{students.length} total students</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleExport("student_report", "Student Report")} disabled={!!exporting}>
                  {exporting === "student_report" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  Export PDF
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Roll No.</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Program</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.slice(0, 20).map((s, i) => (
                        <TableRow key={String(s.id ?? i)}>
                          <TableCell className="font-mono text-xs">{String(s.roll_number)}</TableCell>
                          <TableCell className="font-medium">{String(s.student_name)}</TableCell>
                          <TableCell>{getProgramName(String(s.program_id))}</TableCell>
                          <TableCell><Badge variant="secondary" className="text-xs">{String(s.level)}</Badge></TableCell>
                          <TableCell>
                            <Badge variant={s.status === "Active" ? "default" : "secondary"} className="text-xs">
                              {String(s.status)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {students.length === 0 && (
                        <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No students found.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                {students.length > 20 && <p className="mt-2 text-xs text-muted-foreground">Showing 20 of {students.length}.</p>}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Exams tab */}
          <TabsContent value="exams">
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base">Exam Schedule Report</CardTitle>
                  <CardDescription>{exams.length} total exams · {upcomingExams} upcoming</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleExport("exam_report", "Exam Report")} disabled={!!exporting}>
                  {exporting === "exam_report" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  Export PDF
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Paper</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Start</TableHead>
                        <TableHead>End</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exams.slice(0, 20).map((e, i) => (
                        <TableRow key={String(e.id ?? i)}>
                          <TableCell className="font-medium">{getPaperName(String(e.paper_id))}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{String(e.exam_type)}</Badge></TableCell>
                          <TableCell>{String(e.exam_date)}</TableCell>
                          <TableCell>{String(e.start_time)}</TableCell>
                          <TableCell>{String(e.end_time)}</TableCell>
                        </TableRow>
                      ))}
                      {exams.length === 0 && (
                        <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No exams scheduled.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rooms tab */}
          <TabsContent value="rooms">
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Room Report</CardTitle>
                <CardDescription>{rooms.length} total rooms · {availableRooms} available</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Room</TableHead>
                        <TableHead>Building</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rooms.map((r, i) => (
                        <TableRow key={String(r.id ?? i)}>
                          <TableCell className="font-medium">{String(r.room_number)}</TableCell>
                          <TableCell>{String(r.building)}</TableCell>
                          <TableCell>{String(r.capacity)}</TableCell>
                          <TableCell>
                            <Badge variant={r.status === "Available" ? "default" : "secondary"} className="text-xs">
                              {String(r.status)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {rooms.length === 0 && (
                        <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No rooms found.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* UFM tab */}
          <TabsContent value="ufm">
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base">UFM Cases Report</CardTitle>
                  <CardDescription>{ufm.length} total cases · {openUfm} open</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleExport("ufm_report", "UFM Report")} disabled={!!exporting}>
                  {exporting === "ufm_report" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  Export PDF
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Paper</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Decision</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ufm.map((u, i) => (
                        <TableRow key={String(u.id ?? i)}>
                          <TableCell className="font-medium">{getStudentName(String(u.student_id))}</TableCell>
                          <TableCell>{getPaperName(String(u.paper_id))}</TableCell>
                          <TableCell>
                            <Badge
                              variant={u.status === "Open" ? "destructive" : u.status === "Decided" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {String(u.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                            {String(u.decision || "Pending")}
                          </TableCell>
                        </TableRow>
                      ))}
                      {ufm.length === 0 && (
                        <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No UFM cases found.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance tab */}
          <TabsContent value="attendance">
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base">Attendance Report</CardTitle>
                  <CardDescription>{attendance.length} records · {presentAttendance} present</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleExport("attendance_report", "Attendance")} disabled={!!exporting}>
                  {exporting === "attendance_report" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  Export PDF
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Exam ID</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendance.slice(0, 30).map((a, i) => (
                        <TableRow key={String(a.id ?? i)}>
                          <TableCell className="font-medium">{getStudentName(String(a.student_id))}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{String(a.exam_id)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={a.attendance_status === "Present" ? "default" : a.attendance_status === "Absent" ? "destructive" : "secondary"}
                              className="text-xs"
                            >
                              {String(a.attendance_status)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {attendance.length === 0 && (
                        <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground">No attendance records found.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}

function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-48" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  )
}
