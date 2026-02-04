"use client"

import * as React from "react"
import CodeMirror from "@uiw/react-codemirror"
import { python } from "@codemirror/lang-python"
import { autocompletion, completeFromList } from "@codemirror/autocomplete"
import { EditorView } from "@codemirror/view"

import { activeParameterHint, signatureTooltip } from "@/lib/imagicharm/tooltips"
import { COMPLETIONS } from "@/lib/imagicharm/completions"
import { useCodeMirrorTheme } from "@/lib/imagicharm/editor-theme"
import { cn } from "@/lib/utils"

type EditorProps = {
  value: string
  onChange: (value: string) => void
  height?: string
  className?: string
}

export const Editor = React.memo(function Editor({
  value,
  onChange,
  height = "420px",
  className,
}: EditorProps) {
  const completions = React.useMemo(() => completeFromList(COMPLETIONS), [])
  const theme = useCodeMirrorTheme()
  const extensions = React.useMemo(
    () => [
      python(),
      autocompletion({
        override: [completions],
      }),
      signatureTooltip(),
      activeParameterHint(),
      EditorView.theme({
        "&.cm-editor": { height: "100%", position: "relative", flex: "1" },
        ".cm-scroller": {
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          overflow: "auto",
        },
        ".cm-content": { minHeight: "100%" },
        ".cm-gutters": { minHeight: "100%" },
      }),
    ],
    [completions]
  )

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="h-full flex-1 bg-background">
        <CodeMirror
          value={value}
          height="100%"
          style={{ height: "100%" }}
          className="h-full"
          theme={theme}
          extensions={extensions}
          onChange={(nextValue) => onChange(nextValue)}
        />
      </div>
    </div>
  )
})
