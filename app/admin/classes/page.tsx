"use client"

import * as React from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/admin/data-table"
import { PageHeader } from "@/components/admin/page-header"
import { TableSearch } from "@/components/admin/table-search"
import { matchesSearchQuery } from "@/lib/admin/search"

type ClassItem = {
  id: string
  title: string
  name: string
  description: string
  accessCode: string
  active: boolean
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
  const [query, setQuery] = React.useState("")

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
      } catch {
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
    } catch {
      setError("Unable to delete class.")
    }
  }

  const filteredClasses = React.useMemo(() => {
    return classes.filter((item) =>
      matchesSearchQuery(query, [
        item.title,
        item.name,
        item.description,
        item.accessCode,
        item.active ? "active" : "closed",
        item.course?.name,
      ])
    )
  }, [classes, query])

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
      <TableSearch
        value={query}
        onChange={setQuery}
        placeholder="Search classes (name, title, access code...)"
      />

      <DataTable
        data={filteredClasses}
        emptyText="No classes found."
        columns={[
          {
            header: "Name",
            cell: (item) => <span className="font-semibold">{item.name}</span>,
          },
          {
            header: "Learner title",
            cell: (item) => <span>{item.title}</span>,
            className: "font-normal",
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
            header: "Status",
            cell: (item) => (
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  item.active
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                    : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                }`}
              >
                {item.active ? "Active" : "Closed"}
              </span>
            ),
          },
          {
            header: "",
            cell: (item) => (
              <div className="flex justify-end">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/admin/classes/${item.id}/overview`}>View</Link>
                </Button>
              </div>
            ),
            className: "w-[96px] pr-0",
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
