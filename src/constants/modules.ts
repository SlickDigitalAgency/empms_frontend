import {
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardCheck,
  FileText,
  GraduationCap,
  ShieldAlert,
  UserCheck,
  Users,
  ClipboardList,
} from "lucide-react"
import { z } from "zod"
import type { ModuleDefinition, Option } from "@/types"

const required = (label: string) => z.string().trim().min(1, `${label} is required`)
const optional = z.string().trim().optional().or(z.literal(""))
const numberText = (label: string) =>
  z.coerce
    .number({ error: `${label} must be a number` })
    .min(0, `${label} cannot be negative`)
    .transform((value) => String(value))

export const statusOptions: Option[] = [
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
]

const getExamLabel = (row: any, refs: any) => {
  const paper = refs.papers?.find((p: any) => String(p.id) === String(row.paper_id))
  return `${paper?.paper_name ?? "Unknown Paper"} - ${row.exam_type ?? "Unknown Type"}`
}

export const examSystemOptions: Option[] = [
  { label: "Annual", value: "Annual" },
  { label: "Semester", value: "Semester" },
  { label: "Short Course", value: "Short Course" },
]

export const levelOptions: Option[] = [
  { label: "Year 1", value: "Year 1" },
  { label: "Year 2", value: "Year 2" },
  { label: "Year 3", value: "Year 3" },
  { label: "Semester 1", value: "Semester 1" },
  { label: "Semester 2", value: "Semester 2" },
  { label: "Semester 3", value: "Semester 3" },
  { label: "Semester 4", value: "Semester 4" },
  { label: "Final", value: "Final" },
]

export const attendanceOptions: Option[] = [
  { label: "Present", value: "Present" },
  { label: "Absent", value: "Absent" },
  { label: "Late", value: "Late" },
]

