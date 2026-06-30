"use client"

import { CheckCircle2, XCircle } from "lucide-react"

export function ErrorPanel({ errors }: { errors: string[] }) {
  if (errors.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <CheckCircle2 className="size-10 text-success" />
        <div className="font-medium text-success">Sin errores</div>
        <p className="max-w-sm text-sm text-muted-foreground">
          La compilación se completó sin errores léxicos, sintácticos ni de ejecución.
        </p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto scrollbar-thin p-4">
      <div className="mb-3 text-sm font-medium text-destructive">
        {errors.length} {errors.length === 1 ? "error encontrado" : "errores encontrados"}
      </div>
      <ul className="flex flex-col gap-2">
        {errors.map((e, i) => (
          <li
            key={i}
            className="flex items-start gap-2.5 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5"
          >
            <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <span className="font-mono text-sm text-foreground">{e}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
