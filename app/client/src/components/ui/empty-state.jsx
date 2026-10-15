import { cn } from "@/lib/utils"

// Composed empty state: icon tile, a direct title, and how to populate the view.
export function EmptyState({ icon: Icon, title, children, action, className }) {
  return (
    <div className={cn("flex flex-col items-start gap-5 px-6 py-14 md:flex-row md:items-center md:gap-8 md:px-10", className)}>
      {Icon && (
        <div className="relative grid size-16 shrink-0 place-items-center rounded-2xl border border-border bg-muted/60">
          <div className="absolute inset-2 rounded-xl border border-dashed border-foreground/10" />
          <Icon className="size-6 text-muted-foreground" />
        </div>
      )}
      <div className="flex max-w-[52ch] flex-col gap-1.5">
        <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
        {children && <div className="text-sm leading-relaxed text-muted-foreground">{children}</div>}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  )
}
