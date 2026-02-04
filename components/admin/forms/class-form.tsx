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
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    let active = true

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
          if (active) {
            setClassItem(classData.class)
            setTitle(classData.class.title)
            setName(classData.class.name)
            setDescription(classData.class.description || "")
            setAccessCode(classData.class.accessCode)
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
        } else if (active) {
          setTitle("")
          setName("")
          setDescription("")
          setAccessCode("")
          setStartDate("")
          setEndDate("")
        }

        if (active) {
          setCourses(coursesData.courses)
        }
      } catch (err) {
        if (active) {
          setError("Unable to load class data.")
        }
      }
    }

    loadData()

    return () => {
      active = false
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
    setError("")
    setIsSaving(true)

    const payload = {
      title,
      name,
      description,
      accessCode,
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

      router.push("/admin/classes")
    } catch (err) {
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

      <form className="space-y-6" onSubmit={handleSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="title">Title</FieldLabel>
            <Input
              id="title"
              name="title"
              placeholder="Class title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
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
            <Button type="submit" disabled={isSaving}>
              {isSaving
                ? "Saving..."
                : isEdit
                  ? "Save changes"
                  : "Create class"}
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
