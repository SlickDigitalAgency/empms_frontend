import { useState, useEffect, useRef } from "react"
import { Search, Printer, Download, UserCheck } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { useReactToPrint } from "react-to-print"
import { api } from "@/services/api"
import { pdfService } from "@/services/pdfService"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { EntityRecord } from "@/types"

export function StudentSlip() {
  const { toast } = useToast()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [student, setStudent] = useState<EntityRecord | null>(null)
  const [seatingRecords, setSeatingRecords] = useState<any[]>([])
  
  // References
  const [exams, setExams] = useState<EntityRecord[]>([])
  const [papers, setPapers] = useState<EntityRecord[]>([])
  const [rooms, setRooms] = useState<EntityRecord[]>([])
  const [programs, setPrograms] = useState<EntityRecord[]>([])

  const slipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadRefs() {
      try {
        const [e, p, r, pr] = await Promise.all([
          api.list("exams"),
          api.list("papers"),
          api.list("rooms"),
          api.list("programs")
        ])
        setExams(e)
        setPapers(p)
        setRooms(r)
        setPrograms(pr)
      } catch (err) {
        console.error("Failed to load refs for slip", err)
      }
    }
    loadRefs()
  }, [])

  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!searchQuery.trim()) return

    setSearching(true)
    setStudent(null)
    setSeatingRecords([])

    try {
      // 1. Find the student
      const allStudents = await api.list("students")
      const query = searchQuery.toLowerCase()
      const found = allStudents.find(s => 
        String(s.roll_number).toLowerCase() === query ||
        String(s.registration_number).toLowerCase() === query ||
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(query)
      )

      if (!found) {
        toast({ title: "Not Found", description: "No student matches the search query." })
        return
      }

      setStudent(found)

      // 2. Fetch seating records for this student
      const seating = await api.getStudentSeating(String(found.id))
      setSeatingRecords(seating || [])
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Search failed." })
    } finally {
      setSearching(false)
    }
  }

  const handlePrint = useReactToPrint({
    contentRef: slipRef,
    documentTitle: `Student_Slip_${student?.roll_number || "unknown"}`,
  })

  async function handleDownloadPdf() {
    if (!slipRef.current) return
    await pdfService.exportHtmlToPdf(
      "student-slip-container", 
      `Student_Slip_${student?.roll_number || "unknown"}`
    )
  }

  function getExamDetails(examId: string) {
    const exam = exams.find(e => String(e.id) === String(examId))
    const paper = papers.find(p => String(p.id) === String(exam?.paper_id))
    return { ...exam, ...paper }
  }

  function getRoomDetails(roomId: string) {
    return rooms.find(r => String(r.id) === String(roomId))
  }

  function getProgramDetails(programId: string) {
    return programs.find(p => String(p.id) === String(programId))
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Card className="shadow-sm">
        <CardHeader className="pb-4 border-b">
          <CardTitle>Student Seating Slip</CardTitle>
          <CardDescription>Search by Roll No, Reg No, or Name to generate a printable slip.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
            <Input 
              placeholder="Enter Roll No or Name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button type="submit" disabled={searching}>
              <Search className="mr-2 h-4 w-4" />
              {searching ? "Searching..." : "Search"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {student && seatingRecords.length === 0 && (
        <Card className="border-dashed border-2 bg-muted/20 shadow-none">
          <CardContent className="py-12 text-center text-muted-foreground">
            <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-20" />
            <p>Student found, but no seating allocations exist yet.</p>
          </CardContent>
        </Card>
      )}

      {student && seatingRecords.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleDownloadPdf}>
              <Download className="mr-2 h-4 w-4" /> Save as PDF
            </Button>
            <Button onClick={() => handlePrint()}>
              <Printer className="mr-2 h-4 w-4" /> Print Slip
            </Button>
          </div>

          <div className="bg-white text-black p-8 rounded-lg shadow-sm border overflow-x-auto">
            <div 
              ref={slipRef} 
              id="student-slip-container"
              className="w-[800px] min-w-[800px] mx-auto bg-white p-8 box-border"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {/* Slip Header */}
              <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 bg-gray-200 rounded flex items-center justify-center border border-gray-400 font-bold text-gray-500 text-xs text-center">
                    LOGO
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold uppercase tracking-wider m-0 p-0 text-black">Government Institute of Technology</h1>
                    <p className="text-sm font-medium text-gray-700 m-0 mt-1">Examination Board</p>
                    <p className="text-xs text-gray-500 m-0 mt-1">Student Examination & Seating Slip</p>
                  </div>
                </div>
                <div className="p-2 border rounded bg-gray-50">
                  <QRCodeSVG 
                    value={`EMPMS:SLIP:${student.roll_number}:${student.id}`}
                    size={80}
                  />
                </div>
              </div>

              {/* Student Info */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Student Name</p>
                  <p className="font-bold text-lg text-black">{student.first_name} {student.last_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Roll Number</p>
                  <p className="font-bold text-lg text-black">{String(student.roll_number)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Father's Name</p>
                  <p className="font-semibold text-black">{String(student.father_name || "N/A")}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Registration No</p>
                  <p className="font-semibold text-black">{String(student.registration_number || "N/A")}</p>
                </div>
                <div className="col-span-2 pt-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Program</p>
                  <p className="font-semibold text-black">
                    {getProgramDetails(String(student.program_id))?.program_name || "N/A"}
                  </p>
                </div>
              </div>

              {/* Seating Table */}
              <h3 className="text-sm font-bold uppercase border-b border-gray-300 pb-2 mb-4 text-black">Allocated Seats</h3>
              <table className="w-full text-left border-collapse mb-12">
                <thead>
                  <tr className="bg-gray-100 text-black border-y border-gray-300">
                    <th className="py-2 px-3 text-xs font-bold uppercase">Date & Time</th>
                    <th className="py-2 px-3 text-xs font-bold uppercase">Paper</th>
                    <th className="py-2 px-3 text-xs font-bold uppercase">Room & Bldg</th>
                    <th className="py-2 px-3 text-xs font-bold uppercase">Seat No</th>
                  </tr>
                </thead>
                <tbody>
                  {seatingRecords.map((row, i) => {
                    const exam = getExamDetails(row.exam_id)
                    const room = getRoomDetails(row.room_id)
                    return (
                      <tr key={i} className="border-b border-gray-200">
                        <td className="py-3 px-3 text-sm">
                          <div className="font-semibold text-black">{String(exam?.exam_date || "N/A")}</div>
                          <div className="text-xs text-gray-600">{String(exam?.start_time)} - {String(exam?.end_time)}</div>
                        </td>
                        <td className="py-3 px-3 text-sm font-medium text-black">
                          {String(exam?.paper_name || "N/A")}
                        </td>
                        <td className="py-3 px-3 text-sm text-black">
                          <span className="font-bold">Room {String(room?.room_number || "N/A")}</span>
                          <span className="block text-xs text-gray-600">{String(room?.building || "N/A")}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-block px-3 py-1 bg-black text-white font-bold rounded text-lg">
                            {row.seat_number}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* Signatures */}
              <div className="flex justify-between mt-16 pt-8 px-8">
                <div className="text-center">
                  <div className="w-40 border-b border-black mb-2"></div>
                  <p className="text-xs font-bold text-black uppercase">Student Signature</p>
                </div>
                <div className="text-center">
                  <div className="w-40 border-b border-black mb-2"></div>
                  <p className="text-xs font-bold text-black uppercase">Controller of Exams</p>
                </div>
              </div>
              
              <p className="text-center text-[10px] text-gray-400 mt-12">
                Generated by EMPMS on {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
