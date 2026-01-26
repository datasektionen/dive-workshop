"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/admin/data-table"
import { PageHeader } from "@/components/admin/page-header"

type Admin = {
  id: string
  fullName: string
  email: string
  createdAt: string
}

export default function AdminsPage() {
  const [admins, setAdmins] = React.useState<Admin[]>([])
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    let active = true

    async function loadAdmins() {
      try {
        const response = await fetch("/api/admins")
        if (!response.ok) {
          throw new Error("Failed to load admins.")
        }
        const data = (await response.json()) as { admins: Admin[] }
        if (active) {
          setAdmins(data.admins)
        }
      } catch (err) {
        if (active) {
          setError("Unable to load admins.")
        }
      }
    }

    loadAdmins()

    return () => {
      active = false
    }
  }, [])

  async function handleDelete(id: string) {
    setError("")
    try {
      const response = await fetch(`/api/admins/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        throw new Error("Delete failed.")
      }
      setAdmins((prev) => prev.filter((admin) => admin.id !== id))
    } catch (err) {
      setError("Unable to delete admin.")
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admins"
        description="Manage admin users and access."
        action={<Button size="sm">Invite admin</Button>}
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <DataTable
        data={admins}
        emptyText="No admins found."
        columns={[
          {
            header: "Full name",
            cell: (admin) => <span className="font-medium">{admin.fullName}</span>,
          },
          {
            header: "Email",
            cell: (admin) => (
              <span className="text-muted-foreground">{admin.email}</span>
            ),
          },
          {
            header: "Created",
            cell: (admin) => new Date(admin.createdAt).toLocaleDateString(),
          },
        ]}
        actions={{
          editHref: (admin) => `/admin/admins/${admin.id}`,
          onDelete: (admin) => handleDelete(admin.id),
          deleteDialogTitle: "Delete admin?",
          deleteDialogDescription:
            "This action cannot be undone. The admin will be permanently removed.",
        }}
      />
    </div>
  )
}
