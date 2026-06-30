"use client"

import { Button } from "@/components/ui/button"
import { Download, FilePlus2, Loader2, Play, Upload } from "lucide-react"
import { useRef } from "react"

interface HeaderProps {
  onNew: () => void
  onLoadFile: (content: string, fileName: string) => void
  onCompile: () => void
  onDownload: () => void
  isCompiling: boolean
  canDownload: boolean
}

export function Header({
  onNew,
  onLoadFile,
  onCompile,
  onDownload,
  isCompiling,
  canDownload,
}: HeaderProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      onLoadFile(String(reader.result ?? ""), file.name)
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-sidebar px-4 py-2.5">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-md bg-primary/15 text-primary">
          <span className="font-mono text-sm font-bold">{"</>"}</span>
        </div>
        <div>
          <h1 className="text-sm font-semibold leading-tight text-foreground sm:text-base">
            Proyecto 2 Compiladores
          </h1>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Scanner, parser, optimización y generación de assembly
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.zig,.src,text/plain"
          className="hidden"
          onChange={handleFile}
        />
        <Button variant="ghost" size="sm" onClick={onNew}>
          <FilePlus2 />
          <span className="hidden sm:inline">Nuevo</span>
        </Button>
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
          <Upload />
          <span className="hidden sm:inline">Cargar archivo</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDownload}
          disabled={!canDownload}
        >
          <Download />
          <span className="hidden sm:inline">Descargar</span>
        </Button>
        <Button size="sm" onClick={onCompile} disabled={isCompiling}>
          {isCompiling ? <Loader2 className="animate-spin" /> : <Play />}
          {isCompiling ? "Compilando..." : "Compilar"}
        </Button>
      </div>
    </header>
  )
}
