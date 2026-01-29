"use client"

import * as React from "react"
import { ModuleForm } from "@/components/admin/forms/module-form"

export default function EditModulePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [moduleId, setModuleId] = React.useState<string | null>(null)

  React.useEffect(() => {
    let active = true

    async function resolveParams() {
      const { id } = await params
      if (active) {
        setModuleId(id)
      }
    }

    resolveParams()

    return () => {
      active = false
    }
  }, [params])

  if (!moduleId) {
    return <p className="text-sm text-muted-foreground">Loading...</p>
  }

  return <ModuleForm moduleId={moduleId} />
}
