import { animate, motion, useMotionValue, useTransform } from "framer-motion"
import { memo, useEffect } from "react"

// Counts toward `value` outside the React render cycle (motion value -> DOM text).
export const AnimatedNumber = memo(function AnimatedNumber({ value = 0, decimals = 2, className }) {
  const mv = useMotionValue(0)
  const text = useTransform(mv, (v) =>
    Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  )

  useEffect(() => {
    const controls = animate(mv, Number(value) || 0, { type: "spring", stiffness: 100, damping: 20, restDelta: 0.01 })
    return () => controls.stop()
  }, [mv, value])

  return <motion.span className={className}>{text}</motion.span>
})
