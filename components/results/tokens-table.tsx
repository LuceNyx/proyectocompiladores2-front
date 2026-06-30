"use client"

import type { Token } from "@/lib/compiler/types"
import { StatusBadge } from "@/components/status-badge"

const CATEGORY_COLOR: Record<string, string> = {
  keyword: "var(--syn-keyword)",
  type: "var(--syn-type)",
  number: "var(--syn-number)",
  string: "var(--syn-string)",
  char: "var(--syn-char)",
  operator: "var(--syn-operator)",
  comment: "var(--syn-comment)",
  builtin: "var(--syn-builtin)",
  boolean: "var(--syn-boolean)",
  null: "var(--syn-boolean)",
  ident: "var(--syn-ident)",
  punct: "var(--muted-foreground)",
  error: "var(--destructive)",
}

export function TokensTable({
  tokens,
  scannerSuccess,
  scannerStatus,
}: {
  tokens: Token[]
  scannerSuccess: boolean
  scannerStatus: string
}) {
  const visible = tokens.filter((t) => t.category !== "comment")

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <StatusBadge variant={scannerSuccess ? "success" : "error"}>{scannerStatus}</StatusBadge>
        <span className="font-mono text-xs text-muted-foreground">
          {visible.length} tokens generados
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto scrollbar-thin">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-card text-xs uppercase text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-4 py-2 text-left font-medium">#</th>
              <th className="px-4 py-2 text-left font-medium">Tipo</th>
              <th className="px-4 py-2 text-left font-medium">Lexema</th>
              <th className="px-4 py-2 text-right font-medium">Línea</th>
              <th className="px-4 py-2 text-right font-medium">Columna</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {visible.map((t, idx) => (
              <tr key={idx} className="border-b border-border/50 hover:bg-card/60">
                <td className="px-4 py-1.5 text-muted-foreground/70">{idx + 1}</td>
                <td className="px-4 py-1.5">
                  <span style={{ color: CATEGORY_COLOR[t.category] ?? "inherit" }}>{t.type}</span>
                </td>
                <td className="px-4 py-1.5 text-foreground">{t.lexeme}</td>
                <td className="px-4 py-1.5 text-right text-muted-foreground">{t.line}</td>
                <td className="px-4 py-1.5 text-right text-muted-foreground">{t.column}</td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No se generaron tokens.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
