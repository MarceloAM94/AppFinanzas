import { type ReactNode } from "react";

type BadgeVariant = "neutral" | "up" | "down" | "primary" | "info";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "bg-surface-elevated text-muted-strong",
  up: "bg-up/10 text-up",
  down: "bg-down/10 text-down",
  primary: "bg-primary/10 text-primary",
  info: "bg-info/10 text-info",
};

export default function Badge({ variant = "neutral", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
