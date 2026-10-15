import { AnimatedNumber } from "@/components/ui/animated-number"
import { snappy, spring } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { CheckIcon, FileXlsIcon, LightningIcon } from "@phosphor-icons/react"
import { AnimatePresence, motion } from "framer-motion"
import { memo, useEffect, useState } from "react"

// Illustrative product preview for the landing page. Every loop lives in its own
// memoized leaf so the page layout never re-renders while they run.

const CATEGORY_SEED = [
  { id: "rent", name: "Rent", amount: 412000 },
  { id: "groceries", name: "Groceries", amount: 184320.5 },
  { id: "dining", name: "Dining out", amount: 67240.1 },
  { id: "transport", name: "Transport", amount: 38915.75 },
  { id: "subs", name: "Subscriptions", amount: 21870 },
]

const fmt = (n) => n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })

// 1. Auto-sorting category list (layout animation re-orders the rows)
const SortingCategories = memo(function SortingCategories() {
  const [rows, setRows] = useState(CATEGORY_SEED)

  useEffect(() => {
    const drift = [0.94, 1.18, 1.31, 0.88, 1.07, 1.42, 0.79]
    let tick = 0
    const id = setInterval(() => {
      tick++
      setRows((prev) =>
        prev
          .map((r, i) => (r.id === "rent" ? r : { ...r, amount: Math.round(r.amount * drift[(tick + i) % drift.length]) }))
          .map((r) => ({ ...r, amount: Math.min(Math.max(r.amount, 14000), 390000) }))
          .sort((a, b) => b.amount - a.amount)
      )
    }, 2800)
    return () => clearInterval(id)
  }, [])

  const max = rows[0]?.amount || 1

  return (
    <ul className="flex flex-col gap-1">
      {rows.map((row, i) => (
        <motion.li key={row.id} layout transition={spring} className="flex flex-col gap-1.5 rounded-xl px-1 py-1.5">
          <div className="flex items-baseline justify-between gap-3 text-[13px]">
            <span className="flex items-baseline gap-2">
              <span className="font-mono figure w-4 text-[10px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
              <span className="font-medium">{row.name}</span>
            </span>
            <span className="figure text-muted-foreground">${fmt(row.amount)}</span>
          </div>
          <div className="ml-6 h-1.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              className={cn("h-full rounded-full", i === 0 ? "bg-foreground" : "bg-foreground/55")}
              animate={{ width: `${(row.amount / max) * 100}%` }}
              transition={spring}
            />
          </div>
        </motion.li>
      ))}
    </ul>
  )
})

// 2. Import status with a typewriter filename and a shimmering processing state
const IMPORTS = [
  { file: "santander_rio_oct.xlsx", lines: 142, skipped: 3 },
  { file: "mercado_pago_sept.pdf", lines: 87, skipped: 0 },
  { file: "revolut_2026_q3.csv", lines: 211, skipped: 12 },
]

