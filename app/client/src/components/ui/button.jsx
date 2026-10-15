import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium tracking-tight transition-[background-color,color,border-color,box-shadow,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[var(--shadow-inner-edge)] hover:bg-primary/88",
        accent:
          "bg-accent text-accent-foreground shadow-[var(--shadow-inner-edge)] hover:bg-accent/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-border bg-card text-foreground hover:border-foreground/20 hover:bg-muted",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/70",
        ghost:
          "text-muted-foreground hover:bg-muted hover:text-foreground",
        "destructive-ghost":
          "text-muted-foreground hover:bg-destructive-soft hover:text-destructive",
        link: "rounded-none text-accent underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        default: "h-10 px-5",
        xs: "h-7 px-2.5 text-xs gap-1",
        sm: "h-8 px-3.5 text-[13px] gap-1.5",
        lg: "h-11 px-6",
        xl: "h-12 px-7 text-[15px]",
        icon: "size-9 p-0",
        "icon-sm": "size-8 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

function Button({ className, variant, size, loading = false, asChild = false, loadingText, children, ...props }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), loading && "pointer-events-none", className)}
      disabled={loading || props.disabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <span className="size-3.5 rounded-full border-[1.5px] border-current border-t-transparent animate-spin" aria-hidden="true" />
          {loadingText ?? children}
        </>
      ) : (
        children
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
