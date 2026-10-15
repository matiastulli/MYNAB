import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { memo } from "react"

// Breathing indicator. Isolated + memoized so the loop never re-renders its parent.
export const StatusDot = memo(function StatusDot({ busy = false, className }) {
  return (
    <span className={cn("relative inline-flex size-2", className)} aria-hidden="true">
      <motion.span
        className={cn("absolute inset-0 rounded-full", busy ? "bg-warning" : "bg-accent")}
        animate={{ scale: [1, 2.4], opacity: [0.45, 0] }}
        transition={{ duration: busy ? 1.1 : 2.4, repeat: Infinity, ease: "easeOut" }}
      />
      <span className={cn("relative size-2 rounded-full", busy ? "bg-warning" : "bg-accent")} />
    </span>
  )
})
