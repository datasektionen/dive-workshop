import { SIGNATURES } from "@/lib/imagicharm/signatures";

export type CompletionItem = {
  label: string;
  type: string;
  detail?: string;
  info?: string;
};

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
  { label: "import", type: "keyword" },
  { label: "True", type: "keyword" },
  { label: "False", type: "keyword" },
  { label: "None", type: "keyword" },

  // Common built-ins (details pulled from signatures)
  {
    label: "range",
    type: "function",
    info: SIGNATURES.range?.docs,
  },
  {
    label: "len",
    type: "function",
    info: SIGNATURES.len?.docs,
  },
  {
    label: "print",
    type: "function",
    info: SIGNATURES.print?.docs,
  },
  {
    label: "str",
    type: "function",
    info: SIGNATURES.str?.docs,
  },
  {
    label: "int",
    type: "function",
    info: SIGNATURES.int?.docs,
  },
  {
    label: "float",
    type: "function",
    info: SIGNATURES.float?.docs,
  },
  {
    label: "list",
    type: "function",
    info: SIGNATURES.list?.docs,
  },
  {
    label: "dict",
    type: "function",
    info: SIGNATURES.dict?.docs,
  },
  {
    label: "tuple",
    type: "function",
    info: SIGNATURES.tuple?.docs,
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
    info: SIGNATURES.Animation?.docs,
  },
  {
    label: "clear",
    type: "function",
    info: SIGNATURES.clear?.docs,
  },
  {
    label: "background",
    type: "function",
    info: SIGNATURES.background?.docs,
  },
  {
    label: "character",
    type: "function",
    info: SIGNATURES.character?.docs,
  },
  {
    label: "scrolling_text",
    type: "function",
    info: SIGNATURES.scrolling_text?.docs,
  },
  {
    label: "render",
    type: "function",
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
  { label: "R", type: "constant", info: "Red color" },
  { label: "G", type: "constant", info: "Green color" },
  { label: "B", type: "constant", info: "Blue color" },
  { label: "A", type: "constant", info: "Aqua color" },
  { label: "Y", type: "constant", info: "Yellow color" },
  { label: "O", type: "constant", info: "Orange color" },
  { label: "M", type: "constant", info: "Magenta color" },
  { label: "P", type: "constant", info: "Purple color" },
  { label: "W", type: "constant", info: "White color" },
  { label: "K", type: "constant", info: "Black color" },
  { label: "on", type: "constant", info: "White color" },
  { label: "off", type: "constant", info: "Black color" },
];
