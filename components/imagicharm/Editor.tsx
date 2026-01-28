"use client"

import * as React from "react"
import CodeMirror from "@uiw/react-codemirror"
import { python } from "@codemirror/lang-python"
import { oneDark } from "@codemirror/theme-one-dark"
import { autocompletion, completeFromList } from "@codemirror/autocomplete"

import { activeParameterHint, signatureTooltip } from "@/lib/imagicharm/tooltips"
import { COMPLETIONS } from "@/lib/imagicharm/completions"

type EditorProps = {
  value: string
  onChange: (value: string) => void
}

export const Editor = React.memo(function Editor({ value, onChange }: EditorProps) {
  const completions = React.useMemo(() => completeFromList(COMPLETIONS), [])
  const extensions = React.useMemo(
    () => [
      python(),
      autocompletion({
        override: [completions],
      }),
      signatureTooltip(),
      activeParameterHint(),
    ],
    [completions]
  )

  return (
    <div className="overflow-hidden rounded-md border bg-background shadow-sm">
      <div className="border-b px-4 py-2 text-sm font-medium text-muted-foreground">
        Python
      </div>
      <CodeMirror
        value={value}
        height="420px"
        theme={oneDark}
        extensions={extensions}
        onChange={(nextValue) => onChange(nextValue)}
      />
    </div>
  )
})
