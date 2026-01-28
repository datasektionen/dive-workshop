import { SIGNATURES } from "@/lib/imagicharm/signatures"

export type CompletionItem = {
  label: string
  type: string
  detail?: string
  info?: string
}

export const COMPLETIONS: CompletionItem[] = [
  // Python keywords
  { label: "if", type: "keyword" },
  { label: "else", type: "keyword" },
  { label: "elif", type: "keyword" },
  { label: "for", type: "keyword" },
  { label: "while", type: "keyword" },
  { label: "in", type: "keyword" },
  { label: "def", type: "keyword" },
  { label: "return", type: "keyword" },
  { label: "break", type: "keyword" },
  { label: "continue", type: "keyword" },
  { label: "pass", type: "keyword" },
  { label: "import", type: "keyword" },
  { label: "from", type: "keyword" },
  { label: "as", type: "keyword" },
  { label: "class", type: "keyword" },
  { label: "try", type: "keyword" },
  { label: "except", type: "keyword" },
  { label: "finally", type: "keyword" },
  { label: "with", type: "keyword" },
  { label: "lambda", type: "keyword" },
  { label: "True", type: "keyword" },
  { label: "False", type: "keyword" },
  { label: "None", type: "keyword" },

  // Common built-ins (details pulled from signatures)
  {
    label: "range",
    type: "function",
    detail: SIGNATURES.range?.label,
    info: SIGNATURES.range?.docs,
  },
  {
    label: "len",
    type: "function",
    detail: SIGNATURES.len?.label,
    info: SIGNATURES.len?.docs,
  },
  {
    label: "print",
    type: "function",
    detail: SIGNATURES.print?.label,
    info: SIGNATURES.print?.docs,
  },
  {
    label: "str",
    type: "function",
    detail: SIGNATURES.str?.label,
    info: SIGNATURES.str?.docs,
  },
  {
    label: "int",
    type: "function",
    detail: SIGNATURES.int?.label,
    info: SIGNATURES.int?.docs,
  },
  {
    label: "float",
    type: "function",
    detail: SIGNATURES.float?.label,
    info: SIGNATURES.float?.docs,
  },
  {
    label: "list",
    type: "function",
    detail: SIGNATURES.list?.label,
    info: SIGNATURES.list?.docs,
  },
  {
    label: "dict",
    type: "function",
    detail: SIGNATURES.dict?.label,
    info: SIGNATURES.dict?.docs,
  },
  {
    label: "tuple",
    type: "function",
    detail: SIGNATURES.tuple?.label,
    info: SIGNATURES.tuple?.docs,
  },
  {
    label: "set",
    type: "function",
    detail: SIGNATURES.set?.label,
    info: SIGNATURES.set?.docs,
  },

  // imagiCharm API (details pulled from signatures where applicable)
  {
    label: "m",
    type: "variable",
    info: "8x8 LED matrix. Access pixels via m[y][x] = (r,g,b).",
  },
  {
    label: "Animation",
    type: "class",
    detail: SIGNATURES.Animation?.label,
    info: SIGNATURES.Animation?.docs,
  },
  {
    label: "clear",
    type: "function",
    detail: SIGNATURES.clear?.label,
    info: SIGNATURES.clear?.docs,
  },
  {
    label: "background",
    type: "function",
    detail: SIGNATURES.background?.label,
    info: SIGNATURES.background?.docs,
  },
  {
    label: "character",
    type: "function",
    detail: SIGNATURES.character?.label,
    info: SIGNATURES.character?.docs,
  },
  {
    label: "scrolling_text",
    type: "function",
    detail: SIGNATURES.scrolling_text?.label,
    info: SIGNATURES.scrolling_text?.docs,
  },
  {
    label: "render",
    type: "function",
    detail: SIGNATURES.render?.label,
    info: SIGNATURES.render?.docs,
  },
  {
    label: "blink_rate",
    type: "variable",
    info: "Blink rate for render (0 = none).",
  },
  {
    label: "outdoor_mode",
    type: "variable",
    info: "Brightness mode for render.",
  },

  // Color constants
  { label: "R", type: "constant" },
  { label: "G", type: "constant" },
  { label: "B", type: "constant" },
  { label: "A", type: "constant" },
  { label: "Y", type: "constant" },
  { label: "O", type: "constant" },
  { label: "M", type: "constant" },
  { label: "P", type: "constant" },
  { label: "W", type: "constant" },
  { label: "K", type: "constant" },
  { label: "on", type: "constant" },
  { label: "off", type: "constant" },
]
