"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            "flex h-[var(--input-height)] w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-0)] px-3 py-2 text-sm transition-colors",
            "placeholder:text-[var(--text-muted)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-light-blue)] focus-visible:ring-offset-1",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-[var(--error)]",
            className
          )}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? `${props.id}-error` : undefined}
          {...props}
        />
        {error && (
          <p
            id={props.id ? `${props.id}-error` : undefined}
            className="mt-1 text-sm text-[var(--error)]"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
