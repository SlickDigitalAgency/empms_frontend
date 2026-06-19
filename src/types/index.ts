import type { LucideIcon } from "lucide-react"
import type { z } from "zod"

export type EntityName =
  | "programs"
  | "sessions"
  | "students"
  | "papers"
  | "exams"
  | "registration"
  | "rooms"
  | "duties"
  | "attendance"
  | "ufm"

export type RecordValue = string | number | boolean | null | undefined
export type EntityRecord = { id?: string; [key: string]: RecordValue }

export type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

export type ApiMethod = "GET" | "POST" | "PUT" | "DELETE"

export type Option = {
  label: string
  value: string
}

export type FieldType =
  | "text"
  | "number"
  | "date"
  | "time"
  | "textarea"
  | "select"
  | "phone"
  | "cnic"

export type FormField = {
  name: string
  label: string
  type: FieldType
  placeholder?: string
  required?: boolean
  options?: Option[]
  optionsFrom?: EntityName
  optionLabel?: string
  grid?: "full" | "half"
}

export type ColumnDef = {
  key: string
  label: string
  sortable?: boolean
  badge?: boolean
  relation?: EntityName
  relationLabel?: string
}

export type ModuleDefinition = {
  entity: EntityName
  title: string
  description: string
  singular: string
  route: string
  icon: LucideIcon
  schema: z.ZodObject<Record<string, z.ZodTypeAny>>
  fields: FormField[]
  columns: ColumnDef[]
  filters?: FormField[]
}

export type ReferenceState = Partial<Record<EntityName, EntityRecord[]>>

export type DashboardStats = {
  totalPrograms: number
  totalStudents: number
  totalPapers: number
  upcomingExams: number
  availableRooms: number
  generatedSeatingPlans: number
  studentsByProgram: Array<{ name: string; students: number }>
  examTimeline: Array<{ date: string; exams: number }>
  roomUtilization: Array<{ room: string; used: number; capacity: number }>
}
