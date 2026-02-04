"use client"

import * as React from "react"
import Link from "next/link"

type DashboardClass = {
  id: string
  title: string
  name: string
  startDate: string | null
  endDate: string | null
  courseName: string
  participants: number
  runEvents: number
  progressPercent: number
}

export default function AdminPage() {
  const [classes, setClasses] = React.useState<DashboardClass[]>([])
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    let active = true

    async function loadDashboard() {
      try {
        const response = await fetch("/api/admin/dashboard")
        if (!response.ok) {
          throw new Error("Failed to load dashboard.")
        }
        const data = (await response.json()) as { classes: DashboardClass[] }
        if (active) {
          setClasses(data.classes)
        }
      } catch (err) {
        if (active) {
          setError("Unable to load dashboard.")
        }
      }
    }

    loadDashboard()

    return () => {
      active = false
    }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Active classes</h1>
        <p className="text-sm text-muted-foreground">
          Jump into a live class view to monitor progress and participants.
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {classes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No active classes right now.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((classItem) => (
            <Link
              key={classItem.id}
              href={`/admin/classes/${classItem.id}/overview`}
              className="group rounded-2xl border bg-gradient-to-br from-background via-background to-muted/40 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-muted hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {classItem.courseName || "Course"}
                  </p>
                  <h2 className="text-xl font-semibold">{classItem.title}</h2>
                  <p className="text-xs text-muted-foreground">
                    {classItem.startDate
                      ? new Date(classItem.startDate).toLocaleString()
                      : "No start"}{" "}
                    →{" "}
                    {classItem.endDate
                      ? new Date(classItem.endDate).toLocaleString()
                      : "No end"}
                  </p>
                </div>
                <div className="rounded-full border border-muted/50 bg-background px-3 py-2 text-xs font-semibold text-muted-foreground">
                  {classItem.progressPercent}% complete
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-muted-foreground">
                <div>
                  <p className="text-[10px] uppercase tracking-wide">Learners</p>
                  <p className="text-sm font-semibold text-foreground">
                    {classItem.participants}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide">Runs</p>
                  <p className="text-sm font-semibold text-foreground">
                    {classItem.runEvents}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide">Status</p>
                  <p className="text-sm font-semibold text-foreground">Live</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
