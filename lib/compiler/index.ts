import { generateCode } from "./codegen"
import { parse } from "./parser"
import { tokenize } from "./tokenizer"
import type { CompileResult } from "./types"

export * from "./types"
export { tokenize } from "./tokenizer"

/**
 * Runs the full pipeline: scanner -> parser -> optimizations -> codegen.
 * This is a TypeScript reference implementation that lets the UI work
 * end-to-end. Swap the API route to a real C++ backend without touching the UI.
 */
export function compile(source: string): CompileResult {
  const lineCount = source.split("\n").length

  // ---- Scanner ----
  const { tokens, errors: lexErrors } = tokenize(source)
  const scannerSuccess = lexErrors.length === 0
  const scannerStatus = scannerSuccess ? "Scanner exitoso" : "Scanner no exitoso"

  // ---- Parser ----
  const parseResult = parse(tokens)

  const allErrors = [...lexErrors, ...parseResult.errors]
  const success = scannerSuccess && parseResult.success

  // ---- Optimizations + Codegen ----
  let assembly = ""
  let optimizedAssembly = ""
  let optimizations = { constantFolding: false, cascada: false, sethiUllman: false, peephole: false }
  let optimizationDetails = generateEmptyDetails()

  if (success) {
    const gen = generateCode({ ast: parseResult.ast, source })
    assembly = gen.assembly
    optimizedAssembly = gen.optimizedAssembly
    optimizations = gen.optimizations
    optimizationDetails = gen.optimizationDetails
  }

  return {
    success,
    tokens,
    parseStatus: scannerSuccess ? parseResult.status : "Parseo no ejecutado (error léxico)",
    parseSuccess: parseResult.success && scannerSuccess,
    optimizations,
    optimizationDetails,
    assembly,
    optimizedAssembly,
    ast: success ? parseResult.ast : parseResult.ast,
    errors: allErrors,
    scannerStatus,
    scannerSuccess,
    stats: {
      tokenCount: tokens.filter((t) => t.category !== "comment").length,
      lineCount,
      functionCount: parseResult.functionCount,
    },
  }
}

function generateEmptyDetails() {
  return [
    {
      key: "constantFolding" as const,
      title: "Constant Folding",
      description: "Evalúa expresiones constantes en tiempo de compilación.",
      applied: false,
      notes: ["No ejecutado: corrige los errores primero."],
    },
    {
      key: "cascada" as const,
      title: "Optimización en cascada",
      description: "Propagación de constantes y simplificación algebraica encadenada.",
      applied: false,
      notes: ["No ejecutado: corrige los errores primero."],
    },
    {
      key: "sethiUllman" as const,
      title: "Sethi-Ullman",
      description: "Numeración para minimizar el uso de registros.",
      applied: false,
      notes: ["No ejecutado: corrige los errores primero."],
    },
    {
      key: "peephole" as const,
      title: "Peephole",
      description: "Optimización local sobre el assembly generado.",
      applied: false,
      notes: ["No ejecutado: corrige los errores primero."],
    },
  ]
}
