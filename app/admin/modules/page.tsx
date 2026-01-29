"use client"

import * as React from "react"
import Link from "next/link"

import { DataTable } from "@/components/admin/data-table"
import { PageHeader } from "@/components/admin/page-header"
import { Button } from "@/components/ui/button"
import type { ModuleSummary } from "@/lib/content/types"

export default function ModulesPage() {
  const [modules, setModules] = React.useState<ModuleSummary[]>([])
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    let active = true

    async function loadModules() {
      try {
        const response = await fetch("/api/modules")
        if (!response.ok) {
          throw new Error("Failed to load modules.")
        }
        const data = (await response.json()) as { modules: ModuleSummary[] }
        if (active) {
          setModules(data.modules)
        }
      } catch (err) {
        if (active) {
          setError("Unable to load modules.")
        }
      }
    }

    loadModules()

    return () => {
      active = false
    }
  }, [])

  async function handleDelete(id: string) {
    setError("")
    try {
      const response = await fetch(`/api/modules/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        throw new Error("Delete failed.")
      }
      setModules((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      setError("Unable to delete module.")
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modules"
        description="Group blocks into reusable modules."
        action={
          <Button size="sm" asChild>
            <Link href="/admin/modules/new">New module</Link>
          </Button>
        }
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <DataTable
        data={modules}
        emptyText="No modules found."
        columns={[
          {
            header: "Name",
            cell: (item) => <span className="font-medium">{item.name}</span>,
          },
          {
            header: "Title",
            cell: (item) => (
              <span className="text-muted-foreground">
                {item.title || "-"}
              </span>
            ),
          },
          {
            header: "Blocks",
            cell: (item) => (
              <span className="text-muted-foreground">
                {item._count?.blocks ?? 0}
              </span>
            ),
          },
          {
            header: "Created",
            cell: (item) => new Date(item.createdAt).toLocaleDateString(),
          },
        ]}
        actions={{
          editHref: (item) => `/admin/modules/${item.id}`,
          onDelete: (item) => handleDelete(item.id),
          deleteDialogTitle: "Delete module?",
          deleteDialogDescription: "This action cannot be undone.",
        }}
      />
    </div>
  )
}
