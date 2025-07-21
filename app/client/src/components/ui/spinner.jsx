import { cn } from "@/lib/utils";

/**
 * A reusable spinner component for loading states with enhanced visual feedback
 * 
 * @param {string} className - Additional CSS classes
 * @param {string} size - Size of the spinner (xs, sm, md, lg, xl)
 * @param {string} color - Color of the spinner (accent, primary, positive, destructive)
 * @param {string} variant - Visual style (circle, dots)
 */
export function Spinner({ 
  className, 
  size = "md", 
  color = "accent",
  variant = "circle"
}) {
  const sizeClasses = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
    xl: "h-8 w-8"
  };
  
  const colorClasses = {
    accent: "text-[hsl(var(--accent))]",
    primary: "text-[hsl(var(--primary))]",
    positive: "text-[hsl(var(--positive))]",
    destructive: "text-[hsl(var(--destructive))]",
    foreground: "text-[hsl(var(--foreground))]"
  };
  
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const colorClass = colorClasses[color] || colorClasses.accent;

  if (variant === "dots") {
    return (
      <div className={cn("flex gap-1", className)}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "animate-pulse rounded-full",
              sizeClass,
              colorClass
            )}
            style={{
              animationDelay: `${i * 0.15}s`,
              backgroundColor: 'currentColor'
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("animate-spin", sizeClass, colorClass, className)}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        ></circle>
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </div>
  );
}
