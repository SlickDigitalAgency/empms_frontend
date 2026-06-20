import { NavLink, Outlet, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import { LayoutDashboard, List, UserCheck, Building2, BarChart2 } from "lucide-react"

const seatingNav = [
  { path: "/seating", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { path: "/seating/plans", label: "Seating Plans", icon: List },
  { path: "/seating/student-slip", label: "Student Slip", icon: UserCheck },
  { path: "/seating/room-plan", label: "Room Plan", icon: Building2 },
  { path: "/seating/reports", label: "Reports", icon: BarChart2 },
]

export function SeatingLayout() {
  const location = useLocation()

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold tracking-tight">Seating Management</h2>
        <p className="text-sm text-muted-foreground">Manage exam seating, generate student slips, and print room charts.</p>
      </div>

      <div className="flex space-x-2 overflow-x-auto pb-2">
        {seatingNav.map((item) => {
          const Icon = item.icon
          const isActive = item.exact
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path)

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`relative flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-muted ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
              {isActive && (
                <motion.div
                  layoutId="seatingTabActive"
                  className="absolute inset-0 rounded-md border-b-2 border-primary bg-primary/5"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </NavLink>
          )
        })}
      </div>

      <div className="pt-2">
        <Outlet />
      </div>
    </div>
  )
}
