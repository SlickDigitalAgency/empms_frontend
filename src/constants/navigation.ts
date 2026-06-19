import {
  BarChart3,
  BookOpen,
  Building2,
  CalendarClock,
  ClipboardCheck,
  FileBarChart,
  FileText,
  Grid2X2,
  GraduationCap,
  LayoutDashboard,
  Settings,
  ShieldAlert,
  UserCheck,
  Users,
} from "lucide-react"

export const navigationItems = [
  { title: "Dashboard", path: "/", icon: LayoutDashboard },
  { title: "Programs", path: "/programs", icon: GraduationCap },
  { title: "Students", path: "/students", icon: Users },
  { title: "Papers", path: "/papers", icon: BookOpen },
  { title: "Exam Schedule", path: "/exams", icon: CalendarClock },
  { title: "Registration", path: "/registration", icon: UserCheck },
  { title: "Rooms", path: "/rooms", icon: Building2 },
  { title: "Seating Plan", path: "/seating", icon: Grid2X2 },
  { title: "Duty Roster", path: "/duties", icon: ClipboardCheck },
  { title: "Attendance", path: "/attendance", icon: FileText },
  { title: "UFM Cases", path: "/ufm", icon: ShieldAlert },
  { title: "Reports", path: "/reports", icon: FileBarChart },
  { title: "Settings", path: "/settings", icon: Settings },
]

export const dashboardCards = [
  { key: "totalPrograms", label: "Total Programs", icon: GraduationCap },
  { key: "totalStudents", label: "Total Students", icon: Users },
  { key: "totalPapers", label: "Total Papers", icon: BookOpen },
  { key: "upcomingExams", label: "Upcoming Exams", icon: CalendarClock },
  { key: "availableRooms", label: "Available Rooms", icon: Building2 },
  { key: "generatedSeatingPlans", label: "Seating Plans", icon: BarChart3 },
] as const
