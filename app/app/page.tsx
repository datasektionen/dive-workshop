"use client"

import * as React from "react"

import { Playground } from "@/components/imagicharm/Playground"

export default function AppPage() {
  const [name, setName] = React.useState("")
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    let active = true

    async function loadSession() {
      try {
        const response = await fetch("/api/session")
        if (!response.ok) {
          throw new Error("Unauthorized.")
        }
        const data = (await response.json()) as { name: string }
        if (active) {
          setName(data.name)
        }
      } catch (err) {
        if (active) {
          setError("Unable to load session.")
        }
      }
    }

    loadSession()

    return () => {
      active = false
    }
  }, [])

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">
            {name ? `Welcome, ${name}` : "Welcome"}
          </h1>
          {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
        </div>
        <Playground />
      </div>
    </main>
  )
}
