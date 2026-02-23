"use client";

import { ReactNode } from "react";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";

export const getStatusLabel = (status: string) => {
  switch (status) {
    case "pending":
      return "Pendiente";
    case "in_progress":
      return "En Progreso";
    case "completed":
      return "Completada";
    case "cancelled":
      return "Cancelada";
    default:
      return status || "Desconocido";
  }
};

export const getStatusIcon = (status: string): ReactNode => {
  switch (status) {
    case "pending":
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    case "in_progress":
      return <Clock className="h-4 w-4 text-orange-500" />;
    case "completed":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "cancelled":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-500" />;
  }
};
