import { cn } from "@/lib/utils"

function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] selection:bg-[hsl(var(--primary))] selection:text-[hsl(var(--primary-foreground))] bg-[hsl(var(--background))] border-[hsl(var(--input))] flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs transition-[color,box-shadow,border-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-[hsl(var(--foreground))]",
        "focus-visible:border-[hsl(var(--ring))] focus-visible:ring-[hsl(var(--ring)/0.5)] focus-visible:ring-[3px]",
        "aria-invalid:ring-[hsl(var(--destructive)/0.2)] dark:aria-invalid:ring-[hsl(var(--destructive)/0.4)] aria-invalid:border-[hsl(var(--destructive))]",
        "hover:border-[hsl(var(--accent)/0.5)] transition-colors duration-200",
        className,
      )}
      {...props}
    />
  )
}

export { Input }

