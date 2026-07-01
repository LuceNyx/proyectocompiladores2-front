import { type NextRequest, NextResponse } from "next/server"
import { compile } from "@/lib/compiler"
import type { AstNode, CompileResult, OptimizationDetail, OptimizationFlags, Token, TokenCategory } from "@/lib/compiler"

/**
 * POST /api/compile
 *
 * Request:  { "sourceCode": "<source>" }
 * Response: see lib/compiler/types.ts -> CompileResult
 *
 * If COMPILER_BACKEND_URL is set, the request is proxied to the real C++
 * compiler backend. Otherwise, a TypeScript reference implementation runs the
 * full pipeline (scanner -> parser -> optimizations -> codegen) so the UI works
 * end-to-end without a backend.
 */
export async function POST(req: NextRequest) {
  let sourceCode = ""
  try {
    const body = await req.json()
    sourceCode = typeof body?.sourceCode === "string" ? body.sourceCode : ""
  } catch {
    return NextResponse.json(
      { success: false, errors: ["Cuerpo de la petición inválido: se esperaba JSON con 'sourceCode'."] },
      { status: 400 },
    )
  }

  if (!sourceCode.trim()) {
    return NextResponse.json(
      {
        success: false,
        tokens: [],
        parseStatus: "Sin entrada",
        parseSuccess: false,
        optimizations: { constantFolding: false, cascada: false, sethiUllman: false, peephole: false },
        optimizationDetails: [],
        assembly: "",
        optimizedAssembly: "",
        ast: null,
        errors: ["No se proporcionó código fuente."],
        scannerStatus: "Scanner no ejecutado",
        scannerSuccess: false,
        stats: { tokenCount: 0, lineCount: 0, functionCount: 0 },
      },
      { status: 200 },
    )
  }

  const backendUrl =
    process.env.COMPILER_BACKEND_URL?.trim() ||
    (process.env.NODE_ENV === "development" ? "http://127.0.0.1:3001/compile" : "")
  if (backendUrl) {
    try {
      const res = await fetch(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceCode }),
      })
      if (!res.ok) {
        return NextResponse.json(buildBackendConnectionError(sourceCode, `HTTP ${res.status}`), { status: 200 })
      }
      const data = await res.json()
      return NextResponse.json(normalizeCompileResult(data, sourceCode), { status: res.status })
    } catch (err) {
      return NextResponse.json(buildBackendConnectionError(sourceCode, (err as Error).message), { status: 200 })
    }
  }

  const result = compile(sourceCode)
  return NextResponse.json(result, { status: 200 })
}

function buildBackendConnectionError(sourceCode: string, reason: string): CompileResult {
  return {
    success: false,
    tokens: [],
    parseStatus: "Error de conexion",
    parseSuccess: false,
    optimizations: { constantFolding: false, cascada: false, sethiUllman: false, peephole: false },
    optimizationDetails: [],
    assembly: "",
    optimizedAssembly: "",
    ast: null,
    errors: [`No se pudo contactar al backend configurado: ${reason}`],
    scannerStatus: "Scanner no ejecutado",
    scannerSuccess: false,
    stats: { tokenCount: 0, lineCount: sourceCode.split("\n").length, functionCount: 0 },
  }
}

