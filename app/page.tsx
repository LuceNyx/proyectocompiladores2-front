"use client"

import { Button } from "@/components/ui/button"
import { CodeEditor } from "@/components/code-editor"
import { Header } from "@/components/header"
import { ResultsPanel } from "@/components/results-panel"
import { Sidebar } from "@/components/sidebar"
import type { CompileResult } from "@/lib/compiler/types"
import { DEFAULT_EXAMPLE, EXAMPLES } from "@/lib/examples"
import { Binary, Braces, Cpu, FileCode2, GitBranch, Sparkles } from "lucide-react"
import { useCallback, useState } from "react"

export default function Page() {
  const [code, setCode] = useState<string>(DEFAULT_EXAMPLE)
  const [result, setResult] = useState<CompileResult | null>(null)
  const [isCompiling, setIsCompiling] = useState(false)
  const [activeExample, setActiveExample] = useState<string | null>("default")
  const [fileName, setFileName] = useState<string>("input.zig")
  const [view, setView] = useState<"landing" | "ide">("landing")

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

  const openEditor = useCallback(() => setView("ide"), [])
  const openLanding = useCallback(() => setView("landing"), [])

  return (
    <div className="h-dvh overflow-hidden bg-background text-foreground">
      {view === "landing" ? (
        <LandingHero
          result={result}
          onStart={openEditor}
        />
      ) : (
        <div className="flex h-dvh flex-col overflow-hidden">
          <Header
            onHome={openLanding}
            onNew={handleNew}
            onLoadFile={handleLoadFile}
            onCompile={handleCompile}
            onDownload={handleDownload}
            isCompiling={isCompiling}
            canDownload={!!result}
          />

          <main className="flex min-h-0 flex-1 bg-background">
            <div className="hidden lg:flex">
              <Sidebar
                activeExample={activeExample}
                onSelectExample={handleSelectExample}
                result={result}
                isCompiling={isCompiling}
              />
            </div>

            <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
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
      )}
    </div>
  )
}

