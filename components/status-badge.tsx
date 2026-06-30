import { cn } from "@/lib/utils"
import { AlertTriangle, CheckCircle2, Circle, Loader2, XCircle } from "lucide-react"
import type { ReactNode } from "react"

export type StatusVariant = "success" | "error" | "warning" | "idle" | "loading"

const STYLES: Record<StatusVariant, string> = {
  success: "bg-success/15 text-success border-success/30",
  error: "bg-destructive/15 text-destructive border-destructive/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  idle: "bg-muted text-muted-foreground border-border",
  loading: "bg-accent/15 text-accent border-accent/30",
}

const ICONS: Record<StatusVariant, ReactNode> = {
  success: <CheckCircle2 className="size-3.5" />,
  error: <XCircle className="size-3.5" />,
  warning: <AlertTriangle className="size-3.5" />,
  idle: <Circle className="size-3.5" />,
  loading: <Loader2 className="size-3.5 animate-spin" />,
}

export function StatusBadge({
  variant,
  children,
  className,
  showIcon = true,
}: {
  variant: StatusVariant
  children: ReactNode
  className?: string
  showIcon?: boolean
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STYLES[variant],
        className,
      )}
    >
      {showIcon && ICONS[variant]}
      {children}
    </span>
  )
}
