import { useCallback, useEffect, useState } from "react"
import { api } from "@/services/api"
import type { EntityName, EntityRecord } from "@/types"

export function useResource(entity: EntityName) {
  const [records, setRecords] = useState<EntityRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      setRecords(await api.list(entity))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load records")
    } finally {
      setLoading(false)
    }
  }, [entity])

  useEffect(() => {
    void load()
  }, [load])

  return { records, loading, error, reload: load, setRecords }
}
