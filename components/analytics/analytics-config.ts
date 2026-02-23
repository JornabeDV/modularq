import { type ChartConfig } from "@/components/ui/chart";

export type ProjectStatusType =
  | "planning"
  | "active"
  | "paused"
  | "completed"
  | "delivered";

export interface ProjectStatusInfo {
  type: ProjectStatusType;
  label: string;
  color: string;
  bgColor: string;
}

export const STATUS_CONFIG: ProjectStatusInfo[] = [
  {
    type: "planning",
    label: "Planificación",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    type: "active",
    label: "Activo",
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    type: "paused",
    label: "En Pausa",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
  },
  {
    type: "completed",
    label: "Completado",
    color: "text-gray-600",
    bgColor: "bg-gray-100",
  },
  {
    type: "delivered",
    label: "Entregado",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
];

export function getStatusInfo(status: ProjectStatusType): ProjectStatusInfo {
  return (
    STATUS_CONFIG.find((config) => config.type === status) || STATUS_CONFIG[0]
  );
}

export const chartConfig: ChartConfig = {
  proyectos: {
    label: "Proyectos Creados",
    color: "hsl(var(--chart-1))",
  },
  planning: {
    label: "Planificación",
    color: "#3b82f6", // Azul
  },
  active: {
    label: "Activo",
    color: "#22c55e", // Verde
  },
  paused: {
    label: "En Pausa",
    color: "#f59e0b", // Naranja/Ámbar más oscuro
  },
  completed: {
    label: "Completado",
    color: "#64748b", // Gris slate más oscuro
  },
  delivered: {
    label: "Entregado",
    color: "#a855f7", // Púrpura
  },
};

export const statusColors: Record<ProjectStatusType, string> = {
  planning: "#3b82f6", // Azul
  active: "#22c55e", // Verde
  paused: "#f59e0b", // Naranja/Ámbar
  completed: "#64748b", // Gris slate
  delivered: "#a855f7", // Púrpura
};