function normalizeCompileResult(data: unknown, sourceCode: string): CompileResult {
  const value = isRecord(data) ? data : {}
  const tokens = normalizeTokens(value.tokens)
  const optimizations = normalizeOptimizations(value.optimizations)

  return {
    success: asBoolean(value.success, false),
    tokens,
    parseStatus: asString(value.parseStatus, asBoolean(value.parseSuccess, false) ? "Correcto" : "Error"),
    parseSuccess: asBoolean(value.parseSuccess, false),
    optimizations,
    optimizationDetails: normalizeOptimizationDetails(value.optimizationDetails, optimizations),
    assembly: stripStatusLine(asString(value.assembly, "")),
    optimizedAssembly: stripStatusLine(
      asString(
        value.optimizedAssembly,
        asString(value.optimized_assembly, asString(value.assemblyOptimized, asString(value.assemblyOptimizado, ""))),
      ),
    ),
    ast: normalizeAst(value.ast),
    errors: normalizeStringArray(value.errors),
    scannerStatus: asString(value.scannerStatus, asBoolean(value.scannerSuccess, false) ? "Correcto" : "Error"),
    scannerSuccess: asBoolean(value.scannerSuccess, false),
    stats: {
      tokenCount: asNumber(isRecord(value.stats) ? value.stats.tokenCount : undefined, countVisibleTokens(tokens)),
      lineCount: asNumber(isRecord(value.stats) ? value.stats.lineCount : undefined, sourceCode.split("\n").length),
      functionCount: asNumber(isRecord(value.stats) ? value.stats.functionCount : undefined, countFunctions(value.ast)),
    },
  }
}

function normalizeTokens(value: unknown): Token[] {
  if (!Array.isArray(value)) return []

  return value
    .filter(isRecord)
    .map((token) => ({
      type: asString(token.type, "UNKNOWN"),
      lexeme: asString(token.lexeme, ""),
      line: asNumber(token.line, 0),
      column: asNumber(token.column, 0),
      category: normalizeTokenCategory(token.category, token.type, token.lexeme),
    }))
    .filter((token) => token.type !== "END" && token.category !== "comment")
}

function normalizeTokenCategory(category: unknown, type: unknown, lexeme: unknown): TokenCategory {
  const rawLexeme = asString(lexeme, "").toLowerCase()
  if (["i32", "u32", "u8", "f64", "void", "bool"].includes(rawLexeme)) return "type"
  if (rawLexeme === "print") return "builtin"

  const raw = asString(category, "").toLowerCase()
  const normalized: Record<string, TokenCategory> = {
    keyword: "keyword",
    type: "type",
    ident: "ident",
    identifier: "ident",
    number: "number",
    numeric: "number",
    literal: "number",
    string: "string",
    char: "char",
    operator: "operator",
    punct: "punct",
    punctuation: "punct",
    comment: "comment",
    boolean: "boolean",
    null: "null",
    builtin: "builtin",
    error: "error",
  }
  if (normalized[raw]) return normalized[raw]

  const tokenType = asString(type, "").toUpperCase()
  if (tokenType.startsWith("TYPE_") || tokenType === "VOID") return "type"
  if (tokenType.includes("STRING")) return "string"
  if (tokenType.includes("CHAR")) return "char"
  if (tokenType.includes("NUM") || tokenType.includes("INT") || tokenType.includes("FLOAT")) return "number"
  if (tokenType === "PRINT") return "builtin"
  return "ident"
}

function normalizeOptimizations(value: unknown): OptimizationFlags {
  const optimizations = isRecord(value) ? value : {}
  return {
    constantFolding: asBoolean(optimizations.constantFolding, false),
    cascada: asBoolean(optimizations.cascada, false),
    sethiUllman: asBoolean(optimizations.sethiUllman, false),
    peephole: asBoolean(optimizations.peephole, false),
  }
}

function normalizeOptimizationDetails(value: unknown, flags: OptimizationFlags): OptimizationDetail[] {
  const byKey = new Map<keyof OptimizationFlags, OptimizationDetail>()

  if (Array.isArray(value)) {
    value.filter(isRecord).forEach((detail) => {
      const key = normalizeOptimizationKey(detail.key ?? detail.pass)
      if (!key) return
      const applied = typeof detail.applied === "boolean" ? detail.applied : asString(detail.status, "").toLowerCase() === "aplicado"
      byKey.set(key, {
        key,
        title: asString(detail.title, asString(detail.name, fallbackOptimizationTitle(key))),
        description: asString(detail.description, fallbackOptimizationDescription(key)),
        applied,
        notes: normalizeStringArray(detail.notes, buildOptimizationNotes(detail)),
      })
    })
  }

  return (Object.keys(flags) as Array<keyof OptimizationFlags>).map((key) => {
    return (
      byKey.get(key) ?? {
        key,
        title: fallbackOptimizationTitle(key),
        description: fallbackOptimizationDescription(key),
        applied: flags[key],
        notes: [flags[key] ? "Aplicado por el backend." : "No aplicado por el backend."],
      }
    )
  })
}