const ImportTicker = memo(function ImportTicker() {
  const [idx, setIdx] = useState(0)
  const [typed, setTyped] = useState(0)
  const [phase, setPhase] = useState("typing") // typing -> processing -> done
  const current = IMPORTS[idx]

  useEffect(() => {
    let t
    if (phase === "typing") {
      if (typed < current.file.length) t = setTimeout(() => setTyped((n) => n + 1), 45)
      else t = setTimeout(() => setPhase("processing"), 350)
    } else if (phase === "processing") {
      t = setTimeout(() => setPhase("done"), 1500)
    } else {
      t = setTimeout(() => {
        setIdx((i) => (i + 1) % IMPORTS.length)
        setTyped(0)
        setPhase("typing")
      }, 2200)
    }
    return () => clearTimeout(t)
  }, [phase, typed, current.file.length])

  return (
    <div className="flex items-center gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-background text-muted-foreground">
        <FileXlsIcon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-mono figure truncate text-[12px] text-foreground">
          {current.file.slice(0, typed)}
          {phase === "typing" && <span className="ml-px inline-block h-3 w-[1.5px] translate-y-0.5 animate-pulse bg-foreground" />}
        </p>
        <div className="relative mt-1 h-4 overflow-hidden text-[11px] text-muted-foreground">
          <AnimatePresence mode="wait" initial={false}>
            {phase === "processing" ? (
              <motion.span key="p" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={snappy} className="relative block w-fit overflow-hidden">
                Reading and categorizing
                <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-card/90 to-transparent" />
              </motion.span>
            ) : phase === "done" ? (
              <motion.span key="d" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={snappy} className="block">
                <span className="figure text-foreground">{current.lines}</span> lines
                {current.skipped > 0 && <> · <span className="figure">{current.skipped}</span> duplicates skipped</>}
              </motion.span>
            ) : (
              <motion.span key="w" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="block">Waiting for file</motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
      <span className={cn("grid size-6 shrink-0 place-items-center rounded-full transition-colors duration-300", phase === "done" ? "bg-accent text-accent-foreground" : "bg-muted text-transparent")}>
        <CheckIcon className="size-3" weight="bold" />
      </span>
    </div>
  )
})

// 3. Notification that pops in with overshoot, holds 3s, then leaves
const MATCHES = [
  { raw: "COTO SUC 104 CABA", cat: "Groceries" },
  { raw: "MERPAGO*PEDIDOSYA", cat: "Dining out" },
  { raw: "SUBE CARGA 0118", cat: "Transport" },
  { raw: "NETFLIX.COM 866-579", cat: "Subscriptions" },
]

const MatchToast = memo(function MatchToast() {
  const [i, setI] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let hide
    const show = () => {
      setVisible(true)
      hide = setTimeout(() => setVisible(false), 3000)
    }
    const first = setTimeout(show, 1200)
    const loop = setInterval(() => {
      setI((n) => (n + 1) % MATCHES.length)
      show()
    }, 4800)
    return () => {
      clearTimeout(first)
      clearTimeout(hide)
      clearInterval(loop)
    }
  }, [])

  const m = MATCHES[i]
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 14, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 320, damping: 16 }}
          className="flex items-center gap-3 rounded-2xl border border-border bg-popover/95 py-2.5 pl-2.5 pr-4 shadow-[var(--shadow-lift)] backdrop-blur-md [box-shadow:var(--shadow-lift),inset_0_1px_0_hsl(0_0%_100%/0.08)]"
        >
          <span className="grid size-8 place-items-center rounded-xl bg-accent-soft text-accent">
            <LightningIcon className="size-4" weight="fill" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-mono figure text-[11px] text-muted-foreground">{m.raw}</span>
            <span className="text-[13px] font-medium">Sorted into {m.cat}</span>
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
})

// 4. Net balance that counts up once
const PreviewBalance = memo(function PreviewBalance() {
  return (
    <p className="figure flex items-baseline gap-1 text-[2.5rem] font-medium leading-none tracking-[-0.05em] md:text-5xl">
      <span className="text-[0.5em] text-muted-foreground">$</span>
      <AnimatedNumber value={1187463.82} />
    </p>
  )
})

export default function LedgerPreview() {
  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-[var(--shadow-lift)]">
        <div className="flex items-center justify-between border-b border-border/70 px-6 py-4">
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">ARS · October 2026</span>
          <span className="flex gap-1.5">
            <span className="size-2 rounded-full bg-border" />
            <span className="size-2 rounded-full bg-border" />
            <span className="size-2 rounded-full bg-border" />
          </span>
        </div>

        <div className="grid grid-cols-1 divide-y divide-border/70 md:grid-cols-[1.15fr_1fr] md:divide-x md:divide-y-0">
          <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Net balance</span>
              <PreviewBalance />
              <div className="flex h-1.5 gap-[2px] overflow-hidden rounded-full">
                <motion.div className="h-full rounded-full bg-accent" initial={{ width: 0 }} animate={{ width: "63%" }} transition={{ ...spring, delay: 0.3 }} />
                <div className="h-full flex-1 rounded-full bg-foreground/15" />
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span className="figure">In $2,911,680</span>
                <span className="figure">Out $1,724,216</span>
              </div>
            </div>
            <div className="border-t border-border/70 pt-5">
              <ImportTicker />
            </div>
          </div>
          <div className="p-6">
            <span className="mb-3 block text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Where it went</span>
            <SortingCategories />
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute -bottom-6 left-4 right-4 flex justify-start md:-left-10 md:right-auto">
        <MatchToast />
      </div>
    </div>
  )
}
