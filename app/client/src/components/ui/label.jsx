import * as LabelPrimitive from "@radix-ui/react-label";

import { cn } from "@/lib/utils";

function Label({
  className,
  ...props
}) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-1.5 text-[13px] font-medium leading-none text-foreground select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props} />
  );
}

// Helper and error text that sit below an input
function FieldHint({ className, ...props }) {
  return <p className={cn("text-xs text-muted-foreground", className)} {...props} />;
}

function FieldError({ className, children, ...props }) {
  if (!children) return null;
  return (
    <p role="alert" className={cn("text-xs font-medium text-destructive", className)} {...props}>
      {children}
    </p>
  );
}

export { FieldError, FieldHint, Label };
