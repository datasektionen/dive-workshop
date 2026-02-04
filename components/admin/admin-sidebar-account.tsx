"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOutIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

type AdminSidebarAccountProps = {
  name: string
  email: string
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ""
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : ""
  return `${first}${last}`.toUpperCase() || "A"
}

export function AdminSidebarAccount({ name, email }: AdminSidebarAccountProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)
  const initials = getInitials(name)

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await fetch("/api/logout", { method: "POST" })
    } finally {
      router.push("/admin-login")
      router.refresh()
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="space-y-3">
      <Link
        href="/admin/account"
        className="flex items-center gap-3 rounded-xl border border-sidebar-border/70 bg-sidebar/60 p-3 shadow-sm transition hover:bg-sidebar-accent/30"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent/60 text-xs font-semibold text-sidebar-foreground">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-sidebar-foreground">
            {name}
          </p>
          <p className="truncate text-xs text-sidebar-foreground/70">{email}</p>
        </div>
      </Link>
      <Button
        size="sm"
        variant="outline"
        className="h-9 w-full"
        onClick={handleLogout}
        disabled={isLoggingOut}
      >
        <LogOutIcon className="mr-1 h-3.5 w-3.5" />
        {isLoggingOut ? "Logging out..." : "Logout"}
      </Button>
    </div>
  )
}
