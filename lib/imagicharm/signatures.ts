export type SignatureInfo = {
  label: string
  params: string[]
  docs: string
}

export const SIGNATURES: Record<string, SignatureInfo> = {
  print: {
    label: "print(*objects, sep=' ', end='\\n')",
    params: ["*objects", "sep", "end"],
    docs: "Print objects to the console.",
  },
  range: {
    label: "range(start, stop[, step])",
    params: ["start", "stop", "step"],
    docs: "Create an arithmetic progression of integers.",
  },
  len: {
    label: "len(obj)",
    params: ["obj"],
    docs: "Return the number of items in a container.",
  },
  str: {
    label: "str(obj='')",
    params: ["obj"],
    docs: "Convert object to string.",
  },
  int: {
    label: "int(x=0)",
    params: ["x"],
    docs: "Convert value to integer.",
  },
  float: {
    label: "float(x=0.0)",
    params: ["x"],
    docs: "Convert value to float.",
  },
  list: {
    label: "list(iterable=())",
    params: ["iterable"],
    docs: "Create a list from an iterable.",
  },
  dict: {
    label: "dict(**kwargs)",
    params: ["kwargs"],
    docs: "Create a dictionary.",
  },
  tuple: {
    label: "tuple(iterable=())",
    params: ["iterable"],
    docs: "Create a tuple from an iterable.",
  },
  set: {
    label: "set(iterable=())",
    params: ["iterable"],
    docs: "Create a set from an iterable.",
  },
  clear: {
    label: "clear()",
    params: [],
    docs: "Clear the matrix to off (black).",
  },
  background: {
    label: "background(color)",
    params: ["color"],
    docs: "Fill the matrix with a color tuple.",
  },
  character: {
    label: "character(char, char_color=on, back_color=0)",
    params: ["char", "char_color", "back_color"],
    docs: "Draw a character on the matrix.",
  },
  scrolling_text: {
    label: "scrolling_text(text, text_color=on, back_color=off, duration=80, loop_count=0)",
    params: ["text", "text_color", "back_color", "duration", "loop_count"],
    docs: "Scroll text across the matrix.",
  },
  render: {
    label: "render(animation=None, blink_rate=0, outdoor_mode=True, path=None, scale=8)",
    params: ["animation", "blink_rate", "outdoor_mode", "path", "scale"],
    docs: "Render the current matrix or animation.",
  },
  Animation: {
    label: "Animation(loop_count=0)",
    params: ["loop_count"],
    docs: "Animation container for frames.",
  },
}
