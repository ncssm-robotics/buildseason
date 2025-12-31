import { cn } from "@/lib/utils";
import { Card, CardContent } from "./card";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { ReactNode } from "react";

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  status?: "ok" | "warning" | "error";
  trend?: {
    direction: "up" | "down";
    value: string;
  };
  onClick?: () => void;
  className?: string;
}

const statusColors = {
  ok: "bg-green-500",
  warning: "bg-yellow-500",
  error: "bg-red-500",
} as const;

const trendColors = {
  up: "text-green-600",
  down: "text-red-600",
} as const;

export function StatsCard({
  title,
  value,
  icon,
  status,
  trend,
  onClick,
  className,
}: StatsCardProps) {
  const isClickable = !!onClick;

  return (
    <Card
      className={cn(
        "relative",
        isClickable && "cursor-pointer hover:bg-accent/50 transition-colors",
        className
      )}
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {icon && (
              <div
                className="flex-shrink-0 text-muted-foreground"
                aria-hidden="true"
              >
                {icon}
              </div>
            )}
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                {title}
              </p>
              <p className="text-2xl font-bold">{value}</p>
            </div>
          </div>
          {status && (
            <div
              className={cn("h-3 w-3 rounded-full", statusColors[status])}
              role="status"
              aria-label={`Status: ${status}`}
            />
          )}
        </div>
        {trend && (
          <div
            className={cn(
              "mt-2 flex items-center gap-1 text-sm",
              trendColors[trend.direction]
            )}
          >
            {trend.direction === "up" ? (
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
            ) : (
              <TrendingDown className="h-4 w-4" aria-hidden="true" />
            )}
            <span>{trend.value}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
