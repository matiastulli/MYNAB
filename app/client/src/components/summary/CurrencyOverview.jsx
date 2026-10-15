"use client"
import { Card, Eyebrow } from "@/components/ui/card"
import { formatMoney } from "@/components/ui/financial-value"
import { Skeleton } from "@/components/ui/skeleton"
import { getCurrencyName, getCurrencySymbol } from "@/lib/currencyUtils"
import { listItem, listParent, spring } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { ArrowRightIcon, UploadSimpleIcon } from "@phosphor-icons/react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"

export default function CurrencyOverview({
  currencySummary,
  isLoading,
  onCurrencySelect,
  onCurrencyImport,
}) {
  const navigate = useNavigate()

  const handleCurrencyImport = (currencyCode) => {
    if (onCurrencyImport) {
      onCurrencyImport(currencyCode)
    } else {
      navigate(`/dashboard/import?currency=${currencyCode}`)
    }
  }

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <div className="hidden border-b border-border/70 px-8 py-4 md:block">
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="divide-y divide-border/70">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-6 md:px-8">
              <Skeleton className="size-11 rounded-2xl" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="hidden h-1.5 w-40 rounded-full md:block" />
              <Skeleton className="h-6 w-28" />
            </div>
          ))}
        </div>
      </Card>
    )
  }

  const currencies = currencySummary?.currencies || []

  if (currencies.length === 0) {
    return <FirstImport onPick={handleCurrencyImport} />
  }

  return (
    <Card className="overflow-hidden">
      <div className="hidden grid-cols-[minmax(0,1.3fr)_minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,1fr)_2rem] gap-6 border-b border-border/70 px-8 py-4 md:grid">
        <Eyebrow>Currency</Eyebrow>
        <Eyebrow>Flow</Eyebrow>
        <Eyebrow className="text-right">In</Eyebrow>
        <Eyebrow className="text-right">Out</Eyebrow>
        <Eyebrow className="text-right">Net</Eyebrow>
        <span />
      </div>

      <motion.ul variants={listParent} initial="hidden" animate="show" className="divide-y divide-border/70">
        {currencies.map((currencyData) => {
          const balance = currencyData.income - currencyData.outcome
          const isPositive = balance >= 0
          const flow = currencyData.income + currencyData.outcome
          const incomeShare = flow > 0 ? (currencyData.income / flow) * 100 : 50
          const symbol = getCurrencySymbol(currencyData.currency)

          return (
            <motion.li key={currencyData.currency} variants={listItem}>
              <button
                onClick={() => onCurrencySelect(currencyData.currency)}
                className="group grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-4 px-6 py-6 text-left transition-colors duration-200 hover:bg-muted/50 active:bg-muted md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,1fr)_2rem] md:gap-6 md:px-8"
              >
                <span className="flex items-center gap-3.5">
                  <span className="figure grid size-11 shrink-0 place-items-center rounded-2xl bg-foreground text-sm font-semibold text-background">
                    {symbol}
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="text-[15px] font-semibold tracking-tight">{currencyData.currency}</span>
                    <span className="text-[13px] text-muted-foreground">{getCurrencyName(currencyData.currency)}</span>
                  </span>
                </span>

                {/* Net (mobile position) */}
                <span className={cn("figure text-right text-lg font-medium md:hidden", isPositive ? "text-foreground" : "text-destructive")}>
                  {isPositive ? "+" : "−"}{symbol}{formatMoney(balance)}
                </span>

                <span className="col-span-2 flex flex-col gap-1.5 md:col-span-1">
                  <span className="flex h-1.5 w-full gap-[2px] overflow-hidden rounded-full">
                    <motion.span
                      className="h-full rounded-full bg-accent"
                      initial={{ width: 0 }}
                      animate={{ width: `${incomeShare}%` }}
                      transition={spring}
                    />
                    <span className="h-full flex-1 rounded-full bg-foreground/15" />
                  </span>
                  <span className="flex justify-between text-[11px] text-muted-foreground md:hidden">
                    <span className="figure">In {symbol}{formatMoney(currencyData.income)}</span>
                    <span className="figure">Out {symbol}{formatMoney(currencyData.outcome)}</span>
                  </span>
                </span>

                <span className="figure hidden text-right text-sm text-muted-foreground md:block">{symbol}{formatMoney(currencyData.income)}</span>
                <span className="figure hidden text-right text-sm text-muted-foreground md:block">{symbol}{formatMoney(currencyData.outcome)}</span>
                <span className={cn("figure hidden text-right text-base font-medium md:block", isPositive ? "text-foreground" : "text-destructive")}>
                  {isPositive ? "+" : "−"}{symbol}{formatMoney(balance)}
                </span>
                <span className="hidden size-8 place-items-center rounded-full border border-border text-muted-foreground transition-all duration-300 group-hover:translate-x-0.5 group-hover:border-foreground/30 group-hover:text-foreground md:grid">
                  <ArrowRightIcon className="size-3.5" />
                </span>
              </button>
            </motion.li>
          )
        })}
      </motion.ul>
    </Card>
  )
}

const FIRST_IMPORT_TILES = [
  { code: "USD", className: "md:row-span-2", hint: "Revolut, Santander, ICBC" },
  { code: "ARS", className: "md:col-span-2", hint: "Santander, ICBC, Mercado Pago, BBVA" },
  { code: "AUD", className: "", hint: "CommBank, Revolut" },
  { code: "GBP", className: "", hint: "Revolut" },
]

function FirstImport({ onPick }) {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] lg:gap-12">
      <div className="flex flex-col justify-center gap-4">
        <Eyebrow>Getting started</Eyebrow>
        <h2 className="text-3xl font-semibold leading-[1.05] tracking-tighter md:text-4xl">
          Nothing here yet for this period.
        </h2>
        <p className="max-w-[46ch] text-[15px] leading-relaxed text-muted-foreground">
          Pick the currency of your first bank statement. MYNAB reads the file, sorts every line into a
          category and skips duplicates if you import the same month twice.
        </p>
      </div>

      <motion.div
        variants={listParent}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3 md:grid-cols-3 md:grid-rows-2"
      >
        {FIRST_IMPORT_TILES.map(({ code, className, hint }, i) => (
          <motion.button
            key={code}
            variants={listItem}
            onClick={() => onPick(code)}
            className={cn(
              "group flex min-h-36 flex-col justify-between gap-6 rounded-[1.75rem] border border-border/70 bg-card p-5 text-left shadow-[var(--shadow-diffuse)] transition-[border-color,transform] duration-300 hover:border-foreground/25 active:scale-[0.98] md:p-6",
              i === 0 && "col-span-2 bg-foreground text-background md:col-span-1",
              className
            )}
          >
            <span className="flex items-start justify-between">
              <span className={cn("figure text-4xl font-medium tracking-tighter", i === 0 ? "md:text-6xl" : "")}>
                {getCurrencySymbol(code)}
              </span>
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-full border transition-transform duration-300 group-hover:-translate-y-0.5",
                  i === 0 ? "border-background/20" : "border-border text-muted-foreground"
                )}
              >
                <UploadSimpleIcon className="size-3.5" />
              </span>
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-[15px] font-semibold tracking-tight">{code}</span>
              <span className={cn("text-xs", i === 0 ? "text-background/60" : "text-muted-foreground")}>{hint}</span>
            </span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  )
}
