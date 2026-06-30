"use client"

import type { AstNode } from "@/lib/compiler/types"
import { cn } from "@/lib/utils"

const KIND_COLOR: Record<string, string> = {
  Program: "var(--primary)",
  Function: "var(--syn-keyword)",
  Struct: "var(--syn-type)",
  Union: "var(--syn-type)",
  Comptime: "var(--syn-builtin)",
  Params: "var(--syn-operator)",
  Body: "var(--syn-operator)",
  Param: "var(--syn-type)",
  Field: "var(--syn-type)",
  VarDecl: "var(--syn-boolean)",
  Print: "var(--syn-builtin)",
  Return: "var(--syn-keyword)",
  If: "var(--syn-keyword)",
  While: "var(--syn-keyword)",
  Switch: "var(--syn-keyword)",
}

function TreeNode({ node, depth = 0 }: { node: AstNode; depth?: number }) {
  const color = KIND_COLOR[node.kind] ?? "var(--muted-foreground)"
  return (
    <li className="relative">
      <div
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-1 hover:bg-card/60",
        )}
      >
        <span
          className="rounded px-1.5 py-0.5 font-mono text-[11px]"
          style={{ color, backgroundColor: "color-mix(in oklch, " + color + " 14%, transparent)" }}
        >
          {node.kind}
        </span>
        <span className="font-mono text-sm text-foreground">{node.label}</span>
      </div>
      {node.children && node.children.length > 0 && (
        <ul className="ml-3 border-l border-border pl-3">
          {node.children.map((c, i) => (
            <TreeNode key={i} node={c} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  )
}

export function AstView({ ast }: { ast: AstNode | null }) {
  if (!ast) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-muted-foreground">
        El AST no está disponible. Compila un programa válido para visualizar el árbol.
      </div>
    )
  }
  return (
    <div className="h-full overflow-auto scrollbar-thin p-4">
      <div className="mb-3 text-xs text-muted-foreground">
        Jerarquía: Programa &gt; Declaraciones &gt; Funciones &gt; Sentencias &gt; Expresiones
      </div>
      <ul>
        <TreeNode node={ast} />
      </ul>
    </div>
  )
}
