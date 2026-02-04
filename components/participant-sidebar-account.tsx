"use client"

import * as React from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOutIcon } from "lucide-react"

type ParticipantSidebarAccountProps = {
  name: string
  accessCode?: string | null
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ""
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : ""
  return `${first}${last}`.toUpperCase() || "P"
}

export function ParticipantSidebarAccount({
  name,
  accessCode,
}: ParticipantSidebarAccountProps) {
  const [copied, setCopied] = React.useState(false)
  const initials = getInitials(name)

  return (
    <div className="space-y-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl border border-muted px-3 py-2 text-left transition hover:border-muted-foreground/40 hover:bg-muted/30"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{name}</span>
              <span className="block text-xs text-muted-foreground">
                Participant
              </span>
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top" sideOffset={8}>
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={async () => {
              await fetch("/api/logout", { method: "POST" })
              window.location.href = "/"
            }}
          >
            <LogOutIcon />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <button
        type="button"
        onClick={async () => {
          if (!accessCode) return
          try {
            await navigator.clipboard.writeText(accessCode)
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1500)
          } catch (err) {
            setCopied(false)
          }
        }}
        className="group w-full cursor-pointer rounded-lg border border-muted bg-muted/20 px-3 py-2 text-left text-xs text-muted-foreground transition hover:border-muted-foreground/40"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="uppercase tracking-wide">Access code</span>
          <span className="font-mono text-foreground/70">
            <span className="inline group-hover:hidden">
              {accessCode ? "••••••••" : "--------"}
            </span>
            <span className="hidden group-hover:inline">
              {accessCode ?? "--------"}
            </span>
          </span>
        </div>
        {copied ? (
          <div className="mt-1 text-[10px] text-emerald-500">
            Access code copied
          </div>
        ) : null}
      </button>
    </div>
  )
}
