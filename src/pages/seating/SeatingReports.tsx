import { useState, useEffect, useRef, useMemo } from "react"
import { Printer, Download, FileSpreadsheet } from "lucide-react"
import { useReactToPrint } from "react-to-print"
import { api } from "@/services/api"
import { pdfService } from "@/services/pdfService"
import { excelService } from "@/services/excelService"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { EntityRecord } from "@/types"

export function SeatingReports() {
  const { toast } = useToast()
  
  const [loadingRefs, setLoadingRefs] = useState(true)
  const [generating, setGenerating] = useState(false)
  
  const [exams, setExams] = useState<EntityRecord[]>([])
  const [rooms, setRooms] = useState<EntityRecord[]>([])
  const [papers, setPapers] = useState<EntityRecord[]>([])
  const [students, setStudents] = useState<EntityRecord[]>([])
  
  const [selectedExam, setSelectedExam] = useState("")
  const [selectedRoom, setSelectedRoom] = useState("")
  const [seatingRecords, setSeatingRecords] = useState<any[]>([])

  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadRefs() {
      try {
        const [e, r, p, s] = await Promise.all([
          api.list("exams"),
          api.list("rooms"),
          api.list("papers"),
          api.list("students")
        ])
        setExams(e)
        setRooms(r)
        setPapers(p)
        setStudents(s)
      } catch (err) {
        toast({ variant: "destructive", title: "Error", description: "Failed to load references." })
      } finally {
        setLoadingRefs(false)
      }
    }
    loadRefs()
  }, [toast])

  async function handleGenerate() {
    if (!selectedExam || !selectedRoom) return
    setGenerating(true)
    try {
      const records = await api.getRoomSeating(selectedRoom, selectedExam)
      // Sort by seat number
      records.sort((a, b) => Number(a.seat_number) - Number(b.seat_number))
      setSeatingRecords(records)
      
      if (records.length === 0) {
        toast({ title: "No Data", description: "No students allocated to this room for this exam." })
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Could not fetch attendance sheet." })
    } finally {
      setGenerating(false)
    }
  }

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Attendance_Sheet_${selectedRoom}_Exam_${selectedExam}`,
  })

  async function handleDownloadPdf() {
    if (!printRef.current) return
    await pdfService.exportHtmlToPdf(
      "attendance-sheet-container", 
      `Attendance_Sheet_${selectedRoom}_Exam_${selectedExam}`,
      true // landscape
    )
  }

  function handleExportExcel() {
    if (seatingRecords.length === 0) return
    const exportData = seatingRecords.map(row => ({
      "Seat No": row.seat_number,
      "Roll No": getStudentRoll(row.student_id),
      "Student Name": getStudentName(row.student_id),
      "Signature": "",
      "Present/Absent": "",
      "Remarks": ""
    }))
    excelService.exportToExcel(exportData, `Attendance_Sheet_${selectedRoom}`)
  }

  const { examObj, paperObj, roomObj } = useMemo(() => {
    const examObj = exams.find(e => String(e.id) === selectedExam)
    const paperObj = papers.find(p => String(p.id) === String(examObj?.paper_id))
    const roomObj = rooms.find(r => String(r.id) === selectedRoom)
    return { examObj, paperObj, roomObj }
  }, [selectedExam, selectedRoom, exams, papers, rooms])

  function getStudentName(studentId: string) {
    const s = students.find((st) => String(st.id) === String(studentId) || String(st.student_id) === String(studentId))
    return s ? `${s.first_name} ${s.last_name || ""}`.trim() : "Unknown"
  }
  
  function getStudentRoll(studentId: string) {
    const s = students.find((st) => String(st.id) === String(studentId) || String(st.student_id) === String(studentId))
    return s?.roll_number || studentId
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Card className="shadow-sm">
        <CardHeader className="pb-4 border-b">
          <CardTitle>Attendance Sheet Generator</CardTitle>
          <CardDescription>Generate printable attendance sheets from seating plan data.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1.5 w-64">
              <label className="text-xs font-medium text-muted-foreground">Select Exam</label>
              <Select value={selectedExam} onValueChange={setSelectedExam} disabled={loadingRefs}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an exam" />
                </SelectTrigger>
                <SelectContent>
                  {exams.map(e => (
                    <SelectItem key={String(e.id)} value={String(e.id)}>
                      {String(papers.find(p => String(p.id) === String(e.paper_id))?.paper_name || e.id)} - {String(e.exam_date)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 w-64">
              <label className="text-xs font-medium text-muted-foreground">Select Room</label>
              <Select value={selectedRoom} onValueChange={setSelectedRoom} disabled={loadingRefs}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map(r => (
                    <SelectItem key={String(r.id)} value={String(r.id)}>
                      Room {String(r.room_number)} ({String(r.building)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerate} disabled={generating || !selectedExam || !selectedRoom}>
              {generating ? "Loading..." : "Generate Sheet"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {seatingRecords.length > 0 && examObj && roomObj && (
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleExportExcel}>
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Excel
            </Button>
            <Button variant="outline" onClick={handleDownloadPdf}>
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
            <Button onClick={() => handlePrint()}>
              <Printer className="mr-2 h-4 w-4" /> Print Sheet
            </Button>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-sm border overflow-x-auto">
            <div 
              ref={printRef} 
              id="attendance-sheet-container"
              className="w-[1024px] min-w-[1024px] mx-auto bg-white p-8 box-border"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <div className="text-center mb-6 text-black border-b-2 border-black pb-4">
                <h1 className="text-2xl font-bold uppercase tracking-wider m-0 p-0">Government Institute of Technology</h1>
                <p className="text-lg font-bold m-0 mt-1">EXAMINATION ATTENDANCE SHEET</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 text-black">
                <div>
                  <p className="text-sm"><span className="font-bold">Paper:</span> {String(paperObj?.paper_name || "N/A")}</p>
                  <p className="text-sm"><span className="font-bold">Date:</span> {String(examObj.exam_date)}</p>
                  <p className="text-sm"><span className="font-bold">Time:</span> {String(examObj.start_time)} - {String(examObj.end_time)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm"><span className="font-bold">Room No:</span> {String(roomObj.room_number)}</p>
                  <p className="text-sm"><span className="font-bold">Building:</span> {String(roomObj.building)}</p>
                  <p className="text-sm"><span className="font-bold">Total Present:</span> _______ / {seatingRecords.length}</p>
                </div>
              </div>

              <table className="w-full text-left border-collapse border border-black mb-8 text-black">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-2 text-xs font-bold uppercase border border-black w-12 text-center">Seat</th>
                    <th className="py-2 px-2 text-xs font-bold uppercase border border-black w-24">Roll No</th>
                    <th className="py-2 px-2 text-xs font-bold uppercase border border-black w-48">Student Name</th>
                    <th className="py-2 px-2 text-xs font-bold uppercase border border-black w-32 text-center">Signature</th>
                    <th className="py-2 px-2 text-xs font-bold uppercase border border-black w-24 text-center">P / A</th>
                    <th className="py-2 px-2 text-xs font-bold uppercase border border-black">Remarks / UFM</th>
                  </tr>
                </thead>
                <tbody>
                  {seatingRecords.map((row) => (
                    <tr key={row.seat_number} className="h-10">
                      <td className="py-1 px-2 border border-black text-center font-bold text-sm bg-gray-50">
                        {row.seat_number}
                      </td>
                      <td className="py-1 px-2 border border-black font-mono font-bold text-sm">
                        {getStudentRoll(row.student_id)}
                      </td>
                      <td className="py-1 px-2 border border-black text-sm">
                        {getStudentName(row.student_id)}
                      </td>
                      <td className="py-1 px-2 border border-black"></td>
                      <td className="py-1 px-2 border border-black text-center text-gray-300">P / A</td>
                      <td className="py-1 px-2 border border-black"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="flex justify-between mt-12 pt-8 text-black">
                <div className="text-center w-48">
                  <div className="border-b border-black mb-2"></div>
                  <p className="text-xs font-bold uppercase">Invigilator 1 Signature</p>
                </div>
                <div className="text-center w-48">
                  <div className="border-b border-black mb-2"></div>
                  <p className="text-xs font-bold uppercase">Invigilator 2 Signature</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
