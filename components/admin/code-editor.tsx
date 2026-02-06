"use client"

import * as React from "react"
import { python } from "@codemirror/lang-python"
import CodeMirror from "@uiw/react-codemirror"

import { useCodeMirrorTheme } from "@/lib/imagicharm/editor-theme"

type CodeEditorProps = {
  value: string
  onChange: (value: string) => void
}

export function CodeEditor({ value, onChange }: CodeEditorProps) {
  const theme = useCodeMirrorTheme()

  return (
    <div className="overflow-hidden rounded-md border bg-background">
      <CodeMirror
        value={value}
        height="260px"
        theme={theme}
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          highlightActiveLine: true,
        }}
        extensions={[python()]}
        onChange={(nextValue) => onChange(nextValue)}
        className="[&_.cm-editor]:h-full [&_.cm-editor]:bg-background [&_.cm-focused]:outline-none [&_.cm-line]:px-2 [&_.cm-scroller]:bg-background [&_.cm-scroller]:font-mono [&_.cm-scroller]:text-sm"
      />
    </div>
  )
}
