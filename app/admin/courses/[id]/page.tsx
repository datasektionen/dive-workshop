"use client"

import * as React from "react"

import { CourseForm } from "@/components/admin/forms/course-form"

export default function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [courseId, setCourseId] = React.useState<string | null>(null)

  React.useEffect(() => {
    let active = true

    async function resolveParams() {
      const { id } = await params
      if (active) {
        setCourseId(id)
      }
    }

    resolveParams()

    return () => {
      active = false
    }
  }, [params])

  if (!courseId) {
    return <p className="text-sm text-muted-foreground">Loading...</p>
  }

  return <CourseForm courseId={courseId} />
}
