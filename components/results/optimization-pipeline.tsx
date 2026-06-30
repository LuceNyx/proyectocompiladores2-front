"use client"

import type { OptimizationDetail } from "@/lib/compiler/types"
import { StatusBadge } from "@/components/status-badge"
import { Layers, Cpu, Calculator, Wrench } from "lucide-react"

const ICONS: Record<string, typeof Layers> = {
  constantFolding: Calculator,
  cascada: Layers,
  sethiUllman: Cpu,
  peephole: Wrench,
}

export function OptimizationPipeline({ details }: { details: OptimizationDetail[] }) {
  return (
    <div className="h-full overflow-auto scrollbar-thin p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {details.map((d) => {
          const Icon = ICONS[d.key] ?? Wrench
          return (
            <div
              key={d.key}
              className="flex flex-col gap-2 rounded-lg border border-border bg-card/40 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </span>
                  <h3 className="font-medium text-foreground">{d.title}</h3>
                </div>
                <StatusBadge variant={d.applied ? "success" : "idle"}>
                  {d.applied ? "Aplicado" : "No aplicado"}
                </StatusBadge>
              </div>
              <p className="text-sm text-muted-foreground">{d.description}</p>
              <ul className="mt-1 flex flex-col gap-1 border-t border-border/60 pt-2 font-mono text-xs text-muted-foreground">
                {d.notes.map((n, i) => (
                  <li key={i} className="flex gap-1.5">
                    <span className="text-primary">›</span>
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
