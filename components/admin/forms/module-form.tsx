"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { OrderablePicker } from "@/components/admin/orderable-picker"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { BlockSummary, ModuleDetail } from "@/lib/content/types"

type ModuleFormProps = {
  moduleId?: string
}

export function ModuleForm({ moduleId }: ModuleFormProps) {
  const router = useRouter()
  const isEdit = Boolean(moduleId)
  const [moduleItem, setModuleItem] = React.useState<ModuleDetail | null>(null)
  const [blocks, setBlocks] = React.useState<BlockSummary[]>([])
  const [selectedBlocks, setSelectedBlocks] = React.useState<string[]>([])
  const [name, setName] = React.useState("")
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    let active = true

    async function loadData() {
      try {
        const requests = [fetch("/api/blocks")]
        if (moduleId) {
          requests.unshift(fetch(`/api/modules/${moduleId}`))
        }

        const responses = await Promise.all(requests)
        const blocksResponse = responses[responses.length - 1]
        if (!blocksResponse.ok) {
          throw new Error("Failed to load blocks.")
        }
        const blocksData = (await blocksResponse.json()) as {
          blocks: BlockSummary[]
        }

        if (moduleId) {
          const moduleResponse = responses[0]
          if (!moduleResponse.ok) {
            throw new Error("Failed to load module.")
          }
          const moduleData = (await moduleResponse.json()) as {
            module: ModuleDetail
          }
          if (active) {
            setModuleItem(moduleData.module)
            setName(moduleData.module.name)
            setTitle(moduleData.module.title)
            setDescription(moduleData.module.description || "")
            setSelectedBlocks(
              moduleData.module.blocks
                .sort((a, b) => a.order - b.order)
                .map((block) => block.blockId)
            )
          }
        }

        if (active) {
          setBlocks(blocksData.blocks)
        }
      } catch {
        if (active) {
          setError("Unable to load module data.")
        }
      }
    }

    loadData()

    return () => {
      active = false
    }
  }, [moduleId])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setIsSaving(true)

    const payload = {
      name,
      title,
      description,
      blockIds: selectedBlocks,
    }

    if (!name.trim()) {
      setError("Name is required.")
      setIsSaving(false)
      return
    }

    if (!title.trim()) {
      setError("Title is required.")
      setIsSaving(false)
      return
    }

    try {
      const response = await fetch(
        moduleId ? `/api/modules/${moduleId}` : "/api/modules",
        {
          method: moduleId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(data.error ?? "Save failed.")
        return
      }

      router.push("/admin/modules")
    } catch {
      setError("Save failed.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isEdit && !moduleItem && !error) {
    return <p className="text-sm text-muted-foreground">Loading...</p>
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {isEdit ? "Edit module" : "New module"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isEdit
            ? "Update module details and block selection."
            : "Bundle blocks together as a reusable module."}
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input
              id="name"
              name="name"
              placeholder="Module name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Used internally by admins and search.
            </p>
          </Field>
          <Field>
            <FieldLabel htmlFor="title">Title</FieldLabel>
            <Input
              id="title"
              name="title"
              placeholder="Learner-facing title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">
              This is shown to learners in the platform.
            </p>
          </Field>
          <Field>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Textarea
              id="description"
              name="description"
              placeholder="Optional description"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Blocks</FieldLabel>
            <OrderablePicker
              items={blocks}
              selectedIds={selectedBlocks}
              onChange={setSelectedBlocks}
              selectedLabel="Selected blocks"
              availableLabel="Available blocks"
              emptySelectedText="No blocks selected yet."
              emptyAvailableText="No blocks yet. Create a block first."
              getTitle={(block) => (
                <span className="flex items-center gap-2">
                  <span>{block.title}</span>
                  <span className="text-xs uppercase text-muted-foreground">
                    {block.type}
                  </span>
                </span>
              )}
              getMeta={(block) => block.description || null}
            />
          </Field>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSaving}>
              {isSaving
                ? "Saving..."
                : isEdit
                  ? "Save module"
                  : "Create module"}
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
