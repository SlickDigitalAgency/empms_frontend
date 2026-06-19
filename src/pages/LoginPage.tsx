import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion } from "framer-motion"
import { GraduationCap, Lock, Mail, Eye, EyeOff, Loader2 } from "lucide-react"
import { useAuth } from "@/services/auth"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

type LoginForm = z.infer<typeof loginSchema>

const features = [
  "Exam Schedule Management",
  "Automatic Seating Plans",
  "Student Registration & Admit Cards",
  "Duty Roster & Attendance",
  "UFM Case Tracking",
  "Comprehensive Reports",
]

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(values: LoginForm) {
    setLoading(true)
    try {
      await login(values.email, values.password)
      navigate("/", { replace: true })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: err instanceof Error ? err.message : "Invalid credentials. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left — Brand Panel */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, hsl(245 58% 20%) 0%, hsl(228 50% 13%) 40%, hsl(172 66% 25%) 100%)",
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/4 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight">EMPMS</p>
              <p className="text-xs text-white/60">Exam Meeting Plan Management System</p>
            </div>
          </div>

          {/* Hero text */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl xl:text-5xl font-bold leading-tight">
                Streamline Your
                <br />
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(90deg, hsl(172 66% 60%), hsl(199 89% 65%))" }}>
                  Examination Process
                </span>
              </h1>
              <p className="mt-4 text-lg text-white/70 max-w-md">
                A complete enterprise solution for managing exams, students, seating, and reports — all in one place.
              </p>
            </div>

            {/* Feature list */}
            <ul className="space-y-2.5">
              {features.map((feature, i) => (
                <motion.li
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
                  className="flex items-center gap-3 text-sm text-white/80"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-[10px] font-bold text-white shrink-0">
                    ✓
                  </span>
                  {feature}
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <p className="text-xs text-white/40">© {new Date().getFullYear()} EMPMS — Educational Examination Management</p>
        </div>
      </motion.div>

      {/* Right — Login Form */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-1 flex-col items-center justify-center p-6 sm:p-10 bg-background"
      >
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2 mb-10">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold">EMPMS</span>
        </div>

        <div className="w-full max-w-sm space-y-8">
          {/* Heading */}
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="text-sm text-muted-foreground">Sign in to your admin account to continue.</p>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="admin@institute.edu"
                          className="pl-10"
                          autoComplete="email"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-10 pr-10"
                          autoComplete="current-password"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full font-semibold"
                disabled={loading}
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </Form>

          {/* Hint */}
          <p className="text-center text-xs text-muted-foreground">
            Contact your system administrator if you have trouble logging in.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
