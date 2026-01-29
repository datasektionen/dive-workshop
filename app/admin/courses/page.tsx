"use client"

import * as React from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/admin/data-table"
import { PageHeader } from "@/components/admin/page-header"
import type { CourseSummary } from "@/lib/content/types"

export default function CoursesPage() {
  const [courses, setCourses] = React.useState<CourseSummary[]>([])
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    let active = true

    async function loadCourses() {
      try {
        const response = await fetch("/api/courses")
        if (!response.ok) {
          throw new Error("Failed to load courses.")
        }
        const data = (await response.json()) as { courses: CourseSummary[] }
        if (active) {
          setCourses(data.courses)
        }
      } catch (err) {
        if (active) {
          setError("Unable to load courses.")
        }
      }
    }

    loadCourses()

    return () => {
      active = false
    }
  }, [])

  async function handleDelete(id: string) {
    setError("")
    try {
      const response = await fetch(`/api/courses/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        throw new Error("Delete failed.")
      }
      setCourses((prev) => prev.filter((course) => course.id !== id))
    } catch (err) {
      setError("Unable to delete course.")
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courses"
        description="Create and manage course catalog entries."
        action={
          <Button size="sm" asChild>
            <Link href="/admin/courses/new">New course</Link>
          </Button>
        }
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <DataTable
        data={courses}
        emptyText="No courses found."
        columns={[
          {
            header: "Name",
            cell: (course) => <span className="font-medium">{course.name}</span>,
          },
          {
            header: "Description",
            cell: (course) => (
              <span className="text-muted-foreground">
                {course.description || "-"}
              </span>
            ),
          },
          {
            header: "Created",
            cell: (course) => new Date(course.createdAt).toLocaleDateString(),
          },
        ]}
        actions={{
          editHref: (course) => `/admin/courses/${course.id}`,
          onDelete: (course) => handleDelete(course.id),
          deleteDialogTitle: "Delete course?",
          deleteDialogDescription:
            "This will remove the course and all related classes.",
        }}
      />
    </div>
  )
}
