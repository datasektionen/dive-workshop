"use client"

import * as React from "react"
import Link from "next/link"

import { DataTable } from "@/components/admin/data-table"
import { PageHeader } from "@/components/admin/page-header"
import { Button } from "@/components/ui/button"
import type { BlockSummary } from "@/lib/content/types"

export default function BlocksPage() {
  const [blocks, setBlocks] = React.useState<BlockSummary[]>([])
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    let active = true

    async function loadBlocks() {
      try {
        const response = await fetch("/api/blocks")
        if (!response.ok) {
          throw new Error("Failed to load blocks.")
        }
        const data = (await response.json()) as { blocks: BlockSummary[] }
        if (active) {
          setBlocks(data.blocks)
        }
      } catch (err) {
        if (active) {
          setError("Unable to load blocks.")
        }
      }
    }

    loadBlocks()

    return () => {
      active = false
    }
  }, [])

  async function handleDelete(id: string) {
    setError("")
    try {
      const response = await fetch(`/api/blocks/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        throw new Error("Delete failed.")
      }
      setBlocks((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      setError("Unable to delete block.")
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blocks"
        description="Define reusable building blocks."
        action={
          <Button size="sm" asChild>
            <Link href="/admin/blocks/new">New block</Link>
          </Button>
        }
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <DataTable
        data={blocks}
        emptyText="No blocks found."
        columns={[
          {
            header: "Title",
            cell: (item) => <span className="font-medium">{item.title}</span>,
          },
          {
            header: "Type",
            cell: (item) => (
              <span className="text-xs uppercase text-muted-foreground">
                {item.type}
              </span>
            ),
          },
          {
            header: "Description",
            cell: (item) => (
              <span className="text-muted-foreground">
                {item.description || "-"}
              </span>
            ),
          },
          {
            header: "Created",
            cell: (item) => new Date(item.createdAt).toLocaleDateString(),
          },
        ]}
        actions={{
          editHref: (item) => `/admin/blocks/${item.id}`,
          onDelete: (item) => handleDelete(item.id),
          deleteDialogTitle: "Delete block?",
          deleteDialogDescription: "This action cannot be undone.",
        }}
      />
    </div>
  )
}
