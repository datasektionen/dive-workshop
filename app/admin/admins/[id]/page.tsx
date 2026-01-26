"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type Admin = {
  id: string
  fullName: string
  email: string
  createdAt: string
}

export default function AdminEditPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [admin, setAdmin] = React.useState<Admin | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    let active = true

    async function loadAdmin() {
      try {
        if (!params?.id) {
          return
        }
        const response = await fetch(`/api/admins/${params.id}`)
        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error ?? "Failed to load admin.")
        }
        const data = (await response.json()) as { admin: Admin }
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
  }, [params?.id])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setIsSaving(true)

    const formData = new FormData(event.currentTarget)
    const payload = {
      fullName: String(formData.get("fullName") || ""),
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
    }

    try {
      const response = await fetch(`/api/admins/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(data.error ?? "Update failed.")
        return
      }

      const data = (await response.json()) as { admin: Admin }
      setAdmin(data.admin)
      router.push("/admin/admins")
    } catch (err) {
      setError("Update failed.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit admin</h1>
        <p className="text-sm text-muted-foreground">
          Update admin details and reset the password.
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

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
            <FieldLabel htmlFor="password">New password</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Leave blank to keep current password"
            />
          </Field>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save changes"}
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
