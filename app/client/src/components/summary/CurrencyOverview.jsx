"use client"
import { Card, Eyebrow } from "@/components/ui/card"
import { formatMoney } from "@/components/ui/financial-value"
import { Skeleton } from "@/components/ui/skeleton"
import { BANK_FORMATS, BANK_LABELS, banksForCurrency } from "@/lib/banks"
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

// Order = how often each currency is imported; the first tile is featured
const FIRST_IMPORT_TILES = ["USD", "ARS", "AUD", "GBP"]

const STEPS = [
  { title: "Pick the currency", body: "Each currency keeps its own ledger and totals." },
  { title: "Drop your bank's export", body: "The file exactly as your bank produces it." },
  { title: "Review where it went", body: "Lines are categorized and duplicates skipped." },
]

function FirstImport({ onPick }) {
  return (
    <div className="flex flex-col gap-4 lg:min-h-[calc(100dvh-14rem)]">
      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.5fr)]">
        {/* Copy + how it works */}
        <div className="flex flex-col justify-between gap-10 py-2 lg:pr-6">
          <div className="flex flex-col gap-4">
            <Eyebrow>Getting started</Eyebrow>
            <h2 className="max-w-[18ch] text-3xl font-semibold leading-[1.05] tracking-tighter md:text-[2.5rem]">
              Nothing here yet for this period.
            </h2>
            <p className="max-w-[46ch] text-[15px] leading-relaxed text-muted-foreground">
              Import your first bank statement to see balances, spending by category and every movement
              for the month.
            </p>
          </div>
          <ol className="hidden flex-col divide-y divide-border/70 border-y border-border/70 lg:flex">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-4 py-4">
                <span className="font-mono figure pt-0.5 text-[11px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{step.title}</span>
                  <span className="text-[13px] text-muted-foreground">{step.body}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* Currency tiles fill the remaining height */}
        <motion.div
          variants={listParent}
          initial="hidden"
          animate="show"
          className="grid auto-rows-[minmax(10rem,1fr)] grid-cols-2 gap-3 md:grid-cols-3 md:grid-rows-2"
        >
          {FIRST_IMPORT_TILES.map((code, i) => {
            const featured = i === 0
            const banks = banksForCurrency(code)
            return (
              <motion.button
                key={code}
                variants={listItem}
                onClick={() => onPick(code)}
                className={cn(
                  "group relative flex flex-col justify-between gap-6 overflow-hidden rounded-[1.75rem] border p-5 text-left transition-[border-color,transform] duration-300 active:scale-[0.98] md:p-7",
                  featured
                    ? "col-span-2 border-accent/25 bg-accent-soft hover:border-accent/50 md:col-span-1 md:row-span-2"
                    : "border-border/70 bg-card shadow-[var(--shadow-diffuse)] hover:border-foreground/25",
                  i === 1 && "col-span-2"
                )}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className={cn("figure font-medium leading-none tracking-tighter", featured ? "text-6xl text-accent md:text-8xl" : "text-4xl md:text-5xl")}>
                    {getCurrencySymbol(code)}
                  </span>
                  <span
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-transform duration-300 group-hover:-translate-y-0.5",
                      featured ? "border-accent/30 text-accent" : "border-border text-muted-foreground group-hover:text-foreground"
                    )}
                  >
                    <UploadSimpleIcon className="size-3.5" />
                    Import
                  </span>
                </span>
                <span className="flex flex-col gap-1">
                  <span className="flex items-baseline gap-2">
                    <span className="text-lg font-semibold tracking-tight">{code}</span>
                    <span className={cn("text-[13px] text-muted-foreground", !featured && i !== 1 && "hidden sm:inline")}>{getCurrencyName(code)}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{banks.map((k) => BANK_LABELS[k]).join(", ")}</span>
                </span>
              </motion.button>
            )
          })}
        </motion.div>
      </div>

      {/* Supported banks strip */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-border/70 px-6 py-3.5 md:px-8">
          <Eyebrow>Supported banks</Eyebrow>
          <span className="hidden text-xs text-muted-foreground sm:inline">Original export files, no bank login</span>
        </div>
        <ul className="grid grid-cols-2 divide-border/70 sm:grid-cols-3 lg:grid-cols-6 lg:divide-x [&>li]:border-border/70 max-lg:[&>li]:border-b">
          {Object.entries(BANK_FORMATS).map(([key, bank]) => (
            <li key={key} className="px-5 py-4 md:px-6">
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="truncate text-[13px] font-medium">{BANK_LABELS[key]}</span>
                <span className="font-mono figure mt-1 text-[11px] text-muted-foreground">
                  {bank.format.replace(".", "").toUpperCase()} · {bank.supportedCurrencies.join(" ")}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
