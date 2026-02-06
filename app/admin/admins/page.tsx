"use client"

import * as React from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/admin/data-table"
import { PageHeader } from "@/components/admin/page-header"
import { TableSearch } from "@/components/admin/table-search"
import { matchesSearchQuery } from "@/lib/admin/search"

type Admin = {
  id: string
  fullName: string
  email: string
  createdAt: string
}

export default function AdminsPage() {
  const [admins, setAdmins] = React.useState<Admin[]>([])
  const [error, setError] = React.useState("")
  const [query, setQuery] = React.useState("")

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
      } catch {
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
    } catch {
      setError("Unable to delete admin.")
    }
  }

  const filteredAdmins = React.useMemo(() => {
    return admins.filter((admin) =>
      matchesSearchQuery(query, [admin.fullName, admin.email])
    )
  }, [admins, query])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admins"
        description="Manage admin users and access."
        action={
          <Button size="sm" asChild>
            <Link href="/admin/admins/new">Invite admin</Link>
          </Button>
        }
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <TableSearch
        value={query}
        onChange={setQuery}
        placeholder="Search admins"
      />

      <DataTable
        data={filteredAdmins}
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
