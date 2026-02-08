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
import type { CourseSummary } from "@/lib/content/types"

type ClassDetail = {
  id: string
  title: string
  name: string
  description: string
  accessCode: string
  active: boolean
  courseId: string
  startDate: string | null
  endDate: string | null
}

type ClassFormProps = {
  classId?: string
}

function toLocalDateTimeInput(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const pad = (num: number) => String(num).padStart(2, "0")
  const yyyy = date.getFullYear()
  const mm = pad(date.getMonth() + 1)
  const dd = pad(date.getDate())
  const hh = pad(date.getHours())
  const min = pad(date.getMinutes())
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`
}

export function ClassForm({ classId }: ClassFormProps) {
  const router = useRouter()
  const isEdit = Boolean(classId)
  const [classItem, setClassItem] = React.useState<ClassDetail | null>(null)
  const [courses, setCourses] = React.useState<CourseSummary[]>([])
  const [courseId, setCourseId] = React.useState("")
  const [title, setTitle] = React.useState("")
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [accessCode, setAccessCode] = React.useState("")
  const [active, setActive] = React.useState(true)
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState("")
  const [success, setSuccess] = React.useState("")

  React.useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
        const requests = [fetch("/api/courses")]
        if (classId) {
          requests.unshift(fetch(`/api/classes/${classId}`))
        }

        const responses = await Promise.all(requests)
        const coursesResponse = responses[responses.length - 1]
        if (!coursesResponse.ok) {
          throw new Error("Failed to load courses.")
        }
        const coursesData = (await coursesResponse.json()) as {
          courses: CourseSummary[]
        }

        if (classId) {
          const classResponse = responses[0]
          if (!classResponse.ok) {
            const data = await classResponse.json().catch(() => ({}))
            throw new Error(data.error ?? "Failed to load class.")
          }
          const classData = (await classResponse.json()) as {
            class: ClassDetail
          }
          if (isMounted) {
            setClassItem(classData.class)
            setTitle(classData.class.title)
            setName(classData.class.name)
            setDescription(classData.class.description || "")
            setAccessCode(classData.class.accessCode)
            setActive(classData.class.active)
            setCourseId(classData.class.courseId)
            setStartDate(
              classData.class.startDate
                ? toLocalDateTimeInput(classData.class.startDate)
                : ""
            )
            setEndDate(
              classData.class.endDate
                ? toLocalDateTimeInput(classData.class.endDate)
                : ""
            )
          }
        } else if (isMounted) {
          setTitle("")
          setName("")
          setDescription("")
          setAccessCode("")
          setActive(true)
          setStartDate("")
          setEndDate("")
        }

        if (isMounted) {
          setCourses(coursesData.courses)
        }
      } catch {
        if (isMounted) {
          setError("Unable to load class data.")
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [classId])

  React.useEffect(() => {
    if (courses.length === 0) return
    if (courseId && courses.some((course) => course.id === courseId)) {
      return
    }
    setCourseId(courses[0]?.id ?? "")
  }, [courses, courseId])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const submitter = (event.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null
    const shouldClose = submitter?.dataset.closeAfterSave !== "false"

    setError("")
    setSuccess("")
    setIsSaving(true)

    const payload = {
      title,
      name,
      description,
      accessCode,
      active,
      courseId,
      startDate,
      endDate,
    }

    if (!title.trim()) {
      setError("Title is required.")
      setIsSaving(false)
      return
    }

    try {
      const response = await fetch(
        classId ? `/api/classes/${classId}` : "/api/classes",
        {
          method: classId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(data.error ?? "Save failed.")
        return
      }

      if (shouldClose || !isEdit) {
        router.push("/admin/classes")
        return
      }

      setSuccess("Saved.")
    } catch {
      setError("Save failed.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isEdit && !classItem && !error) {
    return <p className="text-sm text-muted-foreground">Loading...</p>
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {isEdit ? "Edit class" : "New class"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isEdit
            ? "Update class details and course assignment."
            : "Assign a class to a course and set its access code."}
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="title">Title</FieldLabel>
            <Input
              id="title"
              name="title"
              placeholder="Learner-facing class title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Shown to learners in the platform.
            </p>
          </Field>
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input
              id="name"
              name="name"
              placeholder="Class name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Used internally by admins and search.
            </p>
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
            <FieldLabel htmlFor="accessCode">Access code</FieldLabel>
            <Input
              id="accessCode"
              name="accessCode"
              placeholder="Enter access code"
              value={accessCode}
              onChange={(event) => setAccessCode(event.target.value)}
              required
            />
          </Field>
          <Field>
            <label
              htmlFor="active"
              className="flex cursor-pointer items-start gap-3 rounded-md border border-border/60 px-3 py-3"
            >
              <input
                id="active"
                name="active"
                type="checkbox"
                checked={active}
                onChange={(event) => setActive(event.target.checked)}
                className="mt-0.5 h-4 w-4 accent-primary"
              />
              <span className="space-y-1">
                <span className="block text-sm font-medium leading-none">
                  Class is active
                </span>
                <span className="block text-xs text-muted-foreground">
                  Learners can only log in while this class is active.
                </span>
              </span>
            </label>
          </Field>
          <Field>
            <FieldLabel htmlFor="startDate">Start date</FieldLabel>
            <Input
              id="startDate"
              name="startDate"
              type="datetime-local"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="endDate">End date</FieldLabel>
            <Input
              id="endDate"
              name="endDate"
              type="datetime-local"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
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
            {isEdit ? (
              <>
                <Button
                  type="submit"
                  variant="secondary"
                  data-close-after-save="false"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
                <Button type="submit" data-close-after-save="true" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save and close"}
                </Button>
              </>
            ) : (
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Create class"}
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </FieldGroup>
      </form>
    </div>
  )
}
