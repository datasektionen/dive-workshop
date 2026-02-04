"use client"

import * as React from "react"
import { useParams } from "next/navigation"

import { AdminForm } from "@/components/admin/forms/admin-form"

export default function AdminEditPage() {
  const params = useParams<{ id: string }>()

  if (!params?.id) {
    return <p className="text-sm text-muted-foreground">Loading...</p>
  }

  return (
    <AdminForm adminId={params.id} mode="edit" onSuccessRedirect="/admin/admins" />
  )
}
