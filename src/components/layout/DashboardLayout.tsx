import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { Sidebar } from "./Sidebar"
import { Navbar } from "./Navbar"

type DashboardLayoutProps = {
  children: React.ReactNode
}

/** Applies saved theme on first render */
function applyStoredTheme() {
  const stored = localStorage.getItem("empms_theme")
  if (stored === "dark") {
    document.documentElement.classList.add("dark")
  }
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("empms_sidebar_collapsed") === "true"
  })
  const location = useLocation()

  /* Apply stored theme on mount */
  useEffect(() => {
    applyStoredTheme()
  }, [])

  /* Persist collapse state */
  useEffect(() => {
    localStorage.setItem("empms_sidebar_collapsed", String(collapsed))
  }, [collapsed])

  /* Close mobile drawer on route change */
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        open={mobileOpen}
        collapsed={collapsed}
        onClose={() => setMobileOpen(false)}
        onCollapse={setCollapsed}
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="h-full p-4 lg:p-6"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
