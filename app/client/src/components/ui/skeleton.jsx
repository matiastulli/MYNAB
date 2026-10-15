import { cn } from "@/lib/utils"

// Placeholder block with a light sweeping across it. Size it like the content it replaces.
export function Skeleton({ className, ...props }) {
  return (
    <div
      aria-hidden="true"
      className={cn("relative overflow-hidden rounded-lg bg-muted", className)}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-foreground/[0.05] to-transparent" />
    </div>
  )
}
