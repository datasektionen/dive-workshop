"use client";

import { hoverTooltip, showTooltip, type Tooltip } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import {
  StateField,
  type Extension,
  type EditorState,
} from "@codemirror/state";

import { SIGNATURES } from "@/lib/imagicharm/signatures";

type SignatureMatch = {
  name: string;
  from: number;
  to: number;
};

function isWordChar(ch: string) {
  return /[A-Za-z_]/.test(ch);
}

function getWordAt(state: EditorState, pos: number) {
  const line = state.doc.lineAt(pos);
  let start = pos;
  let end = pos;

  while (
    start > line.from &&
    isWordChar(state.doc.sliceString(start - 1, start))
  ) {
    start -= 1;
  }
  while (end < line.to && isWordChar(state.doc.sliceString(end, end + 1))) {
    end += 1;
  }

  if (start === end) return null;
  return { word: state.doc.sliceString(start, end), from: start, to: end };
}

function findCallSignature(
  state: EditorState,
  pos: number,
): SignatureMatch | null {
  const tree = syntaxTree(state);
  const node = tree.resolveInner(pos, -1);
  if (!node) return null;

  let current: any = node;
  while (current) {
    if (current.type?.name === "CallExpression") {
      const callee =
        current.getChild("VariableName") || current.getChild("Identifier");
      if (!callee) return null;
      const name = state.doc.sliceString(callee.from, callee.to);
      if (SIGNATURES[name]) {
        return { name, from: callee.from, to: callee.to };
      }
      return null;
    }
    current = current.parent;
  }

  return null;
}

function findCallAtPosition(state: EditorState, pos: number) {
  const tree = syntaxTree(state);
  const node = tree.resolveInner(pos, -1);
  if (!node) return null;

  let current: any = node;
  while (current) {
    if (current.type?.name === "CallExpression") {
      const callee =
        current.getChild("VariableName") || current.getChild("Identifier");
      const argsNode = current.getChild("ArgList");
      if (!callee || !argsNode) return null;
      if (pos < argsNode.from || pos > argsNode.to) return null;
      const name = state.doc.sliceString(callee.from, callee.to);
      if (!SIGNATURES[name]) return null;
      return {
        name,
        from: callee.from,
        to: callee.to,
        argsFrom: argsNode.from,
        argsTo: argsNode.to,
      };
    }
    current = current.parent;
  }
  return null;
}

function getActiveParamIndex(state: EditorState, pos: number): number {
  const tree = syntaxTree(state);
  const node = tree.resolveInner(pos, -1);
  if (!node) return 0;

  let current: any = node;
  while (current && current.type?.name !== "CallExpression") {
    current = current.parent;
  }

  if (!current) return 0;

  const argsNode = current.getChild("ArgList");
  if (!argsNode) return 0;

  const start = argsNode.from;
  const end = Math.min(pos, argsNode.to);
  const text = state.doc.sliceString(start, end);
  let depth = 0;
  let commas = 0;

  for (const ch of text) {
    if (ch === "(" || ch === "[" || ch === "{") depth += 1;
    if (ch === ")" || ch === "]" || ch === "}") depth -= 1;
    if (ch === "," && depth === 0) commas += 1;
  }

  return commas;
}

function buildTooltipDom(signature: { label: string; docs: string }) {
  const dom = document.createElement("div");
  dom.className = "rounded-md border !bg-background px-3 py-2 text-xs shadow";
  dom.innerHTML = `
    <div class="font-semibold">${signature.label}</div>
    <div class="text-muted-foreground">${signature.docs}</div>
  `;
  return dom;
}

export function signatureTooltip(): Extension {
  return hoverTooltip((view, pos) => {
    const match = findCallSignature(view.state, pos);
    if (!match) return null;
    const signature = SIGNATURES[match.name];
    if (!signature) return null;
    // If the cursor is inside the argument list, let the active-arg tooltip win.
    const cursorPos = view.state.selection.main.head;
    const activeMatch = findCallAtPosition(view.state, cursorPos);
    if (activeMatch && activeMatch.name === match.name) {
      if (cursorPos > activeMatch.argsFrom && cursorPos < activeMatch.argsTo) {
        return null;
      }
    }

    return {
      pos: match.from,
      end: match.to,
      above: true,
      create: () => ({ dom: buildTooltipDom(signature) }),
    };
  });
}

export function activeParameterHint(): Extension {
  const field = StateField.define<Tooltip | null>({
    create(state) {
      return buildActiveTooltip(state);
    },
    update(value, tr) {
      if (tr.docChanged || tr.selection) {
        return buildActiveTooltip(tr.state);
      }
      return value;
    },
    provide: (f) => showTooltip.from(f),
  });

  function buildActiveTooltip(state: EditorState): Tooltip | null {
    const pos = state.selection.main.head;
    const match = findCallAtPosition(state, pos);
    if (!match) return null;
    if (pos <= match.argsFrom || pos >= match.argsTo) return null;
    const signature = SIGNATURES[match.name];
    if (!signature) return null;

    return {
      pos: match.from,
      end: match.to,
      above: true,
      create: () => ({ dom: buildTooltipDom(signature) }),
    };
  }

  return field;
}
