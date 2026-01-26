"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type Course = {
  id: string
  name: string
  description: string
  createdAt: string
}

export default function EditCoursePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [course, setCourse] = React.useState<Course | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    let active = true

    async function loadCourse() {
      try {
        if (!params?.id) {
          return
        }
        const response = await fetch(`/api/courses/${params.id}`)
        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error ?? "Failed to load course.")
        }
        const data = (await response.json()) as { course: Course }
        if (active) {
          setCourse(data.course)
        }
      } catch (err) {
        if (active) {
          setError("Unable to load course.")
        }
      }
    }

    loadCourse()

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
    }

    try {
      const response = await fetch(`/api/courses/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(data.error ?? "Update failed.")
        return
      }

      router.push("/admin/courses")
    } catch (err) {
      setError("Update failed.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit course</h1>
        <p className="text-sm text-muted-foreground">
          Update course details.
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
              defaultValue={course?.name ?? ""}
              placeholder="Course name"
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Textarea
              id="description"
              name="description"
              defaultValue={course?.description ?? ""}
              placeholder="Optional description"
              rows={4}
            />
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
