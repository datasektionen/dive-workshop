"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

export function LogoutButton() {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)

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
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="rounded-md border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isLoggingOut ? "Logging out..." : "Logout"}
    </button>
  )
}
