import { getCurrencySymbol } from "@/lib/currencyUtils";
import { cn } from "@/lib/utils";

/**
 * Money, consistently formatted: mono tabular digits, sign + color by direction.
 *
 * @param {number} props.value - The numeric value to display
 * @param {string} props.type - "income", "outcome" or "neutral"
 * @param {string} props.currency - Currency code (USD, ARS, ...)
 * @param {boolean} props.showSign - Whether to show + or -
 * @param {boolean} props.compact - Compact display (1.2k, 3.4M)
 * @param {string} props.size - "xs" | "sm" | "base" | "lg" | "xl" | "2xl"
 */
export function FinancialValue({
  value,
  type = "neutral",
  currency = "USD",
  className,
  showSign = true,
  compact = false,
  size = "base",
}) {
  const isPositive = type === "income";
  const isNegative = type === "outcome";
  const isZero = value === 0;

  const sizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-[15px]",
    md: "text-[15px]",
    lg: "text-base",
    xl: "text-xl",
    "2xl": "text-2xl",
  };

  const formatNumber = (num) => {
    if (compact && Math.abs(num) >= 1000000) {
      return (Math.abs(num) / 1000000).toLocaleString("en-US", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }) + "M";
    }

    if (compact && Math.abs(num) >= 1000) {
      return (Math.abs(num) / 1000).toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1
      }) + "k";
    }

    return Number(Math.abs(num)).toLocaleString("en-US", {
      minimumFractionDigits: compact ? 0 : 2,
      maximumFractionDigits: 2
    });
  };

  const tone = isZero
    ? "text-foreground"
    : isPositive
      ? "text-positive"
      : isNegative
        ? "text-foreground"
        : "text-foreground";

  return (
    <span className={cn("figure whitespace-nowrap font-medium", tone, sizeClasses[size] || sizeClasses.base, className)}>
      {showSign && isPositive && "+"}
      {showSign && isNegative && "−"}
      {getCurrencySymbol(currency)}
      {formatNumber(value)}
      {currency !== "USD" && currency !== "ARS" && (
        <span className="ml-1 text-[0.7em] font-normal text-muted-foreground">{currency}</span>
      )}
    </span>
  );
}

// Shared formatter for figures rendered outside <FinancialValue>
export function formatMoney(value, { decimals = 2 } = {}) {
  return Math.abs(Number(value) || 0).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
