"use client"

import type { CompileResult } from "@/lib/compiler-types"
import { StatusBadge } from "@/components/status-badge"
import { CheckCircle2, XCircle } from "lucide-react"

export function ParseStatus({ result }: { result: CompileResult }) {
  const ok = result.parseSuccess
  return (
    <div className="flex h-full flex-col gap-4 overflow-auto scrollbar-thin p-4">
      <div
        className={`flex items-start gap-3 rounded-lg border p-4 ${
          ok ? "border-success/30 bg-success/10" : "border-destructive/30 bg-destructive/10"
        }`}
      >
        {ok ? (
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
        ) : (
          <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
        )}
        <div>
          <div className={`font-semibold ${ok ? "text-success" : "text-destructive"}`}>
            {result.parseStatus}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {ok
              ? "El árbol de sintaxis abstracta (AST) se construyó correctamente."
              : "El parser encontró un problema al construir el AST."}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Tokens" value={result.stats.tokenCount} />
        <Stat label="Líneas" value={result.stats.lineCount} />
        <Stat label="Funciones" value={result.stats.functionCount} />
      </dl>

      <div className="rounded-lg border border-border bg-card/40 p-3">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Detalle del scanner
        </h3>
        <StatusBadge variant={result.scannerSuccess ? "success" : "error"}>
          {result.scannerStatus}
        </StatusBadge>
      </div>

      {result.errors.length > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-destructive">
            Mensajes del parser
          </h3>
          <ul className="flex flex-col gap-1.5 font-mono text-sm text-destructive">
            {result.errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card/40 p-3">
      <div className="text-2xl font-semibold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
