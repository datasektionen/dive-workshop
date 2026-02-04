"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { EditorView } from "@codemirror/view";
import { oneDark } from "@codemirror/theme-one-dark";

const lightTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "var(--background)",
      color: "var(--foreground)",
    },
    ".cm-editor": {
      backgroundColor: "color-mix(in oklch, var(--muted), white 60%)",
    },
    ".cm-scroller": {
      backgroundColor: "color-mix(in oklch, var(--muted), white 60%)",
    },
    ".cm-content": {
      caretColor: "var(--foreground)",
    },
    ".cm-gutters": {
      backgroundColor: "var(--muted)",
      color: "var(--muted-foreground)",
      borderRight: "1px solid var(--border)",
    },
    ".cm-activeLine": {
      backgroundColor: "color-mix(in oklch, var(--primary), transparent 96%)",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "color-mix(in oklch, var(--primary), transparent 94%)",
    },
    ".cm-selectionBackground": {
      backgroundColor: "color-mix(in oklch, var(--primary), transparent 90%)",
    },
    ".cm-cursor": {
      borderLeftColor: "var(--foreground)",
    },
  },
  { dark: false },
);

export function useCodeMirrorTheme() {
  const { resolvedTheme } = useTheme();
  return React.useMemo(
    () => (resolvedTheme === "dark" ? oneDark : lightTheme),
    [resolvedTheme],
  );
}
