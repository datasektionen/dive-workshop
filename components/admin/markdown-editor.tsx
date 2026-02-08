"use client"

import * as React from "react"
import { markdown } from "@codemirror/lang-markdown"
import { EditorView } from "@codemirror/view"
import CodeMirror from "@uiw/react-codemirror"

import { MarkdownRenderer } from "@/components/markdown/markdown-renderer"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useCodeMirrorTheme } from "@/lib/imagicharm/editor-theme"
import { generateMarkdownImagiCaches } from "@/lib/markdown/imagi-cache-client"
import type { MarkdownImagiCachePayload } from "@/lib/markdown/imagi-types"

type MarkdownEditorProps = {
  value: string
  onChange: (value: string) => void
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const [mode, setMode] = React.useState<"edit" | "preview">("edit")
  const [isFullscreenPreviewOpen, setIsFullscreenPreviewOpen] = React.useState(false)
  const [imagiCaches, setImagiCaches] = React.useState<MarkdownImagiCachePayload[]>([])
  const codeMirrorTheme = useCodeMirrorTheme()
  const hasContent = value.trim().length > 0
  const shouldPrepareImagiPreview = mode === "preview" || isFullscreenPreviewOpen

  React.useEffect(() => {
    if (!shouldPrepareImagiPreview) return
    if (!/\bimagi-(grid|anim)\b/.test(value)) {
      setImagiCaches([])
      return
    }

    let active = true
    const timeoutId = window.setTimeout(async () => {
      try {
        const caches = await generateMarkdownImagiCaches(value)
        if (active) {
          setImagiCaches(caches)
        }
      } catch {
        if (active) {
          setImagiCaches([])
        }
      }
    }, 180)

    return () => {
      active = false
      window.clearTimeout(timeoutId)
    }
  }, [value, shouldPrepareImagiPreview])

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
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button type="button" size="sm" variant="outline">
                Help
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(92vw,760px)] sm:max-w-none">
              <SheetHeader>
                <SheetTitle>Markdown Help</SheetTitle>
                <SheetDescription>
                  Supported syntax for Imagi snippets and columns layout.
                </SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
                <div className="space-y-5 text-sm">
                  <div className="space-y-2">
                    <p className="font-medium">Static Imagi grid</p>
                    <pre className="overflow-x-auto rounded-md border bg-muted/30 p-3 text-xs">
{`\
\`\`\`python imagi-grid
# draw one frame
render()
\`\`\`
`}
                    </pre>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">Animated Imagi preview</p>
                    <pre className="overflow-x-auto rounded-md border bg-muted/30 p-3 text-xs">
{`\
\`\`\`python imagi-anim
# draw multiple frames
render()
\`\`\`
`}
                    </pre>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">Columns directive</p>
                    <pre className="overflow-x-auto rounded-md border bg-muted/30 p-3 text-xs">
{`\
:::columns align=middle gap=6
:::col
Left content
:::
:::col align=top
Right content
:::
:::
`}
                    </pre>
                    <p className="text-xs text-muted-foreground">
                      `align` can be `top`, `middle`, or `bottom` on both
                      `columns` and each `col`.
                    </p>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Sheet
            open={isFullscreenPreviewOpen}
            onOpenChange={setIsFullscreenPreviewOpen}
          >
            <SheetTrigger asChild>
              <Button type="button" size="sm" variant="outline" disabled={!hasContent}>
                Fullscreen preview
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[96vw] sm:max-w-none"
            >
              <SheetHeader className="border-b pb-3">
                <SheetTitle>Markdown Preview</SheetTitle>
                <SheetDescription>
                  Near-fullscreen preview of the rendered markdown.
                </SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                {hasContent ? (
                  <MarkdownRenderer content={value} imagiCaches={imagiCaches} />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nothing to preview yet.
                  </p>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
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
            <MarkdownRenderer content={value} imagiCaches={imagiCaches} />
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
