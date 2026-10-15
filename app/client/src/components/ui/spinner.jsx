import { cn } from "@/lib/utils";

/**
 * Small inline busy indicator for buttons and status rows.
 * Prefer <Skeleton> for content that is loading.
 */
export function Spinner({ className, size = "md" }) {
  const sizeClasses = {
    xs: "size-3",
    sm: "size-3.5",
    md: "size-4",
    lg: "size-5",
    xl: "size-6",
  };

  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block rounded-full border-[1.5px] border-current border-t-transparent animate-spin text-muted-foreground",
        sizeClasses[size] || sizeClasses.md,
        className
      )}
    />
  );
}
