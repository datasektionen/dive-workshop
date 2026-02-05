"use client"

import * as React from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"

import { Button } from "@/components/ui/button"

type RichTextEditorProps = {
  value: string
  onChange: (value: string) => void
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        codeBlock: {
          HTMLAttributes: {
            class:
              "tiptap-code-block bg-muted/80 text-foreground rounded-md p-3 text-sm font-mono my-2",
          },
        },
        code: {
          HTMLAttributes: {
            class:
              "tiptap-inline-code bg-muted/80 text-foreground rounded px-1 py-0.5 text-xs font-mono",
          },
        },
      }),
    ],
    content: value || "",
    immediatelyRender: false,
    onUpdate: ({ editor: activeEditor }) => {
      onChange(activeEditor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[200px] px-3 py-2 text-sm leading-6 focus:outline-none [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_li]:my-1 [&_pre]:whitespace-pre-wrap [&_pre]:bg-muted/80 [&_pre]:rounded-md [&_pre]:p-3",
      },
    },
  })

  React.useEffect(() => {
    if (!editor) return
    const nextValue = value || ""
    if (!editor.isFocused && editor.getHTML() !== nextValue) {
      editor.commands.setContent(nextValue, { emitUpdate: false })
    }
  }, [editor, value])

  return (
    <div className="rounded-md border bg-background">
      <div className="flex flex-wrap gap-2 border-b p-2">
        <Button
          type="button"
          variant={editor?.isActive("bold") ? "default" : "secondary"}
          size="sm"
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          Bold
        </Button>
        <Button
          type="button"
          variant={editor?.isActive("italic") ? "default" : "secondary"}
          size="sm"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          Italic
        </Button>
        <Button
          type="button"
          variant={editor?.isActive("heading", { level: 2 }) ? "default" : "secondary"}
          size="sm"
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          H2
        </Button>
        <Button
          type="button"
          variant={editor?.isActive("heading", { level: 3 }) ? "default" : "secondary"}
          size="sm"
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          H3
        </Button>
        <Button
          type="button"
          variant={editor?.isActive("code") ? "default" : "secondary"}
          size="sm"
          onClick={() => editor?.chain().focus().toggleCode().run()}
        >
          Inline code
        </Button>
        <Button
          type="button"
          variant={editor?.isActive("codeBlock") ? "default" : "secondary"}
          size="sm"
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
        >
          Code block
        </Button>
        <Button
          type="button"
          variant={editor?.isActive("bulletList") ? "default" : "secondary"}
          size="sm"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          Bullets
        </Button>
        <Button
          type="button"
          variant={editor?.isActive("orderedList") ? "default" : "secondary"}
          size="sm"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          Numbered
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