function LandingHero({
  result,
  onStart,
}: {
  result: CompileResult | null
  onStart: () => void
}) {
  const phaseStats = result
    ? [
        { label: "Tokens", value: String(result.stats.tokenCount) },
        { label: "Funciones", value: String(result.stats.functionCount) },
        { label: "Errores", value: String(result.errors.length) },
      ]
    : [
        { label: "Scanner", value: "Lexemas" },
        { label: "Parser", value: "AST" },
        { label: "Salida", value: "x86-64" },
      ]

  return (
    <main className="relative h-dvh overflow-hidden bg-background">
      <CompilerScene />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <nav className="flex shrink-0 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-primary/15 text-primary">
              <span className="font-mono text-sm font-bold">{"</>"}</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Proyecto 2 Compiladores</div>
              <div className="hidden text-xs text-muted-foreground sm:block">Scanner · Parser · Assembly</div>
            </div>
          </div>
          <Button size="sm" onClick={onStart}>
            Abrir editor
          </Button>
        </nav>

        <div className="grid min-h-0 flex-1 items-center gap-8 py-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-border bg-card/70 px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" />
              Pipeline para lenguaje Zig conectado al backend C++
            </div>
            <h1 className="max-w-2xl text-4xl font-semibold leading-tight text-foreground sm:text-5xl lg:text-6xl">
              Compilador para lenguaje Zig
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Un entorno web para escribir codigo Zig, analizar tokens, construir el AST, aplicar optimizaciones y generar assembly.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Button size="lg" onClick={onStart}>
                Abrir editor
              </Button>
            </div>
          </div>

          <div className="relative min-h-[430px]">
            <div className="absolute left-0 top-8 w-[74%] rounded-lg border border-border bg-card/90 shadow-2xl shadow-black/30">
              <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
                <span className="size-2 rounded-full bg-destructive" />
                <span className="size-2 rounded-full bg-warning" />
                <span className="size-2 rounded-full bg-primary" />
                <span className="ml-2 font-mono text-xs text-muted-foreground">input.zig</span>
              </div>
              <pre className="overflow-hidden px-4 py-3 font-mono text-[12px] leading-6 text-foreground">
                <code>
                  <span className="text-[var(--syn-keyword)]">pub fn</span> main{" "}
                  <span className="text-[var(--syn-operator)]">()</span>{" "}
                  <span className="text-[var(--syn-type)]">void</span> {"{"}
                  {"\n  "}
                  <span className="text-[var(--syn-keyword)]">var</span> n ={" "}
                  <span className="text-[var(--syn-number)]">5</span>;
                  {"\n  "}
                  <span className="text-[var(--syn-builtin)]">print</span>(factorial(n));
                  {"\n"}
                  {"}"}
                </code>
              </pre>
            </div>

            <div className="absolute right-0 top-28 w-[68%] rounded-lg border border-border bg-background/95 shadow-2xl shadow-black/40">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <span className="font-mono text-xs text-muted-foreground">output.opt.s</span>
                <Binary className="size-3.5 text-accent" />
              </div>
              <pre className="overflow-hidden px-4 py-3 font-mono text-[11px] leading-5 text-muted-foreground">
                <code>
                  <span className="text-primary">main:</span>
                  {"\n  pushq %rbp"}
                  {"\n  movq  %rsp, %rbp"}
                  {"\n  call  printf@PLT"}
                  {"\n  xorq  %rax, %rax"}
                  {"\n  ret"}
                </code>
              </pre>
            </div>

            <div className="absolute bottom-4 left-8 grid w-[82%] grid-cols-3 gap-2">
              {phaseStats.map((stat) => (
                <div key={stat.label} className="rounded-lg border border-border bg-card/85 px-3 py-2">
                  <div className="text-xl font-semibold text-foreground">{stat.value}</div>
                  <div className="text-[11px] text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-2 pb-2 sm:grid-cols-2 lg:grid-cols-4">
          <HeroMetric icon={FileCode2} label="Scanner" value={result?.scannerStatus ?? "Listo"} />
          <HeroMetric icon={GitBranch} label="Parser" value={result?.parseStatus ?? "Pendiente"} />
          <HeroMetric icon={Cpu} label="Optimizacion" value={result?.success ? "Aplicada" : "En espera"} />
          <HeroMetric icon={Braces} label="AST" value={result?.ast ? "Disponible" : "Sin generar"} />
        </div>
      </div>
    </main>
  )
}

function CompilerScene() {
  const rows = [
    "TOKEN PUB FN ID LPAREN RPAREN TYPE_VOID",
    "AST Program > FunctionDeclaration > BlockStatement",
    "constantFolding cascada sethiUllman peephole",
    "movq $1, %rax  call printf@PLT  ret",
    "scanner: correcto  parser: correcto",
  ]

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden opacity-35">
      <div className="absolute inset-0">
        {Array.from({ length: 18 }).map((_, index) => (
          <span
            key={`v-${index}`}
            className="absolute top-0 h-full border-l border-border"
            style={{ left: `${index * 6}%` }}
          />
        ))}
        {Array.from({ length: 12 }).map((_, index) => (
          <span
            key={`h-${index}`}
            className="absolute left-0 w-full border-t border-border"
            style={{ top: `${index * 9}%` }}
          />
        ))}
      </div>
      <div className="absolute inset-x-[-10%] top-8 rotate-[-6deg] space-y-5 font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="whitespace-nowrap">
            {rows[index % rows.length]} · {rows[(index + 2) % rows.length]} · {rows[(index + 3) % rows.length]}
          </div>
        ))}
      </div>
    </div>
  )
}

function HeroMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileCode2
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card/75 px-3 py-2">
      <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-foreground">{label}</div>
        <div className="truncate text-xs text-muted-foreground">{value}</div>
      </div>
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
