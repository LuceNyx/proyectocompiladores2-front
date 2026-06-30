"use client"

import { Button } from "@/components/ui/button"
import { highlightSource } from "@/components/highlight"
import { cn } from "@/lib/utils"
import { Check, Copy, Eraser } from "lucide-react"
import { useLayoutEffect, useRef, useState } from "react"

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function CodeEditor({ value, onChange, className }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const preRef = useRef<HTMLPreElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  const lines = value.split("\n")
  const lineCount = lines.length

  // Keep the highlight layer and gutter in sync with the textarea scroll.
  const syncScroll = () => {
    const ta = textareaRef.current
    if (!ta) return
    if (preRef.current) {
      preRef.current.scrollTop = ta.scrollTop
      preRef.current.scrollLeft = ta.scrollLeft
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = ta.scrollTop
    }
  }

  useLayoutEffect(() => {
    syncScroll()
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Insert two spaces on Tab instead of moving focus.
    if (e.key === "Tab") {
      e.preventDefault()
      const ta = e.currentTarget
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const newValue = value.slice(0, start) + "  " + value.slice(end)
      onChange(newValue)
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2
      })
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className={cn("relative flex h-full flex-col overflow-hidden bg-card", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="font-mono text-xs text-muted-foreground">input.zig</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="xs" onClick={copy} aria-label="Copiar código">
            {copied ? <Check className="text-success" /> : <Copy />}
            {copied ? "Copiado" : "Copiar"}
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onChange("")}
            aria-label="Limpiar editor"
          >
            <Eraser />
            Limpiar
          </Button>
        </div>
      </div>

      {/* Editor body */}
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 flex font-mono text-sm leading-6">
          {/* Gutter */}
          <div
            ref={gutterRef}
            aria-hidden
            className="shrink-0 overflow-hidden select-none border-r border-border bg-card py-3 text-right text-muted-foreground/60"
            style={{ width: "3.25rem" }}
          >
            <div className="px-2">
              {lines.map((_, idx) => (
                <div key={idx}>{idx + 1}</div>
              ))}
            </div>
          </div>

          {/* Code area */}
          <div className="relative flex-1 overflow-hidden">
            <pre
              ref={preRef}
              aria-hidden
              className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre px-3 py-3 text-foreground"
            >
              {highlightSource(value)}
              {"\n"}
            </pre>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onScroll={syncScroll}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              wrap="off"
              className="absolute inset-0 resize-none overflow-auto whitespace-pre bg-transparent px-3 py-3 text-transparent caret-primary outline-none scrollbar-thin selection:bg-primary/30"
              aria-label="Editor de código fuente"
              placeholder="Escribe tu código aquí..."
            />
          </div>
        </div>
      </div>

      {/* Status line */}
      <div className="flex items-center justify-between border-t border-border px-3 py-1 font-mono text-[11px] text-muted-foreground">
        <span>Lenguaje: Zig-like</span>
        <span>
          {lineCount} líneas · {value.length} caracteres
        </span>
      </div>
    </div>
  )
}
