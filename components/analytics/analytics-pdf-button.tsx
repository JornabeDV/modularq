"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { getPeriodActivityStats } from "./analytics-utils";
import type { AnalyticsPdfData } from "./analytics-pdf-document";

const STATUS_LABELS: Record<string, string> = {
  planning: "Planificación",
  active: "Activo",
  paused: "En Pausa",
  completed: "Completado",
  delivered: "Entregado",
};

const STATUS_COLORS: Record<string, string> = {
  planning: "#3b82f6",
  active: "#22c55e",
  paused: "#f59e0b",
  completed: "#64748b",
  delivered: "#a855f7",
};

interface AnalyticsPdfButtonProps {
  projectsWithStatus: any[];
  stats: {
    statusCounts: Record<string, number>;
    taskStats: {
      pending: number;
      in_progress: number;
      completed: number;
      cancelled: number;
    };
  };
  periodMode: "week" | "month";
  periodKey: string;
  periodLabel: string;
}

export function AnalyticsPdfButton({
  projectsWithStatus,
  stats,
  periodMode,
  periodKey,
  periodLabel,
}: AnalyticsPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const pdfData = useMemo((): AnalyticsPdfData => {
    const periodActivity = getPeriodActivityStats(
      projectsWithStatus,
      periodMode,
      periodKey,
    );

    let periodStart: Date, periodEnd: Date;
    if (periodMode === "week") {
      periodStart = new Date(periodKey);
      periodStart.setHours(0, 0, 0, 0);
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 6);
      periodEnd.setHours(23, 59, 59, 999);
    } else {
      const [year, month] = periodKey.split("-").map(Number);
      periodStart = new Date(year, month - 1, 1);
      periodEnd = new Date(year, month, 0);
      periodEnd.setHours(23, 59, 59, 999);
    }
    const inPeriod = (dateStr: string | null | undefined) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d >= periodStart && d <= periodEnd;
    };
    const startedByPeriod = (p: any) =>
      !p.startDate || new Date(p.startDate) <= periodEnd;

    const periodProjects = projectsWithStatus.filter(startedByPeriod);
    const periodStatusCounts = {
      planning: periodProjects.filter((p) => p.status === "planning").length,
      active: periodProjects.filter((p) => p.status === "active").length,
      paused: periodProjects.filter((p) => p.status === "paused").length,
      completed: projectsWithStatus.filter((p) => p.status === "completed" && inPeriod(p.completedAt ?? p.updatedAt)).length,
      delivered: projectsWithStatus.filter((p) => p.status === "delivered" && inPeriod(p.deliveredAt ?? p.updatedAt)).length,
    };

    const ACTIVE_STATUSES = new Set(["planning", "active", "paused"]);
    const activeProjects = periodProjects.filter((p) =>
      ACTIVE_STATUSES.has(p.status),
    );
    const activeTaskStats = activeProjects.reduce(
      (acc, p) => {
        acc.pending += p.pendingTasks;
        acc.in_progress += p.inProgressTasks;
        acc.completed += p.completedTasks;
        acc.cancelled += p.cancelledTasks ?? 0;
        return acc;
      },
      { pending: 0, in_progress: 0, completed: 0, cancelled: 0 },
    );

    return {
      generatedAt: new Date(),
      periodMode,
      periodLabel,
      projects: projectsWithStatus.filter(startedByPeriod).map((p) => ({
        name: p.name,
        statusLabel: STATUS_LABELS[p.status] ?? p.status,
        statusColor: STATUS_COLORS[p.status] ?? "#94a3b8",
        completionPercentage: p.completionPercentage,
        completedTasks: p.completedTasks,
        pendingTasks: p.pendingTasks,
        inProgressTasks: p.inProgressTasks,
        totalTasks: p.totalTasks,
        estimatedHours:
          p.projectTasks?.reduce(
            (s: number, t: any) => s + (t.estimatedHours || 0),
            0,
          ) ?? 0,
        actualHours:
          p.projectTasks?.reduce(
            (s: number, t: any) => s + (t.actualHours || 0),
            0,
          ) ?? 0,
        pendingTaskNames:
          p.projectTasks
            ?.filter((t: any) => t.status === "pending")
            .map((t: any) => (t.task?.title ?? "") as string) ?? [],
        startDate: p.startDate ? new Date(p.startDate).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }) : null,
        endDate: p.endDate ? new Date(p.endDate).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }) : null,
        daysUntilDeadline: p.endDate
          ? Math.ceil((new Date(p.endDate).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000)
          : null,
        clientName: p.client?.companyName ?? null,
        completedAt: p.completedAt ? new Date(p.completedAt).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }) : null,
        deliveredAt: p.deliveredAt ? new Date(p.deliveredAt).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }) : null,
      })),
      deliveredProjects: projectsWithStatus
        .filter((p) => p.status === "delivered" && inPeriod(p.deliveredAt ?? p.updatedAt))
        .map((p) => ({
          name: p.name,
          statusLabel: STATUS_LABELS[p.status] ?? p.status,
          statusColor: STATUS_COLORS[p.status] ?? "#94a3b8",
          completionPercentage: p.completionPercentage,
          completedTasks: p.completedTasks,
          pendingTasks: p.pendingTasks,
          inProgressTasks: p.inProgressTasks,
          totalTasks: p.totalTasks,
          estimatedHours: 0,
          actualHours: 0,
          pendingTaskNames: [],
          startDate: p.startDate ? new Date(p.startDate).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }) : null,
          endDate: p.endDate ? new Date(p.endDate).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }) : null,
          daysUntilDeadline: null,
          clientName: p.client?.companyName ?? null,
          completedAt: null,
          deliveredAt: p.deliveredAt ? new Date(p.deliveredAt).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }) : null,
        })),
      completedProjects: projectsWithStatus
        .filter((p) => p.status === "completed" && inPeriod(p.completedAt ?? p.updatedAt))
        .map((p) => ({
          name: p.name,
          statusLabel: STATUS_LABELS[p.status] ?? p.status,
          statusColor: STATUS_COLORS[p.status] ?? "#94a3b8",
          completionPercentage: p.completionPercentage,
          completedTasks: p.completedTasks,
          pendingTasks: p.pendingTasks,
          inProgressTasks: p.inProgressTasks,
          totalTasks: p.totalTasks,
          estimatedHours: 0,
          actualHours: 0,
          pendingTaskNames: [],
          startDate: p.startDate ? new Date(p.startDate).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }) : null,
          endDate: p.endDate ? new Date(p.endDate).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }) : null,
          daysUntilDeadline: null,
          clientName: p.client?.companyName ?? null,
          completedAt: p.completedAt ? new Date(p.completedAt).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }) : null,
          deliveredAt: null,
        })),
      pausedProjects: projectsWithStatus
        .filter((p) => p.status === "paused" && startedByPeriod(p))
        .map((p) => ({
          name: p.name,
          statusLabel: STATUS_LABELS[p.status] ?? p.status,
          statusColor: STATUS_COLORS[p.status] ?? "#94a3b8",
          completionPercentage: p.completionPercentage,
          completedTasks: p.completedTasks,
          pendingTasks: p.pendingTasks,
          inProgressTasks: p.inProgressTasks,
          totalTasks: p.totalTasks,
          estimatedHours: 0,
          actualHours: 0,
          pendingTaskNames: [],
          startDate: p.startDate ? new Date(p.startDate).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }) : null,
          endDate: p.endDate ? new Date(p.endDate).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }) : null,
          daysUntilDeadline: p.endDate
            ? Math.ceil((new Date(p.endDate).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000)
            : null,
          clientName: p.client?.companyName ?? null,
          completedAt: null,
          deliveredAt: null,
        })),
      planningProjects: projectsWithStatus
        .filter((p) => p.status === "planning" && startedByPeriod(p))
        .map((p) => ({
          name: p.name,
          statusLabel: STATUS_LABELS[p.status] ?? p.status,
          statusColor: STATUS_COLORS[p.status] ?? "#94a3b8",
          completionPercentage: p.completionPercentage,
          completedTasks: p.completedTasks,
          pendingTasks: p.pendingTasks,
          inProgressTasks: p.inProgressTasks,
          totalTasks: p.totalTasks,
          estimatedHours: 0,
          actualHours: 0,
          pendingTaskNames: [],
          startDate: p.startDate ? new Date(p.startDate).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }) : null,
          endDate: p.endDate ? new Date(p.endDate).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }) : null,
          daysUntilDeadline: null,
          clientName: p.client?.companyName ?? null,
          completedAt: null,
          deliveredAt: null,
        })),
      statusCounts: periodStatusCounts,
      taskStats: activeTaskStats,
      periodActivity,
    };
  }, [projectsWithStatus, stats, periodMode, periodKey, periodLabel]);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const { AnalyticsPdfDocument } = await import("./analytics-pdf-document");
      const blob = await pdf(<AnalyticsPdfDocument data={pdfData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Reporte_${periodLabel.replace(/\s/g, "_")}_${new Date().toLocaleDateString("es-AR").replace(/\//g, "-")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generando PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={isGenerating}
      className="gap-2 cursor-pointer h-9"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generando...
        </>
      ) : (
        <>
          <FileDown className="h-4 w-4" />
          Exportar PDF
        </>
      )}
    </Button>
  );
}
