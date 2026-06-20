import { useEffect, useState, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Download, FileText, Printer } from "lucide-react"
import { api } from "@/services/api"
import { pdfService } from "@/services/pdfService"
import { excelService } from "@/services/excelService"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import type { EntityRecord } from "@/types"

export function SeatingDetails() {
  const { examId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [seatingData, setSeatingData] = useState<any[]>([])
  const [refs, setRefs] = useState<{
    exams: EntityRecord[]
    papers: EntityRecord[]
    rooms: EntityRecord[]
    students: EntityRecord[]
  }>({ exams: [], papers: [], rooms: [], students: [] })

  useEffect(() => {
    if (!examId) return
    loadData()
  }, [examId])

  async function loadData() {
    setLoading(true)
    try {
      const [seating, exams, papers, rooms, students] = await Promise.all([
        api.getSeatingPlanDetails(examId!),
        api.list("exams"),
        api.list("papers"),
        api.list("rooms"),
        api.list("students"),
      ])
      setSeatingData(seating || [])
      setRefs({ exams, papers, rooms, students })
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load seating details." })
    } finally {
      setLoading(false)
    }
  }

  const { exam, paper, roomsGrouped, totalSeats } = useMemo(() => {
    const exam = refs.exams.find((e) => String(e.id) === String(examId))
    const paper = refs.papers.find((p) => String(p.id) === String(exam?.paper_id))

    const grouped: Record<string, any[]> = {}
    let totalSeats = 0

    seatingData.forEach((row) => {
      if (!grouped[row.room_id]) grouped[row.room_id] = []
      grouped[row.room_id].push(row)
      totalSeats++
    })

    // Sort rooms by room number/id and seats
    Object.keys(grouped).forEach(roomId => {
      grouped[roomId].sort((a, b) => Number(a.seat_number) - Number(b.seat_number))
    })

    return { exam, paper, roomsGrouped: grouped, totalSeats }
  }, [seatingData, refs, examId])

  function getStudentName(studentId: string) {
    const s = refs.students.find((st) => String(st.id) === String(studentId) || String(st.student_id) === String(studentId))
    return s ? `${s.first_name} ${s.last_name || ""}`.trim() : "Unknown Student"
  }
  
  function getStudentRoll(studentId: string) {
    const s = refs.students.find((st) => String(st.id) === String(studentId) || String(st.student_id) === String(studentId))
    return s?.roll_number || studentId
  }

  function getRoomName(roomId: string) {
    const r = refs.rooms.find((rm) => String(rm.id) === String(roomId))
    return r ? `Room ${r.room_number} (${r.building})` : `Room ${roomId}`
  }

  function handleExportExcel() {
    if (seatingData.length === 0) return
    const exportData = seatingData.map(row => ({
      "Exam ID": row.exam_id,
      "Room": getRoomName(row.room_id),
      "Seat No": row.seat_number,
      "Roll No": getStudentRoll(row.student_id),
      "Student Name": getStudentName(row.student_id)
    }))
    excelService.exportToExcel(exportData, `Seating_Plan_Exam_${examId}`)
  }

  function handleExportPdf() {
    if (seatingData.length === 0) return
    const columns = ["Room", "Seat No", "Roll No", "Student Name"]
    const data = seatingData.map(row => [
      getRoomName(row.room_id),
      String(row.seat_number),
      String(getStudentRoll(row.student_id)),
      getStudentName(row.student_id)
    ])
    
    const title = `Seating Plan - ${paper?.paper_name || "Unknown"} (${exam?.exam_date || ""})`
    pdfService.exportTableToPdf(columns, data, `Seating_Plan_Exam_${examId}`, title)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Exam details not found or invalid ID.</p>
        <Button variant="link" onClick={() => navigate("/seating/plans")}>Return to Plans</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/seating/plans")} className="pl-0">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Plans
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" /> Export Excel
          </Button>
          <Button onClick={handleExportPdf}>
            <Printer className="mr-2 h-4 w-4" /> Download PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle>Exam Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <span className="text-muted-foreground">Paper Name:</span>
              <p className="font-medium">{String(paper?.paper_name || "N/A")}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Exam Date:</span>
              <p className="font-medium">{String(exam?.exam_date || "N/A")}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Time:</span>
              <p className="font-medium">{String(exam?.start_time)} - {String(exam?.end_time)}</p>
            </div>
            <div className="pt-2 border-t flex justify-between">
              <span className="text-muted-foreground">Total Students:</span>
              <Badge variant="secondary">{totalSeats}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Rooms:</span>
              <Badge variant="outline">{Object.keys(roomsGrouped).length}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>Room Allocations</CardTitle>
            <CardDescription>Detailed seat mapping across {Object.keys(roomsGrouped).length} rooms</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(roomsGrouped).length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">No seating data available for this exam.</p>
            ) : (
              <div className="space-y-6">
                {Object.entries(roomsGrouped).map(([roomId, rows]) => (
                  <div key={roomId} className="rounded-lg border overflow-hidden">
                    <div className="bg-muted px-4 py-2 flex justify-between items-center border-b">
                      <h4 className="font-medium text-sm">{getRoomName(roomId)}</h4>
                      <span className="text-xs text-muted-foreground">{rows.length} seats allocated</span>
                    </div>
                    <div className="p-0">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                          <tr>
                            <th className="py-2 px-4 text-left font-medium">Seat</th>
                            <th className="py-2 px-4 text-left font-medium">Roll No</th>
                            <th className="py-2 px-4 text-left font-medium">Student Name</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {rows.map((row) => (
                            <tr key={`${row.room_id}-${row.seat_number}`} className="hover:bg-muted/30">
                              <td className="py-2 px-4 w-20">#{row.seat_number}</td>
                              <td className="py-2 px-4 font-mono">{getStudentRoll(row.student_id)}</td>
                              <td className="py-2 px-4">{getStudentName(row.student_id)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
