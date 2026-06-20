import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Users, Building2, CalendarClock, List, Percent } from "lucide-react"
import { api } from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function SeatingDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPlans: 0,
    totalStudents: 0,
    totalRooms: 0,
    latestExam: "N/A",
    occupancy: 0,
  })

  useEffect(() => {
    async function loadStats() {
      try {
        const [plans, rooms] = await Promise.all([
          api.getSeatingPlansSummary(),
          api.list("rooms"),
        ])
        
        let students = 0
        let roomsUsed = 0
        let latest = "N/A"
        
        if (plans && plans.length > 0) {
          students = plans.reduce((acc, p) => acc + p.total_students, 0)
          roomsUsed = plans.reduce((acc, p) => acc + p.total_rooms, 0)
          latest = String(plans[plans.length - 1].exam_id)
        }
        
        const totalCapacity = rooms.reduce((acc, r) => acc + Number(r.capacity || 0), 0)
        // Average occupancy per exam
        const occupancy = totalCapacity > 0 && plans.length > 0
          ? Math.round(((students / plans.length) / totalCapacity) * 100)
          : 0

        setStats({
          totalPlans: plans?.length || 0,
          totalStudents: students,
          totalRooms: roomsUsed,
          latestExam: latest,
          occupancy,
        })
      } catch (err) {
        console.error("Error loading seating dashboard stats", err)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    )
  }

  const statCards = [
    { title: "Total Plans", value: stats.totalPlans, icon: List, color: "text-blue-500" },
    { title: "Students Seated", value: stats.totalStudents, icon: Users, color: "text-indigo-500" },
    { title: "Rooms Utilized", value: stats.totalRooms, icon: Building2, color: "text-purple-500" },
    { title: "Latest Exam ID", value: stats.latestExam, icon: CalendarClock, color: "text-emerald-500" },
    { title: "Avg Occupancy", value: `${stats.occupancy}%`, icon: Percent, color: "text-amber-500" },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="shadow-sm border-sidebar-border hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
      
      {/* Visual or quick action section could go here */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="rounded-xl border border-dashed border-primary/20 bg-primary/5 p-8 text-center"
      >
        <h3 className="text-lg font-semibold mb-2">Welcome to Seating Management</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Use the navigation above to browse existing seating plans, generate student slips, print room-wise seating charts, and export data.
        </p>
      </motion.div>
    </div>
  )
}
