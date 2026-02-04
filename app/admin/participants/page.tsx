"use client"

import * as React from "react"
import Link from "next/link"

import { DataTable } from "@/components/admin/data-table"
import { PageHeader } from "@/components/admin/page-header"
import { Button } from "@/components/ui/button"

type ParticipantRow = {
  id: string
  name: string
  code: string
  createdAt: string
  lastSeenAt: string | null
  classId: string | null
  classTitle: string | null
  className: string | null
}

export default function ParticipantsPage() {
  const [participants, setParticipants] = React.useState<ParticipantRow[]>([])
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    let active = true

    async function loadParticipants() {
      try {
        const response = await fetch("/api/admin/participants")
        if (!response.ok) {
          throw new Error("Failed to load participants.")
        }
        const data = (await response.json()) as { participants: ParticipantRow[] }
        if (active) {
          setParticipants(data.participants)
        }
      } catch (err) {
        if (active) {
          setError("Unable to load participants.")
        }
      }
    }

    loadParticipants()

    return () => {
      active = false
    }
  }, [])

  async function handleDelete(id: string) {
    try {
      const response = await fetch(`/api/admin/participants/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        throw new Error("Failed to delete participant.")
      }
      setParticipants((prev) => prev.filter((participant) => participant.id !== id))
    } catch (err) {
      setError("Unable to delete participant.")
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Participants"
        description="Manage participants across all classes."
        action={
          <Button asChild>
            <Link href="/admin/classes">Go to classes</Link>
          </Button>
        }
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <DataTable
        data={participants}
        emptyText="No participants found."
        columns={[
          {
            header: "Participant",
            cell: (participant) => (
              <div>
                <p className="font-medium text-foreground">{participant.name}</p>
                <p className="text-xs text-muted-foreground">{participant.code}</p>
              </div>
            ),
          },
          {
            header: "Class",
            cell: (participant) =>
              participant.classId ? (
                <Link
                  href={`/admin/classes/${participant.classId}/overview`}
                  className="text-sm font-medium text-foreground hover:underline"
                >
                  {participant.classTitle || participant.className || "View class"}
                </Link>
              ) : (
                <span className="text-sm text-muted-foreground">No class</span>
              ),
          },
          {
            header: "Last seen",
            cell: (participant) => (
              <span className="text-sm text-muted-foreground">
                {participant.lastSeenAt
                  ? new Date(participant.lastSeenAt).toLocaleString()
                  : "Never"}
              </span>
            ),
          },
          {
            header: "Created",
            cell: (participant) => (
              <span className="text-sm text-muted-foreground">
                {new Date(participant.createdAt).toLocaleDateString()}
              </span>
            ),
          },
        ]}
        actions={{
          onDelete: (participant) => handleDelete(participant.id),
          deleteDialogTitle: "Delete participant?",
          deleteDialogDescription:
            "This removes the participant and their progress history. This action cannot be undone.",
        }}
      />
    </div>
  )
}
