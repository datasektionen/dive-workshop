"use client"

import * as React from "react"
import Link from "next/link"
import { SearchIcon } from "lucide-react"

import { Input } from "@/components/ui/input"

type GlobalSearchResult = {
  id: string
  category: "class" | "course" | "module" | "block"
  label: string
  secondary: string
  href: string
}

const CATEGORY_LABELS: Record<GlobalSearchResult["category"], string> = {
  class: "Class",
  course: "Course",
  module: "Module",
  block: "Block",
}

export function AdminGlobalSearch() {
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<GlobalSearchResult[]>([])
  const [isOpen, setIsOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    const term = query.trim()
    if (!term) {
      setResults([])
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      setIsLoading(true)
      try {
        const response = await fetch(
          `/api/admin-search?q=${encodeURIComponent(term)}`,
          { signal: controller.signal }
        )
        if (!response.ok) return
        const data = (await response.json()) as { results: GlobalSearchResult[] }
        setResults(data.results ?? [])
      } catch {
        // Ignore search errors.
      } finally {
        setIsLoading(false)
      }
    }, 180)

    return () => {
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [query])

  return (
    <div
      className="relative hidden min-w-[320px] md:block"
      onFocus={() => setIsOpen(true)}
      onBlur={() => {
        window.setTimeout(() => setIsOpen(false), 120)
      }}
    >
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="pl-9"
        placeholder="Search everything..."
      />

      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[420px] overflow-y-auto rounded-md border bg-popover p-1 shadow-lg">
          {query.trim() ? (
            isLoading ? (
              <p className="px-3 py-3 text-sm text-muted-foreground">
                Searching...
              </p>
            ) : results.length === 0 ? (
              <p className="px-3 py-3 text-sm text-muted-foreground">
                No matches found.
              </p>
            ) : (
              <div className="space-y-1">
                {results.map((result) => (
                  <Link
                    key={`${result.category}-${result.id}`}
                    href={result.href}
                    className="block rounded-sm px-3 py-2 transition hover:bg-accent"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-medium">
                        {result.label || "(Untitled)"}
                      </p>
                      <span className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {CATEGORY_LABELS[result.category]}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {result.secondary}
                    </p>
                  </Link>
                ))}
              </div>
            )
          ) : (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              Start typing to search all learning data.
            </p>
          )}
        </div>
      ) : null}
    </div>
  )
}
