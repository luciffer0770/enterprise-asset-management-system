"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--neutral-dark)] text-white",
        success:
          "bg-[var(--brand-light-green)]/20 text-[var(--brand-dark-green)]",
        warning:
          "bg-[var(--warning)]/20 text-[#B45309]",
        error:
          "bg-[var(--brand-red)]/15 text-[var(--brand-red)]",
        info:
          "bg-[var(--brand-light-blue)]/20 text-[var(--brand-dark-blue)]",
        neutral:
          "bg-[var(--surface-2)] text-[var(--text-1)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
