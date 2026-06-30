import type { AstNode, Token } from "./types"

export interface ParseResult {
  success: boolean
  status: string
  errors: string[]
  ast: AstNode
  functionCount: number
}

/**
 * A pragmatic recursive-descent parser for the language. It is intentionally
 * tolerant: it validates the most common constructs, builds a presentable AST,
 * and reports the first meaningful syntactic error. It mirrors the behavior of
 * the real C++ parser ("Parseo exitoso" / "Error al parsear: ...").
 */
export function parse(allTokens: Token[]): ParseResult {
  const tokens = allTokens.filter((t) => t.category !== "comment")
  const errors: string[] = []
  let pos = 0

  const peek = (o = 0): Token | undefined => tokens[pos + o]
  const atEnd = () => pos >= tokens.length
  const next = () => tokens[pos++]

  const isLexeme = (lex: string, o = 0) => peek(o)?.lexeme === lex
  const isType = (type: string, o = 0) => peek(o)?.type === type

  const expectLexeme = (lex: string, context: string): boolean => {
    if (isLexeme(lex)) {
      next()
      return true
    }
    const t = peek()
    errors.push(
      `Error al parsear: se esperaba '${lex}' ${context}` +
        (t ? `, se encontró '${t.lexeme}' en línea ${t.line}` : " al final del archivo"),
    )
    return false
  }

  const declarations: AstNode[] = []
  let functionCount = 0

  // ---- Type annotations: i32, *T, ?T, [n]T, identifiers ----
  function parseType(): string {
    let prefix = ""
    while (isLexeme("*") || isLexeme("?") || isLexeme("[")) {
      if (isLexeme("[")) {
        next()
        let inner = ""
        while (!atEnd() && !isLexeme("]")) inner += next().lexeme
        expectLexeme("]", "en tipo arreglo")
        prefix += `[${inner}]`
      } else {
        prefix += next().lexeme
      }
    }
    const base = peek()
    if (base && (base.category === "type" || base.type === "IDENTIFIER")) {
      next()
      return prefix + base.lexeme
    }
    return prefix || "?"
  }

  // ---- Skip a balanced { } block and collect its statements ----
  function parseBlock(): AstNode[] {
    const stmts: AstNode[] = []
    if (!expectLexeme("{", "para abrir bloque")) return stmts
    let guard = 0
    while (!atEnd() && !isLexeme("}") && guard++ < 10000) {
      const before = pos
      const stmt = parseStatement()
      if (stmt) stmts.push(stmt)
      if (pos === before) next() // ensure progress
    }
    expectLexeme("}", "para cerrar bloque")
    return stmts
  }

  function skipToSemicolonOrBrace() {
    while (!atEnd() && !isLexeme(";") && !isLexeme("}")) next()
    if (isLexeme(";")) next()
  }

  function parseStatement(): AstNode | null {
    const t = peek()
    if (!t) return null

    switch (t.type) {
      case "VAR":
      case "CONST": {
        next()
        const name = peek()?.lexeme ?? "?"
        next()
        if (isLexeme(":")) {
          next()
          parseType()
        }
        if (isLexeme("=")) {
          next()
          skipToSemicolonOrBrace()
        } else {
          expectLexeme(";", "tras declaración")
        }
        return { kind: "VarDecl", label: `${t.lexeme} ${name}` }
      }
      case "RETURN": {
        next()
        if (isLexeme(";")) {
          next()
          return { kind: "Return", label: "return" }
        }
        skipToSemicolonOrBrace()
        return { kind: "Return", label: "return expr" }
      }
      case "PRINT": {
        next()
        expectLexeme("(", "tras print")
        let depth = 1
        let expr = ""
        while (!atEnd() && depth > 0) {
          if (isLexeme("(")) depth++
          if (isLexeme(")")) {
            depth--
            if (depth === 0) break
          }
          expr += next().lexeme + " "
        }
        expectLexeme(")", "para cerrar print")
        expectLexeme(";", "tras print")
        return { kind: "Print", label: `print(${expr.trim().slice(0, 24)})` }
      }
      case "IF": {
        next()
        expectLexeme("(", "tras if")
        let depth = 1
        while (!atEnd() && depth > 0) {
          if (isLexeme("(")) depth++
          else if (isLexeme(")")) depth--
          if (depth === 0) break
          next()
        }
        expectLexeme(")", "para cerrar condición if")
        if (isLexeme("then")) next()
        const thenBody = parseBlock()
        const node: AstNode = { kind: "If", label: "if", children: [{ kind: "Then", label: "then", children: thenBody }] }
        if (isLexeme("else")) {
          next()
          if (isLexeme("then")) next()
          const elseBody = parseBlock()
          node.children!.push({ kind: "Else", label: "else", children: elseBody })
        }
        return node
      }
      case "WHILE": {
        next()
        expectLexeme("(", "tras while")
        let depth = 1
        while (!atEnd() && depth > 0) {
          if (isLexeme("(")) depth++
          else if (isLexeme(")")) depth--
          if (depth === 0) break
          next()
        }
        expectLexeme(")", "para cerrar condición while")
        const body = parseBlock()
        return { kind: "While", label: "while", children: body }
      }
      case "SWITCH": {
        next()
        expectLexeme("(", "tras switch")
        let depth = 1
        while (!atEnd() && depth > 0) {
          if (isLexeme("(")) depth++
          else if (isLexeme(")")) depth--
          if (depth === 0) break
          next()
        }
        expectLexeme(")", "para cerrar switch")
        const body = parseBlock()
        return { kind: "Switch", label: "switch", children: body }
      }
      case "BREAK":
        next()
        expectLexeme(";", "tras break")
        return { kind: "Break", label: "break" }
      case "CONTINUE":
        next()
        expectLexeme(";", "tras continue")
        return { kind: "Continue", label: "continue" }
      case "DEFER": {
        next()
        skipToSemicolonOrBrace()
        return { kind: "Defer", label: "defer" }
      }
      default: {
        // Expression / assignment statement: ident (.field | [idx] | *)... = expr ;
        if (t.type === "IDENTIFIER" || t.lexeme === "*") {
          let label = ""
          while (!atEnd() && !isLexeme(";") && !isLexeme("}")) {
            label += next().lexeme
          }
          expectLexeme(";", "tras sentencia")
          const isAssign = label.includes("=")
          return { kind: isAssign ? "Assign" : "ExprStmt", label: label.slice(0, 28) }
        }
        errors.push(`Error al parsear: sentencia inesperada '${t.lexeme}' en línea ${t.line}`)
        skipToSemicolonOrBrace()
        return null
      }
    }
  }

  function parseFunction(isPub: boolean): AstNode {
    next() // fn
    const name = peek()?.type === "IDENTIFIER" ? next().lexeme : "?"
    const params: AstNode[] = []
    expectLexeme("(", "tras nombre de función")
    while (!atEnd() && !isLexeme(")")) {
      const pName = peek()?.lexeme ?? "?"
      if (peek()?.type === "IDENTIFIER") {
        next()
        let pType = "?"
        if (isLexeme(":")) {
          next()
          pType = parseType()
        }
        params.push({ kind: "Param", label: `${pName}: ${pType}` })
      } else {
        next()
      }
      if (isLexeme(",")) next()
    }
    expectLexeme(")", "para cerrar parámetros")
    let retType = "void"
    if (!isLexeme("{")) retType = parseType()
    const body = parseBlock()
    functionCount++
    return {
      kind: "Function",
      label: `${isPub ? "pub " : ""}fn ${name}() ${retType}`,
      children: [
        { kind: "Params", label: "parámetros", children: params.length ? params : [{ kind: "Param", label: "(ninguno)" }] },
        { kind: "Body", label: "cuerpo", children: body },
      ],
    }
  }

  function parseAggregate(keyword: Token): AstNode {
    next() // struct / union
    const name = peek()?.type === "IDENTIFIER" ? next().lexeme : "?"
    const fields: AstNode[] = []
    if (isLexeme("{")) {
      next()
      while (!atEnd() && !isLexeme("}")) {
        const fName = peek()?.lexeme ?? "?"
        if (peek()?.type === "IDENTIFIER") {
          next()
          let fType = "?"
          if (isLexeme(":")) {
            next()
            fType = parseType()
          }
          fields.push({ kind: "Field", label: `${fName}: ${fType}` })
        } else {
          next()
        }
        if (isLexeme(",")) next()
      }
      expectLexeme("}", "para cerrar struct/union")
    }
    if (isLexeme(";")) next()
    return {
      kind: keyword.lexeme === "struct" ? "Struct" : "Union",
      label: `${keyword.lexeme} ${name}`,
      children: fields,
    }
  }

  // ---- Top level ----
  let guard = 0
  while (!atEnd() && guard++ < 10000) {
    const before = pos
    const t = peek()!
    if (t.type === "PUB") {
      if (peek(1)?.type === "FN") {
        next()
        declarations.push(parseFunction(true))
      } else {
        next()
      }
    } else if (t.type === "FN") {
      declarations.push(parseFunction(false))
    } else if (t.type === "STRUCT" || t.type === "UNION") {
      declarations.push(parseAggregate(t))
    } else if (t.type === "VAR" || t.type === "CONST") {
      const d = parseStatement()
      if (d) declarations.push(d)
    } else if (t.type === "COMPTIME") {
      next()
      const body = parseBlock()
      declarations.push({ kind: "Comptime", label: "comptime", children: body })
    } else if (t.type === "TYPE") {
      // type alias / template: skip to ; or }
      skipToSemicolonOrBrace()
    } else {
      errors.push(`Error al parsear: declaración inesperada '${t.lexeme}' en línea ${t.line}`)
      next()
    }
    if (pos === before) next()
  }

  const ast: AstNode = {
    kind: "Program",
    label: "Programa",
    children: declarations.length ? declarations : [{ kind: "Empty", label: "(sin declaraciones)" }],
  }

  const success = errors.length === 0 && tokens.length > 0
  return {
    success,
    status: success ? "Parseo exitoso" : `Error al parsear: ${errors[0]?.replace(/^Error al parsear:\s*/, "") ?? "entrada inválida"}`,
    errors,
    ast,
    functionCount,
  }
}
