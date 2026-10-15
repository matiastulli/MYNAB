import { Card, CardContent, CardHeader, CardTitle, Eyebrow } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { formatMoney } from "@/components/ui/financial-value"
import { Skeleton } from "@/components/ui/skeleton"
import { getCurrencySymbol } from "@/lib/currencyUtils"
import { listItem, listParent, spring } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { ChartPieSliceIcon, ReceiptIcon, TagIcon } from "@phosphor-icons/react"
import { motion } from "framer-motion"
import { useState } from "react"

// Part-to-whole with few parts reads best as a ranked bar list in one hue
// (exact comparisons, direct labels, no legend needed).
function rankCategories(list = [], top = 5) {
  const sorted = [...list].sort((a, b) => b.amount - a.amount)
  const rows = sorted.slice(0, top).map((c) => ({ name: c.name, value: c.amount }))
  const othersTotal = sorted.slice(top).reduce((sum, c) => sum + c.amount, 0)
  if (othersTotal > 0) rows.push({ name: "Others", value: othersTotal, isOther: true })
  return rows
}

export default function Dashboard({
  summary = { income: 0, outcome: 0, categories: { income: [], outcome: [] } },
  totalTransactions = 0,
  currency = "ARS",
  isLoading = false,
}) {
  const categoriesData = summary.categories || { income: [], outcome: [] }
  const spendingData = rankCategories(categoriesData.outcome)
  const incomeData = rankCategories(categoriesData.income, 3)
  const topExpenseCategory = spendingData.find((c) => !c.isOther) || null
  const symbol = getCurrencySymbol(currency)
  const spendTotal = spendingData.reduce((s, c) => s + c.value, 0)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
      {/* Spending breakdown */}
      <Card className="lg:row-span-3">
        <CardHeader className="flex-row items-end justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <Eyebrow>Spending</Eyebrow>
            <CardTitle className="text-xl">Where the money went</CardTitle>
          </div>
          {!isLoading && spendingData.length > 0 && (
            <div className="text-right">
              <p className="figure text-2xl font-medium leading-none tracking-[-0.04em]">
                <span className="text-[0.6em] text-muted-foreground">{symbol}</span>
                {formatMoney(summary.outcome, { decimals: 0 })}
              </p>
              <p className="mt-1.5 text-[11px] text-muted-foreground">total out</p>
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-8">
          {isLoading ? (
            <div className="flex flex-col gap-6">
              {[78, 54, 41, 26, 15].map((w, i) => (
                <div key={i} className="flex flex-col gap-2.5">
                  <div className="flex justify-between">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3.5 w-16" />
                  </div>
                  <Skeleton className="h-2 rounded-full" style={{ width: `${w}%` }} />
                </div>
              ))}
            </div>
          ) : spendingData.length > 0 ? (
            <SpendingBars rows={spendingData} total={spendTotal} symbol={symbol} />
          ) : (
            <EmptyState icon={ChartPieSliceIcon} title="No spending in this period" className="px-0 md:px-0">
              Import a statement or add an expense and the breakdown by category appears here.
            </EmptyState>
          )}
        </CardContent>
      </Card>

      {/* Top category */}
      <StatTile
        eyebrow="Biggest category"
        icon={TagIcon}
        isLoading={isLoading}
        value={topExpenseCategory ? topExpenseCategory.name : "None yet"}
        detail={
          topExpenseCategory
            ? `${symbol}${formatMoney(topExpenseCategory.value, { decimals: 0 })} · ${spendTotal > 0 ? ((topExpenseCategory.value / spendTotal) * 100).toFixed(1) : 0}% of spending`
            : "Categories show up once you have expenses"
        }
      />

      {/* Count */}
      <StatTile
        eyebrow="Transactions"
        icon={ReceiptIcon}
        isLoading={isLoading}
        value={<span className="figure">{totalTransactions.toLocaleString("en-US")}</span>}
        detail="Recorded in this period"
      />

      {/* Income sources */}
      <Card className="p-6 md:p-7">
        <Eyebrow>Income sources</Eyebrow>
        {isLoading ? (
          <div className="mt-5 flex flex-col gap-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ) : incomeData.length > 0 ? (
          <ul className="mt-4 divide-y divide-border/70">
            {incomeData.map((row) => (
              <li key={row.name} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="truncate">{row.name}</span>
                <span className="figure text-positive">+{symbol}{formatMoney(row.value, { decimals: 0 })}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No income recorded in this period.</p>
        )}
      </Card>
    </div>
  )
}

function SpendingBars({ rows, total, symbol }) {
  const [hovered, setHovered] = useState(null)
  const max = rows.reduce((m, r) => Math.max(m, r.value), 0) || 1

  return (
    <motion.ol variants={listParent} initial="hidden" animate="show" className="flex flex-col gap-1" onMouseLeave={() => setHovered(null)}>
      {rows.map((row, i) => {
        const share = total > 0 ? (row.value / total) * 100 : 0
        const dimmed = hovered !== null && hovered !== i
        return (
          <motion.li
            key={row.name}
            variants={listItem}
            onMouseEnter={() => setHovered(i)}
            className={cn("flex flex-col gap-2.5 rounded-2xl px-3 py-3 transition-opacity duration-300 -mx-3", dimmed && "opacity-45", hovered === i && "bg-muted/60")}
          >
            <div className="flex items-baseline justify-between gap-4 text-sm">
              <span className="flex min-w-0 items-baseline gap-2.5">
                <span className="font-mono figure w-5 shrink-0 text-[11px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                <span className={cn("truncate font-medium", row.isOther && "text-muted-foreground")}>{row.name}</span>
              </span>
              <span className="flex shrink-0 items-baseline gap-3">
                <span className="font-mono figure text-[11px] text-muted-foreground">{share.toFixed(1)}%</span>
                <span className="figure font-medium">{symbol}{formatMoney(row.value, { decimals: 0 })}</span>
              </span>
            </div>
            <div className="ml-[1.875rem] h-2 overflow-hidden rounded-full bg-muted">
              <motion.div
                className={cn("h-full rounded-full", row.isOther ? "bg-foreground/30" : "bg-foreground/85")}
                initial={{ width: 0 }}
                animate={{ width: `${(row.value / max) * 100}%` }}
                transition={{ ...spring, delay: i * 0.05 }}
              />
            </div>
          </motion.li>
        )
      })}
    </motion.ol>
  )
}

function StatTile({ eyebrow, icon: Icon, value, detail, isLoading }) {
  return (
    <Card className="flex items-start justify-between gap-4 p-6 md:p-7">
      <div className="flex min-w-0 flex-col gap-3">
        <Eyebrow>{eyebrow}</Eyebrow>
        {isLoading ? (
          <>
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-3 w-44" />
          </>
        ) : (
          <>
            <p className="truncate text-2xl font-semibold leading-none tracking-tight">{value}</p>
            <p className="text-[13px] text-muted-foreground">{detail}</p>
          </>
        )}
      </div>
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="size-[18px]" />
      </span>
    </Card>
  )
}
