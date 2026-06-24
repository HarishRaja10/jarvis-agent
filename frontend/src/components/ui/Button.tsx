import { ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-core/60 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "border-cyan-core/45 bg-cyan-core/14 text-cyan-core shadow-neon hover:bg-cyan-core/20",
        ghost: "border-border/70 bg-panel/55 text-foreground hover:border-cyan-core/45 hover:text-cyan-core",
        danger: "border-rose-core/35 bg-rose-core/10 text-rose-core hover:bg-rose-core/16"
      },
      size: {
        sm: "h-9 px-2.5",
        md: "h-10 px-3",
        icon: "h-10 w-10 px-0"
      }
    },
    defaultVariants: {
      variant: "ghost",
      size: "md"
    }
  }
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
));

Button.displayName = "Button";

