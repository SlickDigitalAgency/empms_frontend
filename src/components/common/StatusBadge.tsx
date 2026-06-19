import { Badge } from "@/components/ui/badge"

export function StatusBadge({ value }: { value?: string | number | boolean | null }) {
  const text = String(value ?? "Not set")
  const normalized = text.toLowerCase()
  const variant =
    normalized.includes("inactive") || normalized.includes("unavailable") || normalized.includes("absent")
      ? "destructive"
      : "secondary"

  return (
    <Badge variant={variant} className="whitespace-nowrap">
      {text}
    </Badge>
  )
}
