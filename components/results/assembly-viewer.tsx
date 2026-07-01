"use client"

import { Button } from "@/components/ui/button"
import { highlightAssembly } from "@/components/highlight"
import { cn } from "@/lib/utils"
import { Check, Copy, Download } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

type AssemblyView = "generated" | "optimized" | "diff"

interface DiffLine {
  type: "same" | "added" | "removed"
  value: string
}

export function AssemblyViewer({
  assembly,
  optimizedAssembly,
}: {
  assembly: string
  optimizedAssembly: string
}) {
  const [view, setView] = useState<AssemblyView>("optimized")
  const [copied, setCopied] = useState(false)

  const generated = assembly
  const optimized = optimizedAssembly
  const diff = useMemo(() => buildLineDiff(generated, optimized), [generated, optimized])
  const diffStats = useMemo(() => summarizeDiff(diff), [diff])
  const hasBothOutputs = Boolean(generated && optimized)
  const hasChanges = diffStats.added > 0 || diffStats.removed > 0
  const current = view === "diff" ? formatDiff(diff, hasBothOutputs) : view === "optimized" ? optimized : generated

  useEffect(() => {
    if (view === "optimized" && !optimized && generated) setView("generated")
    if (view === "generated" && !generated && optimized) setView("optimized")
    if (view === "diff" && !hasBothOutputs) setView(optimized ? "optimized" : "generated")
  }, [generated, hasBothOutputs, optimized, view])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(current)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  const download = () => {
    const blob = new Blob([current], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = view === "diff" ? "output.diff.s" : view === "optimized" ? "output.opt.s" : "output.s"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!generated && !optimized) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-muted-foreground">
        No se generó assembly. Compila un programa válido.
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2">
        <div className="inline-flex rounded-md border border-border bg-card p-0.5">
          <TabBtn active={view === "generated"} disabled={!generated} onClick={() => setView("generated")}>
            Generado
          </TabBtn>
          <TabBtn active={view === "optimized"} disabled={!optimized} onClick={() => setView("optimized")}>
            Optimizado
          </TabBtn>
          <TabBtn active={view === "diff"} disabled={!hasBothOutputs} onClick={() => setView("diff")}>
            Diferencia
          </TabBtn>
        </div>
        {hasBothOutputs && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {hasChanges ? (
              <>
                <span className="rounded border border-success/35 bg-success/10 px-2 py-1 text-success">
                  +{diffStats.added}
                </span>
                <span className="rounded border border-destructive/35 bg-destructive/10 px-2 py-1 text-destructive">
                  -{diffStats.removed}
                </span>
              </>
            ) : (
              <span className="rounded border border-border bg-muted/40 px-2 py-1">Sin cambios</span>
            )}
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="xs" onClick={copy}>
            {copied ? <Check className="text-success" /> : <Copy />}
            {copied ? "Copiado" : "Copiar"}
          </Button>
          <Button variant="outline" size="xs" onClick={download}>
            <Download />
            Descargar .s
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto scrollbar-thin bg-background/40">
        {view === "diff" ? (
          <DiffView diff={diff} hasBothOutputs={hasBothOutputs} hasChanges={hasChanges} />
        ) : (
          <pre className="px-4 py-3 font-mono text-[13px] leading-6 text-foreground">{highlightAssembly(current)}</pre>
        )}
      </div>
    </div>
  )
}

function DiffView({
  diff,
  hasBothOutputs,
  hasChanges,
}: {
  diff: DiffLine[]
  hasBothOutputs: boolean
  hasChanges: boolean
}) {
  if (!hasBothOutputs) {
    return <div className="p-4 text-sm text-muted-foreground">Se necesitan ambos assemblies para comparar.</div>
  }

  if (!hasChanges) {
    return <div className="p-4 text-sm text-muted-foreground">El assembly generado y el optimizado son iguales.</div>
  }

  return (
    <pre className="px-0 py-3 font-mono text-[13px] leading-6 text-foreground">
      {diff.map((line, index) => (
        <div
          key={`${line.type}-${index}`}
          className={cn(
            "grid grid-cols-[3rem_minmax(0,1fr)] px-4",
            line.type === "added" && "bg-success/10 text-success",
            line.type === "removed" && "bg-destructive/10 text-destructive",
          )}
        >
          <span className="select-none text-muted-foreground">
            {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
          </span>
          <span className="min-w-0 whitespace-pre-wrap break-words">{line.value || "\u00A0"}</span>
        </div>
      ))}
    </pre>
  )
}

function TabBtn({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded px-3 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}

function buildLineDiff(before: string, after: string): DiffLine[] {
  const left = before.split("\n")
  const right = after.split("\n")
  const table = Array.from({ length: left.length + 1 }, () => Array<number>(right.length + 1).fill(0))

  for (let i = left.length - 1; i >= 0; i--) {
    for (let j = right.length - 1; j >= 0; j--) {
      table[i][j] = left[i] === right[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1])
    }
  }

  const lines: DiffLine[] = []
  let i = 0
  let j = 0

  while (i < left.length && j < right.length) {
    if (left[i] === right[j]) {
      lines.push({ type: "same", value: left[i] })
      i++
      j++
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      lines.push({ type: "removed", value: left[i] })
      i++
    } else {
      lines.push({ type: "added", value: right[j] })
      j++
    }
  }

  while (i < left.length) lines.push({ type: "removed", value: left[i++] })
  while (j < right.length) lines.push({ type: "added", value: right[j++] })

  return lines
}

function summarizeDiff(diff: DiffLine[]) {
  return diff.reduce(
    (stats, line) => {
      if (line.type === "added") stats.added++
      if (line.type === "removed") stats.removed++
      return stats
    },
    { added: 0, removed: 0 },
  )
}

function formatDiff(diff: DiffLine[], hasBothOutputs: boolean): string {
  if (!hasBothOutputs) return "Se necesitan ambos assemblies para comparar."
  const stats = summarizeDiff(diff)
  if (stats.added === 0 && stats.removed === 0) return "El assembly generado y el optimizado son iguales."

  return diff
    .map((line) => {
      const prefix = line.type === "added" ? "+" : line.type === "removed" ? "-" : " "
      return `${prefix} ${line.value}`
    })
    .join("\n")
}
