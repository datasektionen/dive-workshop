"use client"

import { AdminForm } from "@/components/admin/forms/admin-form"

export default function AdminInvitePage() {
  return <AdminForm mode="create" onSuccessRedirect="/admin/admins" />
}
