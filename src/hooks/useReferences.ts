import { useEffect, useState } from "react"
import { api } from "@/services/api"
import type { EntityName, ReferenceState } from "@/types"

const referenceEntities: EntityName[] = [
  "programs",
  "sessions",
  "students",
  "papers",
  "exams",
  "rooms",
]

export function useReferences(enabled = true) {
  const [references, setReferences] = useState<ReferenceState>({})

  useEffect(() => {
    if (!enabled) return

    let mounted = true

    Promise.all(
      referenceEntities.map(async (entity) => {
        try {
          return [entity, await api.list(entity)] as const
        } catch {
          return [entity, []] as const
        }
      }),
    ).then((entries) => {
      if (mounted) setReferences(Object.fromEntries(entries))
    })

    return () => {
      mounted = false
    }
  }, [enabled])

  return references
}
