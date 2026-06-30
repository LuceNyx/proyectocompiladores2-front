import type { Token, TokenCategory } from "./types"

/** Keywords mapped to their uppercase token type. */
const KEYWORDS: Record<string, string> = {
  var: "VAR",
  const: "CONST",
  struct: "STRUCT",
  union: "UNION",
  fn: "FN",
  pub: "PUB",
  type: "TYPE",
  comptime: "COMPTIME",
  return: "RETURN",
  if: "IF",
  then: "THEN",
  else: "ELSE",
  while: "WHILE",
  switch: "SWITCH",
  break: "BREAK",
  continue: "CONTINUE",
  defer: "DEFER",
  free: "FREE",
  print: "PRINT",
  and: "AND",
  or: "OR",
  not: "NOT",
}

const TYPE_KEYWORDS = new Set(["i32", "u32", "u8", "f64", "void", "bool"])
const BOOLEANS = new Set(["true", "false"])
const NULLISH = new Set(["null", "undefined"])

/** Multi-character operators, ordered longest-first for greedy matching. */
const OPERATORS = [
  "==",
  "!=",
  "<=",
  ">=",
  "&&",
  "||",
  "=>",
  "+",
  "-",
  "*",
  "/",
  "%",
  "<",
  ">",
  "=",
  "!",
  "&",
  ".",
]

const PUNCT = new Set(["(", ")", "{", "}", "[", "]", ",", ";", ":", "?"])

const isDigit = (c: string) => c >= "0" && c <= "9"
const isAlpha = (c: string) => (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_"
const isAlphaNum = (c: string) => isAlpha(c) || isDigit(c)

export interface TokenizeResult {
  tokens: Token[]
  /** Lexical errors, e.g. invalid characters or unterminated strings. */
  errors: string[]
}

export function tokenize(source: string): TokenizeResult {
  const tokens: Token[] = []
  const errors: string[] = []

  let i = 0
  let line = 1
  let col = 1

  const advance = (n = 1) => {
    for (let k = 0; k < n; k++) {
      if (source[i] === "\n") {
        line++
        col = 1
      } else {
        col++
      }
      i++
    }
  }

  const push = (type: string, lexeme: string, category: TokenCategory, startLine: number, startCol: number) => {
    tokens.push({ type, lexeme, line: startLine, column: startCol, category })
  }

  while (i < source.length) {
    const c = source[i]

    // Whitespace
    if (c === " " || c === "\t" || c === "\r" || c === "\n") {
      advance()
      continue
    }

    const startLine = line
    const startCol = col

    // Line comment //
    if (c === "/" && source[i + 1] === "/") {
      let lexeme = ""
      while (i < source.length && source[i] !== "\n") {
        lexeme += source[i]
        advance()
      }
      push("COMMENT", lexeme, "comment", startLine, startCol)
      continue
    }

    // Block comment /* */
    if (c === "/" && source[i + 1] === "*") {
      let lexeme = ""
      while (i < source.length && !(source[i] === "*" && source[i + 1] === "/")) {
        lexeme += source[i]
        advance()
      }
      if (i < source.length) {
        lexeme += "*/"
        advance(2)
      } else {
        errors.push(`Error léxico: comentario sin cerrar en línea ${startLine}`)
      }
      push("COMMENT", lexeme, "comment", startLine, startCol)
      continue
    }

    // String literal
    if (c === '"') {
      let lexeme = '"'
      advance()
      let closed = false
      while (i < source.length) {
        const ch = source[i]
        if (ch === "\n") break
        lexeme += ch
        if (ch === "\\" && i + 1 < source.length) {
          advance()
          lexeme += source[i]
          advance()
          continue
        }
        advance()
        if (ch === '"') {
          closed = true
          break
        }
      }
      if (!closed) {
        errors.push(`Error léxico: string sin cerrar en línea ${startLine}, columna ${startCol}`)
        push("ERROR", lexeme, "error", startLine, startCol)
      } else {
        push("STRING", lexeme, "string", startLine, startCol)
      }
      continue
    }

    // Char literal
    if (c === "'") {
      let lexeme = "'"
      advance()
      let closed = false
      while (i < source.length) {
        const ch = source[i]
        if (ch === "\n") break
        lexeme += ch
        if (ch === "\\" && i + 1 < source.length) {
          advance()
          lexeme += source[i]
          advance()
          continue
        }
        advance()
        if (ch === "'") {
          closed = true
          break
        }
      }
      if (!closed) {
        errors.push(`Error léxico: carácter sin cerrar en línea ${startLine}, columna ${startCol}`)
        push("ERROR", lexeme, "error", startLine, startCol)
      } else {
        push("CHAR", lexeme, "char", startLine, startCol)
      }
      continue
    }

    // Numbers: hex, binary, float, integer
    if (isDigit(c)) {
      let lexeme = ""
      let type = "INTEGER"

      if (c === "0" && (source[i + 1] === "x" || source[i + 1] === "X")) {
        lexeme += source[i] + source[i + 1]
        advance(2)
        while (i < source.length && /[0-9a-fA-F]/.test(source[i])) {
          lexeme += source[i]
          advance()
        }
        type = "HEX"
      } else if (c === "0" && (source[i + 1] === "b" || source[i + 1] === "B")) {
        lexeme += source[i] + source[i + 1]
        advance(2)
        while (i < source.length && (source[i] === "0" || source[i] === "1")) {
          lexeme += source[i]
          advance()
        }
        type = "BINARY"
      } else {
        while (i < source.length && isDigit(source[i])) {
          lexeme += source[i]
          advance()
        }
        if (source[i] === "." && isDigit(source[i + 1])) {
          lexeme += "."
          advance()
          while (i < source.length && isDigit(source[i])) {
            lexeme += source[i]
            advance()
          }
          type = "FLOAT"
        }
      }
      push(type, lexeme, "number", startLine, startCol)
      continue
    }

    // Identifiers / keywords
    if (isAlpha(c)) {
      let lexeme = ""
      while (i < source.length && isAlphaNum(source[i])) {
        lexeme += source[i]
        advance()
      }
      if (KEYWORDS[lexeme]) {
        const cat: TokenCategory = lexeme === "print" ? "builtin" : "keyword"
        push(KEYWORDS[lexeme], lexeme, cat, startLine, startCol)
      } else if (TYPE_KEYWORDS.has(lexeme)) {
        push("TYPE_" + lexeme.toUpperCase(), lexeme, "type", startLine, startCol)
      } else if (BOOLEANS.has(lexeme)) {
        push("BOOLEAN", lexeme, "boolean", startLine, startCol)
      } else if (NULLISH.has(lexeme)) {
        push(lexeme.toUpperCase(), lexeme, "null", startLine, startCol)
      } else {
        push("IDENTIFIER", lexeme, "ident", startLine, startCol)
      }
      continue
    }

    // Operators
    let matchedOp = false
    for (const op of OPERATORS) {
      if (source.startsWith(op, i)) {
        push("OP", op, "operator", startLine, startCol)
        advance(op.length)
        matchedOp = true
        break
      }
    }
    if (matchedOp) continue

    // Punctuation
    if (PUNCT.has(c)) {
      push("PUNCT", c, "punct", startLine, startCol)
      advance()
      continue
    }

    // Unknown / invalid character
    errors.push(`Error léxico: carácter inválido '${c}' en línea ${startLine}, columna ${startCol}`)
    push("ERROR", c, "error", startLine, startCol)
    advance()
  }

  return { tokens, errors }
}
