import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { TrendingUp, RefreshCw, AlertCircle } from "lucide-react"
import { api } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { dashboardCards } from "@/constants/navigation"
import type { DashboardStats } from "@/types"

const statCardGradients = [
  "stat-card-indigo",
  "stat-card-teal",
  "stat-card-amber",
  "stat-card-pink",
  "stat-card-blue",
  "stat-card-purple",
]

const PIE_COLORS = [
  "#6366f1", "#14b8a6", "#f59e0b", "#ec4899", "#3b82f6", "#8b5cf6", "#10b981",
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  async function load() {
    setLoading(true)
    setError("")
    try {
      const data = await api.dashboard()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  if (loading) return <DashboardSkeleton />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-7 w-7 text-destructive" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Unable to load dashboard</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">{error}</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    )
  }

  const statValues: Record<string, number> = {
    totalPrograms: stats?.totalPrograms ?? 0,
    totalStudents: stats?.totalStudents ?? 0,
    totalPapers: stats?.totalPapers ?? 0,
    upcomingExams: stats?.upcomingExams ?? 0,
    availableRooms: stats?.availableRooms ?? 0,
    generatedSeatingPlans: stats?.generatedSeatingPlans ?? 0,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
          <p className="text-sm text-muted-foreground">Overview of your examination management system</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
      >
        {dashboardCards.map((card, index) => {
          const Icon = card.icon
          const value = statValues[card.key] ?? 0
          return (
            <motion.div key={card.key} variants={itemVariants}>
              <Card className="relative overflow-hidden border-0 shadow-card hover:shadow-card-hover transition-shadow duration-300 group">
                {/* Gradient top strip */}
                <div className={`absolute inset-x-0 top-0 h-1 ${statCardGradients[index]}`} />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {card.label}
                      </p>
                      <p className="mt-1.5 text-3xl font-bold text-foreground tabular-nums">
                        {value.toLocaleString()}
                      </p>
                    </div>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${statCardGradients[index]} text-white shadow-md group-hover:scale-110 transition-transform`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Charts row */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-6 lg:grid-cols-5"
      >
        {/* Students by Program — Bar Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-3">
          <Card className="shadow-card h-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-primary" />
                Students by Program
              </CardTitle>
              <CardDescription>Enrollment distribution across all programs</CardDescription>
            </CardHeader>
            <CardContent>
              {(stats?.studentsByProgram?.length ?? 0) === 0 ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={stats!.studentsByProgram} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }}
                      cursor={{ fill: "hsl(var(--muted))" }}
                    />
                    <Bar dataKey="students" name="Students" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Room Utilization — Pie Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="shadow-card h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Room Utilization</CardTitle>
              <CardDescription>Seats used vs total capacity</CardDescription>
            </CardHeader>
            <CardContent>
              {(stats?.roomUtilization?.length ?? 0) === 0 ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={stats!.roomUtilization.map((r) => ({ name: r.room, value: r.used }))}
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {stats!.roomUtilization.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Exam timeline */}
      <motion.div variants={itemVariants} initial="hidden" animate="visible">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Exam Schedule Timeline</CardTitle>
            <CardDescription>Number of exams scheduled per date</CardDescription>
          </CardHeader>
          <CardContent>
            {(stats?.examTimeline?.length ?? 0) === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={stats!.examTimeline} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }}
                    cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1, strokeDasharray: "4 2" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="exams"
                    name="Exams"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2.5}
                    dot={{ fill: "hsl(var(--accent))", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">
      No data available yet
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Skeleton className="h-72 lg:col-span-3 rounded-xl" />
        <Skeleton className="h-72 lg:col-span-2 rounded-xl" />
      </div>
      <Skeleton className="h-52 rounded-xl" />
    </div>
  )
}
