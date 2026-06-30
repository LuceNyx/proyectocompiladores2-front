import type { CSSProperties, ReactNode } from "react"

const KEYWORDS = new Set([
  "var",
  "const",
  "struct",
  "union",
  "fn",
  "pub",
  "type",
  "comptime",
  "return",
  "if",
  "then",
  "else",
  "while",
  "switch",
  "break",
  "continue",
  "defer",
  "free",
  "and",
  "or",
  "not",
])
const TYPES = new Set(["i32", "u32", "u8", "f64", "void", "bool"])
const BUILTINS = new Set(["print"])
const BOOLS = new Set(["true", "false", "null", "undefined"])

const COLORS: Record<string, string> = {
  keyword: "var(--syn-keyword)",
  type: "var(--syn-type)",
  number: "var(--syn-number)",
  string: "var(--syn-string)",
  char: "var(--syn-char)",
  operator: "var(--syn-operator)",
  comment: "var(--syn-comment)",
  builtin: "var(--syn-builtin)",
  boolean: "var(--syn-boolean)",
  ident: "var(--syn-ident)",
  plain: "inherit",
}

interface Seg {
  value: string
  cls: keyof typeof COLORS
}

/**
 * Lightweight, display-only tokenizer for syntax highlighting the source
 * language. Preserves all characters (including whitespace) so it can be
 * laid over a textarea.
 */
function segmentize(code: string): Seg[] {
  const segs: Seg[] = []
  let i = 0
  const n = code.length
  const isAlpha = (c: string) => /[A-Za-z_]/.test(c)
  const isAlphaNum = (c: string) => /[A-Za-z0-9_]/.test(c)
  const isDigit = (c: string) => /[0-9]/.test(c)

  while (i < n) {
    const c = code[i]

    // whitespace
    if (/\s/.test(c)) {
      let v = ""
      while (i < n && /\s/.test(code[i])) v += code[i++]
      segs.push({ value: v, cls: "plain" })
      continue
    }
    // line comment
    if (c === "/" && code[i + 1] === "/") {
      let v = ""
      while (i < n && code[i] !== "\n") v += code[i++]
      segs.push({ value: v, cls: "comment" })
      continue
    }
    // block comment
    if (c === "/" && code[i + 1] === "*") {
      let v = "/*"
      i += 2
      while (i < n && !(code[i] === "*" && code[i + 1] === "/")) v += code[i++]
      if (i < n) {
        v += "*/"
        i += 2
      }
      segs.push({ value: v, cls: "comment" })
      continue
    }
    // string
    if (c === '"') {
      let v = '"'
      i++
      while (i < n && code[i] !== '"' && code[i] !== "\n") {
        if (code[i] === "\\") v += code[i++]
        if (i < n) v += code[i++]
      }
      if (i < n && code[i] === '"') v += code[i++]
      segs.push({ value: v, cls: "string" })
      continue
    }
    // char
    if (c === "'") {
      let v = "'"
      i++
      while (i < n && code[i] !== "'" && code[i] !== "\n") {
        if (code[i] === "\\") v += code[i++]
        if (i < n) v += code[i++]
      }
      if (i < n && code[i] === "'") v += code[i++]
      segs.push({ value: v, cls: "char" })
      continue
    }
    // number
    if (isDigit(c)) {
      let v = ""
      while (i < n && /[0-9a-fA-FxXbB._]/.test(code[i])) v += code[i++]
      segs.push({ value: v, cls: "number" })
      continue
    }
    // identifier / keyword
    if (isAlpha(c)) {
      let v = ""
      while (i < n && isAlphaNum(code[i])) v += code[i++]
      let cls: Seg["cls"] = "ident"
      if (KEYWORDS.has(v)) cls = "keyword"
      else if (TYPES.has(v)) cls = "type"
      else if (BUILTINS.has(v)) cls = "builtin"
      else if (BOOLS.has(v)) cls = "boolean"
      segs.push({ value: v, cls })
      continue
    }
    // operators
    if (/[+\-*/%=<>!&|.?:]/.test(c)) {
      let v = ""
      while (i < n && /[+\-*/%=<>!&|.?:]/.test(code[i])) v += code[i++]
      segs.push({ value: v, cls: "operator" })
      continue
    }
    // punctuation / other
    let v = ""
    while (i < n && /[()[\]{},;]/.test(code[i])) v += code[i++]
    if (v) {
      segs.push({ value: v, cls: "plain" })
    } else {
      segs.push({ value: code[i++], cls: "plain" })
    }
  }
  return segs
}

export function highlightSource(code: string): ReactNode {
  const segs = segmentize(code)
  return segs.map((s, idx) => {
    if (s.cls === "plain") return s.value
    const style: CSSProperties = { color: COLORS[s.cls] }
    return (
      <span key={idx} style={style}>
        {s.value}
      </span>
    )
  })
}

const ASM_REGISTER = /%[a-z0-9]+/i
export function highlightAssembly(code: string): ReactNode {
  return code.split("\n").map((line, idx) => (
    <div key={idx}>{highlightAsmLine(line)}</div>
  ))
}

function highlightAsmLine(line: string): ReactNode {
  // comments
  const hashIdx = line.indexOf("#")
  let comment: string | null = null
  let rest = line
  if (hashIdx >= 0) {
    comment = line.slice(hashIdx)
    rest = line.slice(0, hashIdx)
  }

  // directive / label / instruction
  const nodes: ReactNode[] = []
  const tokenRe = /(\s+|[,()])/
  const parts = rest.split(tokenRe).filter((p) => p !== "")
  parts.forEach((p, i) => {
    if (/^\s+$/.test(p) || p === "," || p === "(" || p === ")") {
      nodes.push(p)
    } else if (p.startsWith(".")) {
      nodes.push(
        <span key={i} style={{ color: "var(--syn-comment)" }}>
          {p}
        </span>,
      )
    } else if (p.endsWith(":")) {
      nodes.push(
        <span key={i} style={{ color: "var(--syn-builtin)" }}>
          {p}
        </span>,
      )
    } else if (p.startsWith("$")) {
      nodes.push(
        <span key={i} style={{ color: "var(--syn-number)" }}>
          {p}
        </span>,
      )
    } else if (ASM_REGISTER.test(p)) {
      nodes.push(
        <span key={i} style={{ color: "var(--syn-operator)" }}>
          {p}
        </span>,
      )
    } else if (i === 0 || (i === 1 && /^\s+$/.test(parts[0]))) {
      nodes.push(
        <span key={i} style={{ color: "var(--syn-keyword)" }}>
          {p}
        </span>,
      )
    } else {
      nodes.push(p)
    }
  })

  if (comment) {
    nodes.push(
      <span key="c" style={{ color: "var(--syn-comment)" }}>
        {comment}
      </span>,
    )
  }
  return nodes.length ? nodes : "\u00A0"
}
