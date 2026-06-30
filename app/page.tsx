"use client"

import { CodeEditor } from "@/components/code-editor"
import { Header } from "@/components/header"
import { ResultsPanel } from "@/components/results-panel"
import { Sidebar } from "@/components/sidebar"
import type { CompileResult } from "@/lib/compiler/types"
import { DEFAULT_EXAMPLE, EXAMPLES } from "@/lib/examples"
import { useCallback, useState } from "react"

export default function Page() {
  const [code, setCode] = useState<string>(DEFAULT_EXAMPLE)
  const [result, setResult] = useState<CompileResult | null>(null)
  const [isCompiling, setIsCompiling] = useState(false)
  const [activeExample, setActiveExample] = useState<string | null>("default")
  const [fileName, setFileName] = useState<string>("input.zig")

  const handleSelectExample = useCallback((id: string) => {
    const ex = EXAMPLES.find((e) => e.id === id)
    if (!ex) return
    setCode(ex.code)
    setActiveExample(id)
    setResult(null)
  }, [])

  const handleNew = useCallback(() => {
    setCode("")
    setActiveExample(null)
    setResult(null)
  }, [])

  const handleLoadFile = useCallback((content: string, name: string) => {
    setCode(content)
    setActiveExample(null)
    setResult(null)
    setFileName(name)
  }, [])

  const handleChange = useCallback((value: string) => {
    setCode(value)
    setActiveExample(null)
  }, [])

  const handleCompile = useCallback(async () => {
    setIsCompiling(true)
    try {
      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceCode: code }),
      })
      const data: CompileResult = await res.json()
      setResult(data)
    } catch (err) {
      setResult({
        success: false,
        tokens: [],
        parseStatus: "Error de conexión",
        parseSuccess: false,
        optimizations: { constantFolding: false, cascada: false, sethiUllman: false, peephole: false },
        optimizationDetails: [],
        assembly: "",
        optimizedAssembly: "",
        ast: null,
        errors: [`No se pudo contactar al compilador: ${(err as Error).message}`],
        scannerStatus: "Scanner no ejecutado",
        scannerSuccess: false,
        stats: { tokenCount: 0, lineCount: code.split("\n").length, functionCount: 0 },
      })
    } finally {
      setIsCompiling(false)
    }
  }, [code])

  const handleDownload = useCallback(() => {
    if (!result) return
    const report = buildReport(code, fileName, result)
    const blob = new Blob([report], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "resultados_compilacion.txt"
    a.click()
    URL.revokeObjectURL(url)
  }, [result, code, fileName])

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <Header
        onNew={handleNew}
        onLoadFile={handleLoadFile}
        onCompile={handleCompile}
        onDownload={handleDownload}
        isCompiling={isCompiling}
        canDownload={!!result}
      />

      <main className="flex min-h-0 flex-1">
        <div className="hidden lg:flex">
          <Sidebar
            activeExample={activeExample}
            onSelectExample={handleSelectExample}
            result={result}
            isCompiling={isCompiling}
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {/* Mobile example selector */}
          <div className="flex shrink-0 gap-2 overflow-x-auto scrollbar-thin border-b border-border p-2 lg:hidden">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => handleSelectExample(ex.id)}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs ${
                  activeExample === ex.id
                    ? "border-primary/40 bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                {ex.title}
              </button>
            ))}
          </div>

          <div className="flex min-h-0 flex-1 flex-col border-border lg:w-1/2 lg:border-r">
            <CodeEditor value={code} onChange={handleChange} className="flex-1" />
          </div>

          <div className="flex min-h-0 flex-1 flex-col lg:w-1/2">
            <ResultsPanel result={result} isCompiling={isCompiling} />
          </div>
        </div>
      </main>
    </div>
  )
}

function buildReport(code: string, fileName: string, result: CompileResult): string {
  const sep = "=".repeat(60)
  const lines: string[] = []
  lines.push(sep)
  lines.push("  PROYECTO 2 COMPILADORES - RESULTADOS DE COMPILACIÓN")
  lines.push(sep)
  lines.push(`Archivo: ${fileName}`)
  lines.push(`Fecha: ${new Date().toLocaleString()}`)
  lines.push(`Estado general: ${result.success ? "ÉXITO" : "CON ERRORES"}`)
  lines.push("")
  lines.push(`Scanner: ${result.scannerStatus}`)
  lines.push(`Parser:  ${result.parseStatus}`)
  lines.push("")

  lines.push(sep)
  lines.push("  CÓDIGO FUENTE")
  lines.push(sep)
  lines.push(code)
  lines.push("")

  lines.push(sep)
  lines.push("  TOKENS")
  lines.push(sep)
  lines.push("#\tTIPO\tLEXEMA\tLÍNEA\tCOLUMNA")
  result.tokens
    .filter((t) => t.category !== "comment")
    .forEach((t, i) => {
      lines.push(`${i + 1}\t${t.type}\t${t.lexeme}\t${t.line}\t${t.column}`)
    })
  lines.push("")

  lines.push(sep)
  lines.push("  OPTIMIZACIONES")
  lines.push(sep)
  result.optimizationDetails.forEach((d) => {
    lines.push(`- ${d.title}: ${d.applied ? "APLICADO" : "NO APLICADO"}`)
    d.notes.forEach((n) => lines.push(`    ${n}`))
  })
  lines.push("")

  lines.push(sep)
  lines.push("  ASSEMBLY GENERADO")
  lines.push(sep)
  lines.push(result.assembly || "(sin assembly)")
  lines.push("")

  lines.push(sep)
  lines.push("  ASSEMBLY OPTIMIZADO")
  lines.push(sep)
  lines.push(result.optimizedAssembly || "(sin assembly)")
  lines.push("")

  lines.push(sep)
  lines.push("  ERRORES")
  lines.push(sep)
  if (result.errors.length === 0) {
    lines.push("Sin errores.")
  } else {
    result.errors.forEach((e) => lines.push(`- ${e}`))
  }

  return lines.join("\n")
}
