"use client"

import * as React from "react"
import { markdown } from "@codemirror/lang-markdown"
import { EditorView } from "@codemirror/view"
import CodeMirror from "@uiw/react-codemirror"

import { MarkdownRenderer } from "@/components/markdown/markdown-renderer"
import { Button } from "@/components/ui/button"
import { useCodeMirrorTheme } from "@/lib/imagicharm/editor-theme"

type MarkdownEditorProps = {
  value: string
  onChange: (value: string) => void
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const [mode, setMode] = React.useState<"edit" | "preview">("edit")
  const codeMirrorTheme = useCodeMirrorTheme()

  return (
    <div className="overflow-hidden rounded-md border bg-background">
      <div className="flex items-center justify-between border-b px-2 py-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={mode === "edit" ? "default" : "secondary"}
            onClick={() => setMode("edit")}
          >
            Edit
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "preview" ? "default" : "secondary"}
            onClick={() => setMode("preview")}
          >
            Preview
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Supports Markdown, GFM, and fenced code blocks.
        </p>
      </div>

      {mode === "edit" ? (
        <CodeMirror
          value={value}
          height="320px"
          theme={codeMirrorTheme}
          basicSetup={{
            lineNumbers: true,
            foldGutter: false,
            highlightActiveLine: true,
          }}
          extensions={[markdown(), EditorView.lineWrapping]}
          onChange={(nextValue) => onChange(nextValue)}
          className="[&_.cm-editor]:h-full [&_.cm-editor]:bg-background [&_.cm-focused]:outline-none [&_.cm-line]:px-2 [&_.cm-scroller]:bg-background [&_.cm-scroller]:font-mono [&_.cm-scroller]:text-sm"
        />
      ) : (
        <div className="h-[320px] overflow-y-auto px-4 py-3">
          {value.trim() ? (
            <MarkdownRenderer content={value} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Nothing to preview yet. Add some markdown in Edit mode.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