function normalizeOptimizationKey(value: unknown): keyof OptimizationFlags | null {
  const key = asString(value, "")
  if (key === "constantFolding" || key === "cascada" || key === "sethiUllman" || key === "peephole") return key
  return null
}

function buildOptimizationNotes(detail: Record<string, unknown>): string[] {
  const notes: string[] = []
  const status = asString(detail.status, "")
  if (status) notes.push(`Estado: ${status}`)
  if (isRecord(detail.metrics)) {
    Object.entries(detail.metrics).forEach(([key, value]) => {
      notes.push(`${key}: ${String(value)}`)
    })
  }
  return notes.length ? notes : ["Sin detalles adicionales."]
}

function normalizeAst(value: unknown): AstNode | null {
  if (!isRecord(value)) return null

  const kind = asString(value.kind, asString(value.type, "Node"))
  const label = asString(value.label, buildAstLabel(value, kind))
  const children = collectAstChildren(value)

  return children.length ? { kind, label, children } : { kind, label }
}

function collectAstChildren(value: Record<string, unknown>): AstNode[] {
  const children: AstNode[] = []
  const childKeys = ["children", "declarations", "statements", "params"]

  childKeys.forEach((key) => {
    const childValue = value[key]
    if (Array.isArray(childValue)) {
      childValue.forEach((item) => {
        const child = normalizeAst(item)
        if (child) children.push(child)
      })
    }
  })

  ;["returnType", "body", "argument", "left", "right", "expression"].forEach((key) => {
    const child = normalizeAst(value[key])
    if (child) children.push({ ...child, label: `${key}: ${child.label}` })
  })

  return children
}

function buildAstLabel(value: Record<string, unknown>, kind: string): string {
  const name = asString(value.name, "")
  if (name) return `${kind} ${name}`
  const raw = asString(value.raw, "")
  if (raw) return raw
  if (typeof value.value === "string" || typeof value.value === "number" || typeof value.value === "boolean") {
    return String(value.value)
  }
  return kind
}

function countFunctions(value: unknown): number {
  if (!isRecord(value)) return 0
  const kind = asString(value.kind, asString(value.type, ""))
  const self = kind === "Function" || kind === "FunctionDeclaration" ? 1 : 0
  const childrenSource = value.children ?? value.declarations ?? value.statements ?? value.params
  if (!Array.isArray(childrenSource)) return self
  return self + childrenSource.reduce((total, child) => total + countFunctions(child), 0)
}

function countVisibleTokens(tokens: Token[]): number {
  return tokens.filter((token) => token.category !== "comment").length
}

function stripStatusLine(value: string): string {
  return value.replace(/^Parseo exitoso\r?\n/, "")
}

function fallbackOptimizationTitle(key: keyof OptimizationFlags): string {
  return {
    constantFolding: "Constant Folding",
    cascada: "Optimizacion en cascada",
    sethiUllman: "Sethi-Ullman",
    peephole: "Peephole",
  }[key]
}

function fallbackOptimizationDescription(key: keyof OptimizationFlags): string {
  return {
    constantFolding: "Evalua expresiones constantes en tiempo de compilacion.",
    cascada: "Propaga constantes y simplifica expresiones encadenadas.",
    sethiUllman: "Calcula la presion de registros para generar codigo.",
    peephole: "Optimiza patrones locales sobre el assembly generado.",
  }[key]
}

function normalizeStringArray(value: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) return fallback
  return value.map((item) => String(item)).filter(Boolean)
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
