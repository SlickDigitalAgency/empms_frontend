import { createContext, useContext, useMemo, useState } from "react"
import { api, clearToken, getToken, setToken } from "@/services/api"

type AdminUser = {
  email: string
  name: string
}

type AuthContextValue = {
  user: AdminUser | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const USER_KEY = "empms_admin_user"
const AuthContext = createContext<AuthContextValue | null>(null)

function readUser() {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw || !getToken()) return null
  try {
    return JSON.parse(raw) as AdminUser
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(readUser)

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user && getToken()),
      login: async (email, password) => {
        const result = await api.login(email, password)
        setToken(result.token)
        localStorage.setItem(USER_KEY, JSON.stringify(result.admin))
        setUser(result.admin)
      },
      logout: () => {
        clearToken()
        localStorage.removeItem(USER_KEY)
        setUser(null)
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used inside AuthProvider")
  return context
}
