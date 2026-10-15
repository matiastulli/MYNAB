import { AnimatedNumber } from "@/components/ui/animated-number";
import { Card, Eyebrow } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardContext } from "@/contexts/DashboardContext";
import { getCurrencySymbol } from "@/lib/currencyUtils";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ArrowDownLeftIcon, ArrowUpRightIcon } from "@phosphor-icons/react";
import { motion } from "framer-motion";

export default function SummaryCards({
  summary = { income: 0, outcome: 0, categories: [] },
  dateRangeFormatted = "",
  isLoading = false
}) {
  const { currency } = useDashboardContext();
  const symbol = getCurrencySymbol(currency);
  const balance = summary.income - summary.outcome;
  const isPositive = balance >= 0;
  const flow = summary.income + summary.outcome;
  const incomeShare = flow > 0 ? (summary.income / flow) * 100 : 50;
  const savingsRate = summary.income > 0 ? (balance / summary.income) * 100 : null;

  return (
    <section aria-label="Period summary" className="mb-10 grid grid-cols-1 gap-4 lg:grid-cols-[1.55fr_1fr]">
      {/* Net balance - the headline */}
      <Card className="relative flex flex-col justify-between gap-10 overflow-hidden p-6 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Eyebrow>Net balance</Eyebrow>
            <p className="text-[13px] text-muted-foreground">{dateRangeFormatted}</p>
          </div>
          {!isLoading && savingsRate !== null && (
            <span
              className={cn(
                "figure rounded-full px-2.5 py-1 text-xs font-medium",
                isPositive ? "bg-accent-soft text-accent" : "bg-destructive-soft text-destructive"
              )}
            >
              {savingsRate >= 0 ? "+" : "−"}{Math.abs(savingsRate).toFixed(1)}% kept
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-12 w-64 rounded-xl md:h-14" />
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <p
              className={cn(
                "figure flex items-baseline gap-1 text-[2.5rem] font-semibold leading-none tracking-[-0.045em] sm:text-[3rem] md:text-[4.25rem]",
                isPositive ? "text-foreground" : "text-destructive"
              )}
            >
              <span className="text-[0.55em] text-muted-foreground">{isPositive ? "" : "−"}{symbol}</span>
              <AnimatedNumber value={balance} />
            </p>

            {/* Income vs. expense split */}
            <div className="flex flex-col gap-2">
              <div className="flex h-1.5 w-full gap-[2px] overflow-hidden rounded-full">
                <motion.div
                  className="h-full rounded-full bg-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${incomeShare}%` }}
                  transition={spring}
                />
                <div className="h-full flex-1 rounded-full bg-foreground/15" />
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>In {incomeShare.toFixed(0)}%</span>
                <span>Out {(100 - incomeShare).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        )}

        <p className="text-[13px] text-muted-foreground">
          {isLoading ? " " : isPositive ? "More came in than went out this period." : "Spending ran ahead of income this period."}
        </p>
      </Card>

      {/* Flows */}
      <Card className="flex flex-col divide-y divide-border/70">
        <FlowRow
          label="Money in"
          icon={ArrowDownLeftIcon}
          tone="positive"
          symbol={symbol}
          value={summary.income}
          isLoading={isLoading}
        />
        <FlowRow
          label="Money out"
          icon={ArrowUpRightIcon}
          tone="negative"
          symbol={symbol}
          value={summary.outcome}
          isLoading={isLoading}
        />
      </Card>
    </section>
  );
}

function FlowRow({ label, icon: Icon, tone, symbol, value, isLoading }) {
  return (
    <div className="flex flex-1 items-center justify-between gap-4 px-6 py-6 md:px-8">
      <div className="flex flex-col gap-3">
        <Eyebrow>{label}</Eyebrow>
        {isLoading ? (
          <Skeleton className="h-8 w-40 rounded-lg" />
        ) : (
          <p className="figure text-[1.75rem] font-semibold leading-none tracking-[-0.035em] text-foreground">
            <span className="mr-0.5 text-[0.6em] text-muted-foreground">{symbol}</span>
            <AnimatedNumber value={value} />
          </p>
        )}
      </div>
      <span
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-2xl",
          tone === "positive" ? "bg-accent-soft text-accent" : "bg-destructive-soft text-destructive"
        )}
      >
        <Icon className="size-5" weight="bold" />
      </span>
    </div>
  );
}
