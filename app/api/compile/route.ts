import { type NextRequest, NextResponse } from "next/server"
import { compile } from "@/lib/compiler"

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

  const backendUrl = process.env.COMPILER_BACKEND_URL
  if (backendUrl) {
    try {
      const res = await fetch(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceCode }),
      })
      const data = await res.json()
      return NextResponse.json(data, { status: res.status })
    } catch (err) {
      return NextResponse.json(
        {
          success: false,
          errors: [`No se pudo contactar al backend del compilador: ${(err as Error).message}`],
        },
        { status: 502 },
      )
    }
  }

  const result = compile(sourceCode)
  return NextResponse.json(result, { status: 200 })
}
