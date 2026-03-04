"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-light-blue)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 rounded-[var(--radius-md)]",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--brand-red)] text-white hover:bg-[#c40012] shadow-sm",
        secondary:
          "border border-[var(--border)] bg-[var(--surface-0)] hover:bg-[var(--surface-1)] text-[var(--text-0)]",
        outline:
          "border border-[var(--brand-dark-blue)] text-[var(--brand-dark-blue)] hover:bg-[var(--brand-dark-blue)] hover:text-white",
        ghost: "hover:bg-[var(--surface-2)] text-[var(--text-0)]",
        destructive:
          "bg-[var(--brand-red)] text-white hover:bg-[#c40012]",
        link: "text-[var(--brand-dark-blue)] underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-[var(--button-height)] px-4 text-sm",
        lg: "h-11 px-6 text-base",
        icon: "h-[var(--button-height)] w-[var(--button-height)]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
