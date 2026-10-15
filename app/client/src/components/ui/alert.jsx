import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import * as React from "react";

const alertVariants = cva(
  "relative flex w-full gap-3 rounded-2xl border px-4 py-3.5 text-sm [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-border bg-muted/60 text-foreground [&>svg]:text-muted-foreground",
        destructive: "border-destructive/25 bg-destructive-soft text-destructive",
        warning: "border-warning/25 bg-warning-soft text-warning",
        success: "border-accent/25 bg-accent-soft text-accent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Alert = React.forwardRef(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("font-medium leading-tight tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mt-1 text-[13px] leading-relaxed opacity-90", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertDescription, AlertTitle };
