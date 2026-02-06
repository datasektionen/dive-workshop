"use client"

import * as React from "react"
import type { CSSProperties } from "react"
import { useTheme } from "next-themes"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism"

import { MarkdownImagiSnippet } from "@/components/markdown/markdown-imagi-snippet"
import {
  createImagiSnippetKey,
} from "@/lib/markdown/imagi-snippets"
import { type ImagiSnippetMode } from "@/lib/markdown/imagi-types"
import { parseMarkdownLayout } from "@/lib/markdown/layout-directive"
import { remarkImagiFences } from "@/lib/markdown/remark-imagi-fences"
import type { MarkdownImagiCachePayload } from "@/lib/markdown/imagi-types"
import { cn } from "@/lib/utils"

type MarkdownRendererProps = {
  content: string
  className?: string
  imagiCaches?: MarkdownImagiCachePayload[]
}

export function MarkdownRenderer({
  content,
  className,
  imagiCaches,
}: MarkdownRendererProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const syntaxTheme = mounted && resolvedTheme === "light" ? oneLight : oneDark
  const imagiCacheByKey = React.useMemo(() => {
    return new Map((imagiCaches ?? []).map((cache) => [cache.snippetKey, cache]))
  }, [imagiCaches])
  const layoutSegments = React.useMemo(
    () => parseMarkdownLayout(content),
    [content]
  )

  function renderMarkdownContent(markdownContent: string, localClassName?: string) {
    return (
      <div
        className={cn(
          "max-w-none text-sm leading-7 text-foreground",
          "[&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:leading-tight",
          "[&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:leading-tight",
          "[&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-semibold",
          "[&_h4]:mt-5 [&_h4]:mb-2 [&_h4]:text-lg [&_h4]:font-semibold",
          "[&_p]:my-3",
          "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6",
          "[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6",
          "[&_li]:my-1",
          "[&_blockquote]:my-4 [&_blockquote]:rounded-r-md [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:bg-muted/30 [&_blockquote]:px-4 [&_blockquote]:py-2",
          "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
          "[&_hr]:my-6 [&_hr]:border-border",
          "[&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm",
          "[&_thead]:border-b [&_thead]:border-border",
          "[&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold",
          "[&_td]:border-b [&_td]:border-border/50 [&_td]:px-3 [&_td]:py-2",
          localClassName
        )}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkImagiFences]}
          components={{
            code({ className: codeClassName, children, ...props }) {
              const match = /language-(\w+)/.exec(codeClassName || "")
              const codeText = String(children).replace(/\n$/, "")
              const isCodeBlock = Boolean(match) || codeText.includes("\n")
              const imagiModeClassMatch = /(?:^|\s)imagi-(grid|anim)(?:\s|$)/.exec(
                codeClassName || ""
              )
              const imagiMode = (imagiModeClassMatch?.[1] ?? null) as
                | ImagiSnippetMode
                | null

              if (!isCodeBlock) {
                return (
                  <code
                    className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]"
                    {...props}
                  >
                    {children}
                  </code>
                )
              }

              if (imagiMode) {
                const snippetKey = createImagiSnippetKey(imagiMode, codeText)
                const imagiCache = imagiCacheByKey.get(snippetKey) ?? null
                return <MarkdownImagiSnippet cache={imagiCache} />
              }

              return (
                <div className="my-4 overflow-hidden rounded-md border border-border/60">
                  <SyntaxHighlighter
                    language={match?.[1] ?? "text"}
                    style={syntaxTheme}
                    customStyle={{
                      margin: 0,
                      padding: "0.9rem",
                      background: "transparent",
                      fontSize: "0.82rem",
                      lineHeight: "1.55",
                      fontFamily: "var(--font-geist-mono), monospace",
                    }}
                    codeTagProps={{
                      style: { fontFamily: "var(--font-geist-mono), monospace" },
                    }}
                  >
                    {codeText}
                  </SyntaxHighlighter>
                </div>
              )
            },
          }}
        >
          {markdownContent}
        </ReactMarkdown>
      </div>
    )
  }

  return (
    <div className={className}>
      {layoutSegments.map((segment, index) => {
        if (segment.type === "markdown") {
          return (
            <React.Fragment key={`markdown-${index}`}>
              {renderMarkdownContent(segment.content)}
            </React.Fragment>
          )
        }

        const alignClass =
          segment.align === "middle"
            ? "items-center"
            : segment.align === "bottom"
              ? "items-end"
              : "items-start"
        const mdColumns = `repeat(${Math.max(1, segment.columns.length)}, minmax(0, 1fr))`
        const style = {
          "--markdown-columns-md": mdColumns,
          gap: `${segment.gap * 0.25}rem`,
        } as CSSProperties
        const columnAlignClass = (columnAlign?: string) => {
          if (columnAlign === "middle") return "self-center"
          if (columnAlign === "bottom") return "self-end"
          return "self-start"
        }

        return (
          <div
            key={`columns-${index}`}
            className={cn(
              "my-4 grid grid-cols-1 md:[grid-template-columns:var(--markdown-columns-md)]",
              alignClass
            )}
            style={style}
          >
            {segment.columns.map((column, columnIndex) => (
              <div
                key={`column-${index}-${columnIndex}`}
                className={cn("min-w-0", columnAlignClass(column.align))}
              >
                {renderMarkdownContent(column.content, "[&_h1:first-child]:mt-0 [&_h2:first-child]:mt-0 [&_h3:first-child]:mt-0 [&_p:first-child]:mt-0")}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
