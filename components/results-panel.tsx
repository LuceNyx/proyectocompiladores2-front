"use client"

import type { CompileResult } from "@/lib/compiler/types"
import { cn } from "@/lib/utils"
import { AstView } from "@/components/results/ast-view"
import { AssemblyViewer } from "@/components/results/assembly-viewer"
import { ErrorPanel } from "@/components/results/error-panel"
import { OptimizationPipeline } from "@/components/results/optimization-pipeline"
import { ParseStatus } from "@/components/results/parse-status"
import { TokensTable } from "@/components/results/tokens-table"
import { Binary, GitBranch, ListTree, Loader2, Sparkles, Table2, TriangleAlert } from "lucide-react"
import { useState } from "react"

type TabId = "tokens" | "parse" | "ast" | "optimizations" | "assembly" | "errors"

const TABS: { id: TabId; label: string; icon: typeof Table2 }[] = [
  { id: "tokens", label: "Tokens", icon: Table2 },
  { id: "parse", label: "Parseo", icon: GitBranch },
  { id: "ast", label: "AST", icon: ListTree },
  { id: "optimizations", label: "Optimizaciones", icon: Sparkles },
  { id: "assembly", label: "Assembly", icon: Binary },
  { id: "errors", label: "Errores", icon: TriangleAlert },
]

export function ResultsPanel({
  result,
  isCompiling,
}: {
  result: CompileResult | null
  isCompiling: boolean
}) {
  const [tab, setTab] = useState<TabId>("tokens")
  const errorCount = result?.errors.length ?? 0

  return (
    <section className="flex h-full flex-col bg-card">
      {/* Tab bar */}
      <div className="flex shrink-0 items-center gap-0.5 overflow-x-auto scrollbar-thin border-b border-border px-2">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = tab === t.id
          const isErrTab = t.id === "errors"
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "relative flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {t.label}
              {isErrTab && errorCount > 0 && (
                <span className="ml-0.5 rounded-full bg-destructive/20 px-1.5 text-[10px] font-semibold text-destructive">
                  {errorCount}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="relative min-h-0 flex-1">
        {isCompiling ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="size-7 animate-spin text-primary" />
            <span className="text-sm">Compilando...</span>
          </div>
        ) : !result ? (
          <EmptyState />
        ) : (
          <div className="h-full">
            {tab === "tokens" && (
              <TokensTable
                tokens={result.tokens}
                scannerSuccess={result.scannerSuccess}
                scannerStatus={result.scannerStatus}
              />
            )}
            {tab === "parse" && <ParseStatus result={result} />}
            {tab === "ast" && <AstView ast={result.ast} />}
            {tab === "optimizations" && (
              <OptimizationPipeline details={result.optimizationDetails} />
            )}
            {tab === "assembly" && (
              <AssemblyViewer
                assembly={result.assembly}
                optimizedAssembly={result.optimizedAssembly}
              />
            )}
            {tab === "errors" && <ErrorPanel errors={result.errors} />}
          </div>
        )}
      </div>
    </section>
  )
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Sparkles className="size-6" />
      </div>
      <h3 className="text-base font-medium text-foreground">Listo para compilar</h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        Escribe o carga código fuente y presiona <span className="font-medium text-foreground">Compilar</span> para
        ver tokens, AST, optimizaciones y el assembly generado.
      </p>
    </div>
  )
}