export const modules: ModuleDefinition[] = [
  {
    entity: "programs",
    title: "Programs",
    singular: "Program",
    route: "/programs",
    icon: GraduationCap,
    description: "Configure annual, semester, and short-course examination structures.",
    schema: z.object({
      program_code: required("Program code"),
      program_name: required("Program name"),
      system_type: required("System type"),
      duration: required("Duration"),
      total_years: optional,
      total_semesters: optional,
      status: required("Status"),
    }),
    fields: [
      { name: "program_code", label: "Program Code", type: "text", required: true },
      { name: "program_name", label: "Program Name", type: "text", required: true },
      { name: "system_type", label: "System Type", type: "select", options: examSystemOptions, required: true },
      { name: "duration", label: "Duration", type: "text", placeholder: "4 semesters / 3 years / 3 months", required: true },
      { name: "total_years", label: "Total Years", type: "number" },
      { name: "total_semesters", label: "Total Semesters", type: "number" },
      { name: "status", label: "Status", type: "select", options: statusOptions, required: true },
    ],
    columns: [
      { key: "program_code", label: "Code", sortable: true },
      { key: "program_name", label: "Program", sortable: true },
      { key: "system_type", label: "System", badge: true, sortable: true },
      { key: "duration", label: "Duration" },
      { key: "status", label: "Status", badge: true },
    ],
    filters: [{ name: "system_type", label: "System", type: "select", options: examSystemOptions }],
  },
  {
    entity: "sessions",
    title: "Sessions",
    singular: "Session",
    route: "/settings/sessions",
    icon: CalendarDays,
    description: "Manage academic and examination sessions.",
    schema: z.object({
      session_name: required("Session name"),
      start_date: required("Start date"),
      end_date: required("End date"),
      status: required("Status"),
    }),
    fields: [
      { name: "session_name", label: "Session Name", type: "text", required: true },
      { name: "start_date", label: "Start Date", type: "date", required: true },
      { name: "end_date", label: "End Date", type: "date", required: true },
      { name: "status", label: "Status", type: "select", options: statusOptions, required: true },
    ],
    columns: [
      { key: "session_name", label: "Session", sortable: true },
      { key: "start_date", label: "Start" },
      { key: "end_date", label: "End" },
      { key: "status", label: "Status", badge: true },
    ],
  },
  {
    entity: "students",
    title: "Students",
    singular: "Student",
    route: "/students",
    icon: Users,
    description: "Maintain student registrations with program, session, and level mapping.",
    schema: z.object({
      roll_number: required("Roll number"),
      registration_number: required("Registration number"),
      student_name: required("Student name"),
      father_name: required("Father name"),
      cnic: optional,
      phone: optional,
      program_id: required("Program"),
      session_id: required("Session"),
      level: required("Level"),
      status: required("Status"),
    }),
    fields: [
      { name: "roll_number", label: "Roll Number", type: "text", required: true },
      { name: "registration_number", label: "Registration Number", type: "text", required: true },
      { name: "student_name", label: "Student Name", type: "text", required: true },
      { name: "father_name", label: "Father Name", type: "text", required: true },
      { name: "cnic", label: "CNIC", type: "cnic", placeholder: "00000-0000000-0" },
      { name: "phone", label: "Phone", type: "phone" },
      { name: "program_id", label: "Program", type: "select", optionsFrom: "programs", optionLabel: "program_name", required: true },
      { name: "session_id", label: "Session", type: "select", optionsFrom: "sessions", optionLabel: "session_name", required: true },
      { name: "level", label: "Level", type: "select", options: levelOptions, required: true },
      { name: "status", label: "Status", type: "select", options: statusOptions, required: true },
    ],
    columns: [
      { key: "roll_number", label: "Roll No.", sortable: true },
      { key: "student_name", label: "Student", sortable: true },
      { key: "program_id", label: "Program", relation: "programs", relationLabel: "program_name" },
      { key: "session_id", label: "Session", relation: "sessions", relationLabel: "session_name" },
      { key: "level", label: "Level", badge: true },
      { key: "status", label: "Status", badge: true },
    ],
    filters: [
      { name: "program_id", label: "Program", type: "select", optionsFrom: "programs", optionLabel: "program_name" },
      { name: "session_id", label: "Session", type: "select", optionsFrom: "sessions", optionLabel: "session_name" },
      { name: "level", label: "Level", type: "select", options: levelOptions },
    ],
  },
  {
    entity: "papers",
    title: "Papers",
    singular: "Paper",
    route: "/papers",
    icon: BookOpen,
    description: "Define papers with marks, duration, program, and level.",
    schema: z.object({
      paper_code: required("Paper code"),
      paper_name: required("Paper name"),
      program_id: required("Program"),
      level: required("Level"),
      marks: numberText("Marks"),
      duration: required("Duration"),
    }),
    fields: [
      { name: "paper_code", label: "Paper Code", type: "text", required: true },
      { name: "paper_name", label: "Paper Name", type: "text", required: true },
      { name: "program_id", label: "Program", type: "select", optionsFrom: "programs", optionLabel: "program_name", required: true },
      { name: "level", label: "Level", type: "select", options: levelOptions, required: true },
      { name: "marks", label: "Marks", type: "number", required: true },
      { name: "duration", label: "Duration", type: "text", placeholder: "3 hours", required: true },
    ],
    columns: [
      { key: "paper_code", label: "Code", sortable: true },
      { key: "paper_name", label: "Paper", sortable: true },
      { key: "program_id", label: "Program", relation: "programs", relationLabel: "program_name" },
      { key: "level", label: "Level", badge: true },
      { key: "marks", label: "Marks", sortable: true },
    ],
  },
  {
    entity: "exams",
    title: "Exam Schedule",
    singular: "Exam",
    route: "/exams",
    icon: ClipboardList,
    description: "Schedule papers by type, date, and time.",
    schema: z.object({
      paper_id: required("Paper"),
      exam_type: required("Exam type"),
      exam_date: required("Exam date"),
      start_time: required("Start time"),
      end_time: required("End time"),
    }),
    fields: [
      { name: "paper_id", label: "Paper", type: "select", optionsFrom: "papers", optionLabel: "paper_name", required: true },
      { name: "exam_type", label: "Exam Type", type: "select", options: [{ label: "Annual", value: "Annual" }, { label: "Semester", value: "Semester" }, { label: "Final", value: "Final" }, { label: "Supplementary", value: "Supplementary" }], required: true },
      { name: "exam_date", label: "Exam Date", type: "date", required: true },
      { name: "start_time", label: "Start Time", type: "time", required: true },
      { name: "end_time", label: "End Time", type: "time", required: true },
    ],
    columns: [
      { key: "paper_id", label: "Paper", relation: "papers", relationLabel: "paper_name" },
      { key: "exam_type", label: "Type", badge: true },
      { key: "exam_date", label: "Date", sortable: true },
      { key: "start_time", label: "Start" },
      { key: "end_time", label: "End" },
    ],
  },
  {
    entity: "registration",
    title: "Registration",
    singular: "Registration",
    route: "/registration",
    icon: UserCheck,
    description: "Register eligible students for scheduled exams.",
    schema: z.object({
      student_id: required("Student"),
      exam_id: required("Exam"),
    }),
    fields: [
      { name: "student_id", label: "Student", type: "select", optionsFrom: "students", optionLabel: "student_name", required: true },
      { name: "exam_id", label: "Exam", type: "select", optionsFrom: "exams", optionLabel: getExamLabel, required: true },
    ],
    columns: [
      { key: "student_id", label: "Student", relation: "students", relationLabel: "student_name" },
      { key: "exam_id", label: "Exam", relation: "exams", relationLabel: getExamLabel },
    ],
  },
  {
    entity: "rooms",
    title: "Rooms",
    singular: "Room",
    route: "/rooms",
    icon: Building2,
    description: "Track examination rooms, buildings, capacity, and availability.",
    schema: z.object({
      room_number: required("Room number"),
      building: required("Building"),
      capacity: numberText("Capacity"),
      status: required("Status"),
    }),
    fields: [
      { name: "room_number", label: "Room Number", type: "text", required: true },
      { name: "building", label: "Building", type: "text", required: true },
      { name: "capacity", label: "Capacity", type: "number", required: true },
      { name: "status", label: "Status", type: "select", options: [{ label: "Available", value: "Available" }, { label: "Unavailable", value: "Unavailable" }], required: true },
    ],
    columns: [
      { key: "room_number", label: "Room", sortable: true },
      { key: "building", label: "Building", sortable: true },
      { key: "capacity", label: "Capacity", sortable: true },
      { key: "status", label: "Status", badge: true },
    ],
  },
  {
    entity: "duties",
    title: "Duty Roster",
    singular: "Duty",
    route: "/duties",
    icon: ClipboardCheck,
    description: "Assign staff to exam rooms by date and shift.",
    schema: z.object({
      exam_id: required("Exam"),
      staff_name: required("Staff name"),
      room_id: required("Room"),
      date: required("Date"),
      shift: required("Shift"),
    }),
    fields: [
      { name: "exam_id", label: "Exam", type: "select", optionsFrom: "exams", optionLabel: getExamLabel, required: true },
      { name: "staff_name", label: "Staff Name", type: "text", required: true },
      { name: "room_id", label: "Room", type: "select", optionsFrom: "rooms", optionLabel: "room_number", required: true },
      { name: "date", label: "Date", type: "date", required: true },
      { name: "shift", label: "Shift", type: "select", options: [{ label: "Morning", value: "Morning" }, { label: "Evening", value: "Evening" }], required: true },
    ],
    columns: [
      { key: "staff_name", label: "Staff", sortable: true },
      { key: "room_id", label: "Room", relation: "rooms", relationLabel: "room_number" },
      { key: "date", label: "Date", sortable: true },
      { key: "shift", label: "Shift", badge: true },
    ],
  },
  {
    entity: "attendance",
    title: "Attendance",
    singular: "Attendance",
    route: "/attendance",
    icon: FileText,
    description: "Record student attendance for each exam.",
    schema: z.object({
      exam_id: required("Exam"),
      student_id: required("Student"),
      attendance_status: required("Attendance status"),
    }),
    fields: [
      { name: "exam_id", label: "Exam", type: "select", optionsFrom: "exams", optionLabel: getExamLabel, required: true },
      { name: "student_id", label: "Student", type: "select", optionsFrom: "students", optionLabel: "student_name", required: true },
      { name: "attendance_status", label: "Status", type: "select", options: attendanceOptions, required: true },
    ],
    columns: [
      { key: "exam_id", label: "Exam", relation: "exams", relationLabel: getExamLabel },
      { key: "student_id", label: "Student", relation: "students", relationLabel: "student_name" },
      { key: "attendance_status", label: "Status", badge: true },
    ],
  },
  {
    entity: "ufm",
    title: "UFM Cases",
    singular: "UFM Case",
    route: "/ufm",
    icon: ShieldAlert,
    description: "Track unfair means cases, decisions, and status.",
    schema: z.object({
      student_id: required("Student"),
      exam_id: required("Exam"),
      paper_id: required("Paper"),
      description: required("Description"),
      decision: optional,
      status: required("Status"),
    }),
    fields: [
      { name: "student_id", label: "Student", type: "select", optionsFrom: "students", optionLabel: "student_name", required: true },
      { name: "exam_id", label: "Exam", type: "select", optionsFrom: "exams", optionLabel: getExamLabel, required: true },
      { name: "paper_id", label: "Paper", type: "select", optionsFrom: "papers", optionLabel: "paper_name", required: true },
      { name: "description", label: "Case Details", type: "textarea", required: true, grid: "full" },
      { name: "decision", label: "Decision", type: "textarea", grid: "full" },
      { name: "status", label: "Status", type: "select", options: [{ label: "Open", value: "Open" }, { label: "Under Review", value: "Under Review" }, { label: "Decided", value: "Decided" }], required: true },
    ],
    columns: [
      { key: "student_id", label: "Student", relation: "students", relationLabel: "student_name" },
      { key: "paper_id", label: "Paper", relation: "papers", relationLabel: "paper_name" },
      { key: "status", label: "Status", badge: true },
      { key: "decision", label: "Decision" },
    ],
  },
]

export const moduleByEntity = Object.fromEntries(modules.map((module) => [module.entity, module]))
