import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { AuthProvider, useAuth } from "@/services/auth"
import { Toaster } from "@/components/ui/toaster"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { LoginPage } from "@/pages/LoginPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { ModulePage } from "@/pages/ModulePage"
import { SeatingPage } from "@/pages/SeatingPage"
import { ReportsPage } from "@/pages/ReportsPage"
import { SettingsPage } from "@/pages/SettingsPage"
import type { EntityName } from "@/types"

/** Redirects unauthenticated users to /login */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

/** Redirects authenticated users away from /login */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>
}

/** Helper: renders a ModulePage for a given entity */
function EntityPage({ entity }: { entity: EntityName }) {
  return <ModulePage entity={entity} />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          {/* Protected — all wrapped in DashboardLayout */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/programs" element={<EntityPage entity="programs" />} />
                    <Route path="/students" element={<EntityPage entity="students" />} />
                    <Route path="/papers" element={<EntityPage entity="papers" />} />
                    <Route path="/exams" element={<EntityPage entity="exams" />} />
                    <Route path="/registration" element={<EntityPage entity="registration" />} />
                    <Route path="/rooms" element={<EntityPage entity="rooms" />} />
                    <Route path="/seating" element={<SeatingPage />} />
                    <Route path="/duties" element={<EntityPage entity="duties" />} />
                    <Route path="/attendance" element={<EntityPage entity="attendance" />} />
                    <Route path="/ufm" element={<EntityPage entity="ufm" />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </AuthProvider>
  )
}
