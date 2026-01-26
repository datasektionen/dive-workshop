"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type Course = {
  id: string
  name: string
}

type ClassItem = {
  id: string
  name: string
  description: string
  accessCode: string
  courseId: string
  createdAt: string
}

export default function EditClassPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [classItem, setClassItem] = React.useState<ClassItem | null>(null)
  const [courses, setCourses] = React.useState<Course[]>([])
  const [courseId, setCourseId] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    let active = true

    async function loadData() {
      try {
        if (!params?.id) {
          return
        }
        const [classRes, coursesRes] = await Promise.all([
          fetch(`/api/classes/${params.id}`),
          fetch("/api/courses"),
        ])

        if (!classRes.ok) {
          const data = await classRes.json().catch(() => ({}))
          throw new Error(data.error ?? "Failed to load class.")
        }

        if (!coursesRes.ok) {
          throw new Error("Failed to load courses.")
        }

        const classData = (await classRes.json()) as { class: ClassItem }
        const coursesData = (await coursesRes.json()) as { courses: Course[] }

        if (active) {
          setClassItem(classData.class)
          setCourses(coursesData.courses)
          setCourseId(classData.class.courseId)
        }
      } catch (err) {
        if (active) {
          setError("Unable to load class.")
        }
      }
    }

    loadData()

    return () => {
      active = false
    }
  }, [params?.id])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setIsSaving(true)

    const formData = new FormData(event.currentTarget)
    const payload = {
      name: String(formData.get("name") || ""),
      description: String(formData.get("description") || ""),
      accessCode: String(formData.get("accessCode") || ""),
      courseId,
    }

    try {
      const response = await fetch(`/api/classes/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(data.error ?? "Update failed.")
        return
      }

      router.push("/admin/classes")
    } catch (err) {
      setError("Update failed.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit class</h1>
        <p className="text-sm text-muted-foreground">
          Update class details and course assignment.
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input
              id="name"
              name="name"
              defaultValue={classItem?.name ?? ""}
              placeholder="Class name"
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Textarea
              id="description"
              name="description"
              defaultValue={classItem?.description ?? ""}
              placeholder="Optional description"
              rows={4}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="accessCode">Access code</FieldLabel>
            <Input
              id="accessCode"
              name="accessCode"
              defaultValue={classItem?.accessCode ?? ""}
              placeholder="Enter access code"
              required
            />
          </Field>
          <Field>
            <FieldLabel>Course</FieldLabel>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </FieldGroup>
      </form>
    </div>
  )
}
