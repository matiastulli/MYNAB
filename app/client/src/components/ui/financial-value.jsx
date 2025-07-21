import { getCurrencySymbol } from "@/lib/currencyUtils";
import { cn } from "@/lib/utils";

/**
 * An enhanced component to display financial values with consistent formatting and visual design
 * 
 * @param {Object} props
 * @param {number} props.value - The numeric value to display
 * @param {string} props.type - Can be "income", "outcome" or "neutral"
 * @param {string} props.currency - Currency code (USD, EUR, ARS, etc.)
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showSign - Whether to show + or - sign
 * @param {boolean} props.compact - Compact display format
 * @param {string} props.size - Size variant: "xs", "sm", "base", "lg", "xl", "2xl"
 * @param {boolean} props.animate - Whether to animate value changes
 */
export function FinancialValue({
  value,
  type = "neutral",
  currency = "USD",
  className,
  showSign = true,
  compact = false,
  size = "base",
  animate = false
}) {
  const isPositive = type === "income";
  const isNegative = type === "outcome";
  const isZero = value === 0;

  // Size classes mapping
  const sizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl"
  };

  // Format number with commas and decimal places
  const formatNumber = (num) => {
    // For compact display of large numbers
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

  // Get CSS class based on type
  const getTypeClass = () => {
    if (isZero) return "financial-neutral";
    if (isPositive) return "financial-positive";
    if (isNegative) return "financial-negative";
    return "financial-neutral";
  };

  return (
    <span className={cn(
      getTypeClass(),
      sizeClasses[size] || "text-base",
      animate && "transition-all duration-300 ease-in-out",
      "whitespace-nowrap", 
      className
    )}>
      {showSign && isPositive && "+"}
      {showSign && isNegative && "-"}
      {getCurrencySymbol(currency)}
      {formatNumber(value)}
      {!compact && currency !== "USD" && currency !== "ARS" && (
        <span className="text-xs ml-1 opacity-75">{currency}</span>
      )}
      {compact && (currency !== "USD" && currency !== "ARS") && (
        <span className="text-xs ml-0.5 opacity-75">{currency}</span>
      )}
    </span>
  );
}
