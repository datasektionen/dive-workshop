"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type AdminRecord = {
  id: string
  fullName: string
  email: string
}

type AdminFormMode = "create" | "edit" | "account"

type AdminFormProps = {
  adminId?: string
  mode: AdminFormMode
  onSuccessRedirect?: string | null
}

export function AdminForm({
  adminId,
  mode,
  onSuccessRedirect,
}: AdminFormProps) {
  const router = useRouter()
  const [admin, setAdmin] = React.useState<AdminRecord | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState("")
  const [success, setSuccess] = React.useState("")

  const endpoint =
    mode === "account"
      ? "/api/admins/me"
      : adminId
        ? `/api/admins/${adminId}`
        : "/api/admins"

  React.useEffect(() => {
    let active = true
    if (mode === "create") return

    async function loadAdmin() {
      try {
        const response = await fetch(endpoint)
        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error ?? "Failed to load admin.")
        }
        const data = (await response.json()) as { admin: AdminRecord }
        if (active) {
          setAdmin(data.admin)
        }
      } catch (err) {
        if (active) {
          setError("Unable to load admin.")
        }
      }
    }

    loadAdmin()

    return () => {
      active = false
    }
  }, [endpoint, mode])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setSuccess("")
    setIsSaving(true)

    const formData = new FormData(event.currentTarget)
    const payload = {
      fullName: String(formData.get("fullName") || ""),
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
    }

    try {
      const response = await fetch(endpoint, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(data.error ?? "Save failed.")
        return
      }

      const data = (await response.json()) as { admin: AdminRecord }
      setAdmin(data.admin)

      if (onSuccessRedirect) {
        router.push(onSuccessRedirect)
      } else {
        setSuccess("Saved.")
      }
    } catch (err) {
      setError("Save failed.")
    } finally {
      setIsSaving(false)
    }
  }

  const title =
    mode === "create" ? "Invite admin" : mode === "account" ? "Account" : "Edit admin"
  const description =
    mode === "create"
      ? "Create a new admin and share their login."
      : mode === "account"
        ? "Update your profile details and password."
        : "Update admin details and reset the password."

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="fullName">Full name</FieldLabel>
            <Input
              id="fullName"
              name="fullName"
              defaultValue={admin?.fullName ?? ""}
              placeholder="Full name"
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={admin?.email ?? ""}
              placeholder="Email"
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">
              {mode === "create" ? "Password" : "New password"}
            </FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder={
                mode === "create"
                  ? "Set a temporary password"
                  : "Leave blank to keep current password"
              }
              required={mode === "create"}
            />
          </Field>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSaving}>
              {isSaving
                ? "Saving..."
                : mode === "create"
                  ? "Create admin"
                  : "Save changes"}
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
