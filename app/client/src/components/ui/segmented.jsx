import { snappy } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { useId } from "react"

/**
 * Segmented control with a sliding active pill.
 * options: [{ value, label, icon?, tone? }] where tone is "positive" | "negative".
 */
export function Segmented({ value, onChange, options, className, size = "md", ariaLabel }) {
  const id = useId()

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn("inline-flex items-center gap-0.5 rounded-full border border-border bg-muted/70 p-1", className)}
    >
      {options.map((opt) => {
        const active = opt.value === value
        const Icon = opt.icon
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-medium transition-colors duration-200 active:scale-[0.98]",
              size === "sm" ? "h-7 px-3 text-xs" : "h-9 px-4 text-[13px]",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                transition={snappy}
                className="absolute inset-0 rounded-full border border-border/80 bg-card shadow-[0_1px_2px_hsl(var(--shadow-tint)/0.08)]"
              />
            )}
            {Icon && (
              <Icon
                className={cn(
                  "relative size-4",
                  active && opt.tone === "positive" && "text-positive",
                  active && opt.tone === "negative" && "text-destructive"
                )}
              />
            )}
            <span className="relative">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}
