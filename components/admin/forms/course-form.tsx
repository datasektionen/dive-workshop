"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { OrderablePicker } from "@/components/admin/orderable-picker"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { CourseDetail, ModuleSummary } from "@/lib/content/types"

type CourseFormProps = {
  courseId?: string
}

export function CourseForm({ courseId }: CourseFormProps) {
  const router = useRouter()
  const isEdit = Boolean(courseId)
  const [course, setCourse] = React.useState<CourseDetail | null>(null)
  const [modules, setModules] = React.useState<ModuleSummary[]>([])
  const [selectedModules, setSelectedModules] = React.useState<string[]>([])
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    let active = true

    async function loadData() {
      try {
        const requests = [fetch("/api/modules")]
        if (courseId) {
          requests.unshift(fetch(`/api/courses/${courseId}`))
        }

        const responses = await Promise.all(requests)
        const modulesResponse = responses[responses.length - 1]
        if (!modulesResponse.ok) {
          throw new Error("Failed to load modules.")
        }
        const modulesData = (await modulesResponse.json()) as {
          modules: ModuleSummary[]
        }

        if (courseId) {
          const courseResponse = responses[0]
          if (!courseResponse.ok) {
            const data = await courseResponse.json().catch(() => ({}))
            throw new Error(data.error ?? "Failed to load course.")
          }
          const courseData = (await courseResponse.json()) as {
            course: CourseDetail
          }
          if (active) {
            setCourse(courseData.course)
            setName(courseData.course.name)
            setDescription(courseData.course.description || "")
            setSelectedModules(
              courseData.course.modules
                .sort((a, b) => a.order - b.order)
                .map((moduleItem) => moduleItem.moduleId)
            )
          }
        }

        if (active) {
          setModules(modulesData.modules)
        }
      } catch (err) {
        if (active) {
          setError("Unable to load course data.")
        }
      }
    }

    loadData()

    return () => {
      active = false
    }
  }, [courseId])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setIsSaving(true)

    const payload = {
      name,
      description,
      moduleIds: selectedModules,
    }

    try {
      const response = await fetch(
        courseId ? `/api/courses/${courseId}` : "/api/courses",
        {
          method: courseId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(data.error ?? "Save failed.")
        return
      }

      router.push("/admin/courses")
    } catch (err) {
      setError("Save failed.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isEdit && !course && !error) {
    return <p className="text-sm text-muted-foreground">Loading...</p>
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {isEdit ? "Edit course" : "New course"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isEdit ? "Update course details." : "Add a course to the catalog."}
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
              placeholder="Course name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Textarea
              id="description"
              name="description"
              placeholder="Optional description"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Modules</FieldLabel>
            <OrderablePicker
              items={modules}
              selectedIds={selectedModules}
              onChange={setSelectedModules}
              selectedLabel="Selected modules"
              availableLabel="Available modules"
              emptySelectedText="No modules selected yet."
              emptyAvailableText="No modules available."
              getTitle={(moduleItem) => moduleItem.name}
              getMeta={(moduleItem) => moduleItem.title}
            />
          </Field>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSaving}>
              {isSaving
                ? "Saving..."
                : isEdit
                  ? "Save changes"
                  : "Create course"}
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
