"use client"

import { EXAMPLES } from "@/lib/examples"
import type { CompileResult } from "@/lib/compiler/types"
import { cn } from "@/lib/utils"
import { StatusBadge, type StatusVariant } from "@/components/status-badge"
import { Binary, Boxes, Code2, FileCode2, GitBranch, Sparkles } from "lucide-react"

interface SidebarProps {
  activeExample: string | null
  onSelectExample: (id: string) => void
  result: CompileResult | null
  isCompiling: boolean
}

const PHASES = [
  { key: "scanner", label: "Scanner", icon: FileCode2 },
  { key: "parser", label: "Parser", icon: GitBranch },
  { key: "optimizer", label: "Optimización", icon: Sparkles },
  { key: "codegen", label: "Generación", icon: Binary },
] as const

function phaseVariant(
  phase: (typeof PHASES)[number]["key"],
  result: CompileResult | null,
  isCompiling: boolean,
): StatusVariant {
  if (isCompiling) return "loading"
  if (!result) return "idle"
  switch (phase) {
    case "scanner":
      return result.scannerSuccess ? "success" : "error"
    case "parser":
      return !result.scannerSuccess ? "idle" : result.parseSuccess ? "success" : "error"
    case "optimizer":
    case "codegen":
      return result.success ? "success" : !result.parseSuccess ? "idle" : "warning"
  }
}

export function Sidebar({ activeExample, onSelectExample, result, isCompiling }: SidebarProps) {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-sidebar">
      {/* Phases */}
      <div className="border-b border-border p-3">
        <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          <Boxes className="size-3.5" />
          Fases del compilador
        </h2>
        <ul className="flex flex-col gap-1.5">
          {PHASES.map((phase) => {
            const variant = phaseVariant(phase.key, result, isCompiling)
            const Icon = phase.icon
            return (
              <li
                key={phase.key}
                className="flex items-center justify-between rounded-md border border-border/60 bg-card/40 px-2.5 py-1.5"
              >
                <span className="flex items-center gap-2 text-sm">
                  <Icon className="size-4 text-muted-foreground" />
                  {phase.label}
                </span>
                <StatusBadge variant={variant} showIcon>
                  <span className="sr-only">{variant}</span>
                </StatusBadge>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Examples */}
      <div className="flex min-h-0 flex-1 flex-col p-3">
        <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          <Code2 className="size-3.5" />
          Ejemplos
        </h2>
        <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto scrollbar-thin">
          {EXAMPLES.map((ex) => (
            <li key={ex.id}>
              <button
                type="button"
                onClick={() => onSelectExample(ex.id)}
                className={cn(
                  "w-full rounded-md border px-2.5 py-2 text-left transition-colors",
                  activeExample === ex.id
                    ? "border-primary/40 bg-primary/10"
                    : "border-transparent hover:border-border hover:bg-card/60",
                )}
              >
                <div className="text-sm font-medium text-foreground">{ex.title}</div>
                <div className="text-xs text-muted-foreground">{ex.description}</div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
