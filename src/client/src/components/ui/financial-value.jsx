import { cn } from "@/lib/utils";

/**
 * A component to display financial values with consistent formatting
 * 
 * @param {Object} props
 * @param {number} props.value - The numeric value to display
 * @param {string} props.type - Can be "income", "outcome" or "neutral"
 * @param {string} props.currency - Currency code (USD, EUR, ARS, etc.)
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showSign - Whether to show + or - sign
 * @param {boolean} props.compact - Compact display format
 */
export function FinancialValue({ 
  value, 
  type = "neutral", 
  currency = "USD",
  className, 
  showSign = true,
  compact = false
}) {
  const isPositive = type === "income";
  const isNegative = type === "outcome";

  // Get currency symbol
  const getCurrencySymbol = (code) => {
    switch (code) {
      case "USD": return "$";
      case "EUR": return "€";
      case "GBP": return "£";
      case "BRL": return "R$";
      default: return "$"; // Default to $ for ARS and others
    }
  };

  // Format number with commas and decimal places
  const formatNumber = (num) => {
    return Number(num).toLocaleString("en-US", { 
      minimumFractionDigits: compact ? 0 : 2,
      maximumFractionDigits: 2
    });
  };

  // Get CSS class based on type
  const getTypeClass = () => {
    if (isPositive) return "financial-positive";
    if (isNegative) return "financial-negative";
    return "financial-neutral";
  };

  return (
    <span className={cn(getTypeClass(), className)}>
      {showSign && isPositive && "+"}
      {showSign && isNegative && "-"}
      {getCurrencySymbol(currency)}
      {formatNumber(Math.abs(value))}
      {compact && currency !== "USD" && currency !== "ARS" && (
        <span className="text-xs ml-1 opacity-75">{currency}</span>
      )}
    </span>
  );
}
