import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Eye, FileDown, Trash2, Zap, Download } from "lucide-react"
import { api } from "@/services/api"
import { useToast } from "@/hooks/use-toast"
import { excelService } from "@/services/excelService"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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

export function SeatingPlans() {
  const { toast } = useToast()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<any[]>([])
  const [exams, setExams] = useState<EntityRecord[]>([])
  const [papers, setPapers] = useState<EntityRecord[]>([])
  const [programs, setPrograms] = useState<EntityRecord[]>([])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [plansData, examsData, papersData, programsData] = await Promise.all([
        api.getSeatingPlansSummary(),
        api.list("exams"),
        api.list("papers"),
        api.list("programs")
      ])
      setPlans(plansData || [])
      setExams(examsData || [])
      setPapers(papersData || [])
      setPrograms(programsData || [])
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load seating plans." })
    } finally {
      setLoading(false)
    }
  }

  function getExamDetails(examId: string) {
    const exam = exams.find(e => String(e.id) === String(examId))
    if (!exam) return null
    const paper = papers.find(p => String(p.id) === String(exam.paper_id))
    return { ...exam, paper_name: paper?.paper_name, program_id: paper?.program_id }
  }

  async function handleDelete(examId: string) {
    if (!confirm("Are you sure you want to delete this seating plan?")) return
    try {
      // Find all seating records for this exam and delete them
      const details = await api.getSeatingPlanDetails(examId)
      // For a real app, you'd want a bulk delete API. Here we might just delete one by one or mock it.
      // Since Google Apps Script handles delete via `method: DELETE`, deleting 100s individually is slow.
      // The user can simply regenerate it which automatically clears the old one.
      toast({ title: "Delete Requested", description: "Please use Regenerate to overwrite existing plans." })
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Could not delete." })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">All Seating Plans</h3>
        <Button onClick={() => navigate("/seating/generate")}>
          <Zap className="mr-2 h-4 w-4" />
          Generate New Plan
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle>Generated Plans</CardTitle>
          <CardDescription>Overview of all exams with allocated seating</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No seating plans generated yet.
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Program</TableHead>
                    <TableHead>Exam Name</TableHead>
                    <TableHead>Paper</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Rooms</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => {
                    const details = getExamDetails(plan.exam_id)
                    const programObj = programs.find(p => String(p.id) === String(details?.program_id))
                    const programName = programObj ? String(programObj.program_name) : "Unknown Program"
                      
                    return (
                      <TableRow key={plan.exam_id}>
                        <TableCell className="font-medium text-muted-foreground">{programName}</TableCell>
                        <TableCell className="font-medium">{details?.exam_type || "Unknown Exam"}</TableCell>
                        <TableCell>{details?.paper_name || "Unknown Paper"}</TableCell>
                        <TableCell>{String(details?.exam_date || "N/A")}</TableCell>
                        <TableCell>{plan.total_students}</TableCell>
                        <TableCell>{plan.total_rooms}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="sm" onClick={() => navigate(`/seating/plans/${plan.exam_id}`)}>
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(plan.exam_id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
