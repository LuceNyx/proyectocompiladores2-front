"use client"

import { Button } from "@/components/ui/button"
import { highlightAssembly } from "@/components/highlight"
import { cn } from "@/lib/utils"
import { Check, Copy, Download } from "lucide-react"
import { useState } from "react"

export function AssemblyViewer({
  assembly,
  optimizedAssembly,
}: {
  assembly: string
  optimizedAssembly: string
}) {
  const [view, setView] = useState<"generated" | "optimized">("optimized")
  const [copied, setCopied] = useState(false)

  const generated = assembly || optimizedAssembly
  const optimized = optimizedAssembly || assembly
  const current = view === "optimized" ? optimized : generated

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
    a.download = view === "optimized" ? "output.opt.s" : "output.s"
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
          <TabBtn active={view === "generated"} onClick={() => setView("generated")}>
            Generado
          </TabBtn>
          <TabBtn active={view === "optimized"} onClick={() => setView("optimized")}>
            Optimizado
          </TabBtn>
        </div>
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
        <pre className="px-4 py-3 font-mono text-[13px] leading-6 text-foreground">
          {highlightAssembly(current)}
        </pre>
      </div>
    </div>
  )
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded px-3 py-1 text-xs font-medium transition-colors",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}
