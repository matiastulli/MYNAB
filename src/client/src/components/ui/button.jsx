import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 active:bg-primary/95 focus-visible:ring-2 focus-visible:ring-ring/30",
        destructive:
          "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90 active:bg-destructive/95 focus-visible:ring-2 focus-visible:ring-destructive/20",
        outline:
          "border border-input bg-background shadow-xs hover:bg-accent/10 hover:text-accent-foreground active:bg-accent/20 focus-visible:ring-2 focus-visible:ring-ring/30",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 active:bg-secondary/90 focus-visible:ring-2 focus-visible:ring-ring/30",
        ghost:
          "hover:bg-accent/10 hover:text-accent-foreground active:bg-accent/20 focus-visible:ring-2 focus-visible:ring-ring/30",
        link: "text-accent underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring/30",
        success:
          "bg-[hsl(var(--positive))] text-positive-foreground shadow-xs hover:bg-[hsl(var(--positive))]/90 active:bg-[hsl(var(--positive))]/95 focus-visible:ring-2 focus-visible:ring-[hsl(var(--positive))]/20",
        info:
          "bg-[hsl(var(--info-fg))] text-white shadow-xs hover:bg-[hsl(var(--info-fg))]/90 active:bg-[hsl(var(--info-fg))]/95 focus-visible:ring-2 focus-visible:ring-[hsl(var(--info-fg))]/20",
        warning:
          "bg-[hsl(var(--warning-fg))] text-white shadow-xs hover:bg-[hsl(var(--warning-fg))]/90 active:bg-[hsl(var(--warning-fg))]/95 focus-visible:ring-2 focus-visible:ring-[hsl(var(--warning-fg))]/20",
        "success-outline":
          "border border-[hsl(var(--positive))] text-[hsl(var(--positive))] bg-[hsl(var(--positive))]/10 hover:bg-[hsl(var(--positive))]/20 focus-visible:ring-2 focus-visible:ring-[hsl(var(--positive))]/20",
        "destructive-outline":
          "border border-destructive text-destructive bg-destructive/10 hover:bg-destructive/20 focus-visible:ring-2 focus-visible:ring-destructive/20",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-7 text-xs rounded-md gap-1 px-2.5",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 text-xs",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        xl: "h-12 rounded-md px-8 text-base",
        icon: "size-9 p-0",
        "icon-sm": "size-7 p-0",
      },
      loading: {
        true: "relative text-transparent transition-none hover:text-transparent",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
    compoundVariants: [
      {
        loading: true,
        className: "pointer-events-none relative",
      }
    ],
  }
)

function Button({
  className,
  variant,
  size,
  loading = false,
  asChild = false,
  loadingText,
  children,
  ...props
}) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, loading, className }))}
      disabled={loading || props.disabled}
      {...props}
    >
      {children}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="size-4 animate-spin text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
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
          {loadingText && <span className="ml-2 text-current">{loadingText}</span>}
        </div>
      )}
    </Comp>
  );
}

export { Button, buttonVariants };

