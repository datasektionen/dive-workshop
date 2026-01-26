"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

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

export default function NewClassPage() {
  const router = useRouter()
  const [courses, setCourses] = React.useState<Course[]>([])
  const [courseId, setCourseId] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    let active = true

    async function loadCourses() {
      try {
        const response = await fetch("/api/courses")
        if (!response.ok) {
          throw new Error("Failed to load courses.")
        }
        const data = (await response.json()) as { courses: Course[] }
        if (active) {
          setCourses(data.courses)
          if (data.courses[0]?.id) {
            setCourseId(data.courses[0].id)
          }
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
      const response = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(data.error ?? "Create failed.")
        return
      }

      router.push("/admin/classes")
    } catch (err) {
      setError("Create failed.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New class</h1>
        <p className="text-sm text-muted-foreground">
          Assign a class to a course and set its access code.
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input id="name" name="name" placeholder="Class name" required />
          </Field>
          <Field>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Textarea
              id="description"
              name="description"
              placeholder="Optional description"
              rows={4}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="accessCode">Access code</FieldLabel>
            <Input
              id="accessCode"
              name="accessCode"
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
              {isSaving ? "Saving..." : "Create class"}
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
