import * as React from "react";
import { cn } from "@/lib/utils";

type OrderStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "ordered"
  | "received";
type StockStatus = "ok" | "low" | "out";

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: OrderStatus | StockStatus;
}

const statusConfig: Record<
  OrderStatus | StockStatus,
  { label: string; icon: string; className: string }
> = {
  // Order statuses
  draft: {
    label: "Draft",
    icon: "📝",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  },
  pending: {
    label: "Pending",
    icon: "⏳",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  approved: {
    label: "Approved",
    icon: "✓",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  rejected: {
    label: "Rejected",
    icon: "✗",
    className: "bg-red-100 text-red-700 border-red-200",
  },
  ordered: {
    label: "Ordered",
    icon: "📦",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  received: {
    label: "Received",
    icon: "✅",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  // Stock statuses
  ok: {
    label: "In Stock",
    icon: "✓",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  low: {
    label: "Low Stock",
    icon: "⚠️",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  out: {
    label: "Out of Stock",
    icon: "🔴",
    className: "bg-red-100 text-red-700 border-red-200",
  },
};

function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        config.className,
        className
      )}
      {...props}
    >
      <span aria-hidden="true">{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}

export { StatusBadge, type OrderStatus, type StockStatus };
