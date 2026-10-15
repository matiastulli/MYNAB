import { cn } from "@/lib/utils"

function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full min-w-0 rounded-xl border border-input bg-card px-3.5 text-[15px] text-foreground md:text-sm",
        "transition-[border-color,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        "hover:border-foreground/25",
        "focus-visible:outline-none focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent/12",
        "aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/12",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className,
      )}
      {...props}
    />
  )
}

export { Input }
