"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { RichTextEditor } from "@/components/admin/rich-text-editor"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { BlockDetail, BlockType } from "@/lib/content/types"

type BlockFormProps = {
  blockId?: string
}

export function BlockForm({ blockId }: BlockFormProps) {
  const router = useRouter()
  const isEdit = Boolean(blockId)
  const [block, setBlock] = React.useState<BlockDetail | null>(null)
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [type, setType] = React.useState<BlockType>("text")
  const [body, setBody] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    if (!blockId) return
    let active = true

    async function loadBlock() {
      try {
        const response = await fetch(`/api/blocks/${blockId}`)
        if (!response.ok) {
          throw new Error("Failed to load block.")
        }
        const data = (await response.json()) as { block: BlockDetail }
        if (active) {
          setBlock(data.block)
          setTitle(data.block.title)
          setDescription(data.block.description || "")
          setType(data.block.type)
          setBody(data.block.body || "")
        }
      } catch (err) {
        if (active) {
          setError("Unable to load block.")
        }
      }
    }

    loadBlock()

    return () => {
      active = false
    }
  }, [blockId])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setIsSaving(true)

    const payload = {
      type,
      title,
      description,
      body,
    }

    try {
      const response = await fetch(blockId ? `/api/blocks/${blockId}` : "/api/blocks", {
        method: blockId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(data.error ?? "Save failed.")
        return
      }

      router.push("/admin/blocks")
    } catch (err) {
      setError("Save failed.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isEdit && !block && !error) {
    return <p className="text-sm text-muted-foreground">Loading...</p>
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {isEdit ? "Edit block" : "New block"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isEdit
            ? "Update the content and settings for this block."
            : "Create a block to reuse across modules."}
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="title">Title</FieldLabel>
            <Input
              id="title"
              name="title"
              placeholder="Block title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
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
            <FieldLabel>Type</FieldLabel>
            <Select value={type} onValueChange={(value) => setType(value as BlockType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="code">Code</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Body</FieldLabel>
            <RichTextEditor value={body} onChange={setBody} />
          </Field>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : isEdit ? "Save block" : "Create block"}
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
