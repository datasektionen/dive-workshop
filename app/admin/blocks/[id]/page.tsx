"use client"

import * as React from "react"

import { BlockForm } from "@/components/admin/forms/block-form"

export default function EditBlockPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [blockId, setBlockId] = React.useState<string | null>(null)

  React.useEffect(() => {
    let active = true

    async function resolveParams() {
      const { id } = await params
      if (active) {
        setBlockId(id)
      }
    }

    resolveParams()

    return () => {
      active = false
    }
  }, [params])

  if (!blockId) {
    return <p className="text-sm text-muted-foreground">Loading...</p>
  }

  return <BlockForm blockId={blockId} />
}
