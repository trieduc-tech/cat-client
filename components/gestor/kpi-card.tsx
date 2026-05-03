"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";

interface KpiCardProps {
  label: string;
  value: ReactNode;
  sublabel?: ReactNode;
  trend?: {
    value: number;
    label?: string;
  };
  icon?: ReactNode;
  highlight?: boolean;
  footer?: ReactNode;
  size?: "default" | "lg";
}

export function KpiCard({
  label,
  value,
  sublabel,
  trend,
  icon,
  highlight = false,
  footer,
  size = "default",
}: KpiCardProps) {
  const isLg = size === "lg";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      className={`group relative overflow-hidden rounded-2xl border ${
        highlight
          ? "border-primary/25 bg-gradient-to-br from-primary/[0.07] via-primary/[0.03] to-transparent"
          : "border-border/60 bg-card/60"
      } p-5 ${isLg ? "sm:p-7" : "sm:p-6"} backdrop-blur-sm`}
    >
      {/* glow no hover */}
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 h-full w-3/4 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
              {label}
            </p>
            {trend && (
              <span
                className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9.5px] font-mono font-semibold ${
                  trend.value >= 0
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "bg-red-500/10 text-red-700 dark:text-red-400"
                }`}
              >
                {trend.value >= 0 ? "▲" : "▼"} {Math.abs(trend.value)}
                {trend.label ? ` ${trend.label}` : "%"}
              </span>
            )}
          </div>
          <p
            className={`font-display tracking-[-0.02em] leading-none ${
              isLg ? "text-4xl sm:text-5xl" : "text-3xl sm:text-[2.25rem]"
            } ${highlight ? "text-primary" : "text-foreground"}`}
          >
            {value}
          </p>
          {sublabel && (
            <p className="text-[12px] text-muted-foreground leading-snug">{sublabel}</p>
          )}
        </div>
        {icon && (
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              highlight ? "bg-primary/10 text-primary" : "bg-muted/60 text-muted-foreground"
            }`}
          >
            {icon}
          </div>
        )}
      </div>

      {footer && <div className="relative mt-4 pt-3 border-t border-border/40">{footer}</div>}
    </motion.div>
  );
}
