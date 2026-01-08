"use client";

import { Badge } from "@/components/ui/badge";
import { getStatusLabel } from "@/lib/utils/status-label";

type Props = {
  status: string;
  className?: string;
};

const statusClass = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-50 text-green-700 border-green-200";
    case "in_progress":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "assigned":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "pending":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

export function StatusBadge({ status, className = "" }: Props) {
  return (
    <Badge
      variant="outline"
      className={`text-xs font-medium ${statusClass(status)} ${className}`}
    >
      {getStatusLabel(status)}
    </Badge>
  );
}
