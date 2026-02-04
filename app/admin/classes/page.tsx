"use client"

import * as React from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/admin/data-table"
import { PageHeader } from "@/components/admin/page-header"

type ClassItem = {
  id: string
  title: string
  name: string
  description: string
  accessCode: string
  startDate: string | null
  endDate: string | null
  createdAt: string
  course: {
    id: string
    name: string
  }
}

export default function ClassesPage() {
  const [classes, setClasses] = React.useState<ClassItem[]>([])
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    let active = true

    async function loadClasses() {
      try {
        const response = await fetch("/api/classes")
        if (!response.ok) {
          throw new Error("Failed to load classes.")
        }
        const data = (await response.json()) as { classes: ClassItem[] }
        if (active) {
          setClasses(data.classes)
        }
      } catch (err) {
        if (active) {
          setError("Unable to load classes.")
        }
      }
    }

    loadClasses()

    return () => {
      active = false
    }
  }, [])

  async function handleDelete(id: string) {
    setError("")
    try {
      const response = await fetch(`/api/classes/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        throw new Error("Delete failed.")
      }
      setClasses((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      setError("Unable to delete class.")
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Classes"
        description="Track access codes and course assignments."
        action={
          <Button size="sm" asChild>
            <Link href="/admin/classes/new">New class</Link>
          </Button>
        }
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <DataTable
        data={classes}
        emptyText="No classes found."
        columns={[
          {
            header: "Title",
            cell: (item) => <span className="font-medium">{item.title}</span>,
          },
          {
            header: "Course",
            cell: (item) => (
              <span className="text-muted-foreground">
                {item.course?.name ?? "-"}
              </span>
            ),
          },
          {
            header: "Access code",
            cell: (item) => (
              <span className="font-mono text-xs text-muted-foreground">
                {item.accessCode}
              </span>
            ),
          },
          {
            header: "Created",
            cell: (item) => new Date(item.createdAt).toLocaleDateString(),
          },
          {
            header: "Dates",
            cell: (item) => (
              <span className="text-muted-foreground">
                {item.startDate
                  ? new Date(item.startDate).toLocaleString()
                  : "—"}{" "}
                →{" "}
                {item.endDate
                  ? new Date(item.endDate).toLocaleString()
                  : "—"}
              </span>
            ),
          },
          {
            header: "View",
            cell: (item) => (
              <Button asChild size="sm" className="px-5">
                <Link href={`/admin/classes/${item.id}/overview`}>View</Link>
              </Button>
            ),
            className: "w-[120px]",
          },
        ]}
        actions={{
          editHref: (item) => `/admin/classes/${item.id}`,
          onDelete: (item) => handleDelete(item.id),
          deleteDialogTitle: "Delete class?",
          deleteDialogDescription: "This action cannot be undone.",
        }}
      />
    </div>
  )
}
