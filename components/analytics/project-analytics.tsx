"use client";

import { useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import { useProjectsPrisma } from "@/hooks/use-projects-prisma";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProjectStatusPieChart } from "./project-status-pie-chart";
import { ProjectsByClientPieChart, type ClientProjectsData } from "./projects-by-client-pie-chart";
import { ProjectCreationLineChart } from "./project-creation-line-chart";
import { ProjectDeliveryLineChart } from "./project-delivery-line-chart";
import { ProjectProgressGrid } from "./project-progress-grid";
import { TaskCompletionLineChart } from "./task-completion-line-chart";
import { OperarioTasksBarChart } from "./operario-tasks-bar-chart";
import { OperarioEvolutionLineChart } from "./operario-evolution-line-chart";
import { AnalyticsPdfButton } from "./analytics-pdf-button";
import {
  processWeeklyProjectData,
  processMonthlyProjectData,
  getProgressLevel,
  getAvailablePeriods,
} from "./analytics-utils";
import { getStatusInfo, type ProjectStatusType } from "./analytics-config";

export function ProjectAnalytics() {
  const { projects, loading } = useProjectsPrisma();

  // ── Period selector for PDF report ──
  const [periodMode, setPeriodMode] = useState<"week" | "month">("month");

  const periods = useMemo(() => getAvailablePeriods(periodMode), [periodMode]);
  const defaultPeriodKey = periods[periods.length - 1]?.key ?? "";
  const [periodKey, setPeriodKey] = useState<string>(defaultPeriodKey);

  const handlePeriodModeChange = (mode: "week" | "month") => {
    setPeriodMode(mode);
    const newPeriods = getAvailablePeriods(mode);
    setPeriodKey(newPeriods[newPeriods.length - 1]?.key ?? "");
  };

  const periodLabel = useMemo(
    () => periods.find((p) => p.key === periodKey)?.label ?? "",
    [periods, periodKey]
  );

  // ── Data ──
  const projectsWithStatus = useMemo(() => {
    if (!projects) return [];

    return projects.map((project) => {
      const totalTasks = project.projectTasks?.length || 0;
      const completedTasks =
        project.projectTasks?.filter((task: any) => task.status === "completed").length || 0;
      const inProgressTasks =
        project.projectTasks?.filter(
          (task: any) => task.status === "in_progress" || task.status === "assigned",
        ).length || 0;
      const pendingTasks =
        project.projectTasks?.filter((task: any) => task.status === "pending").length || 0;
      const cancelledTasks =
        project.projectTasks?.filter((task: any) => task.status === "cancelled").length || 0;

      const validTasks = totalTasks - cancelledTasks;
      const completionPercentage =
        validTasks > 0 ? Math.round((completedTasks / validTasks) * 100) : 0;

      const status = project.status as ProjectStatusType;
      const statusInfo = getStatusInfo(status);
      const progressLevel = getProgressLevel(completionPercentage);

      return {
        ...project,
        status,
        statusInfo,
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        cancelledTasks,
        completionPercentage,
        progressLevel,
      };
    });
  }, [projects]);

  const stats = useMemo(() => {
    const totalProjects = projectsWithStatus.length;
    const statusCounts = (
      ["planning", "active", "paused", "completed", "delivered"] as ProjectStatusType[]
    ).reduce(
      (acc, statusType) => {
        acc[statusType] = projectsWithStatus.filter((p) => p.status === statusType).length;
        return acc;
      },
      {} as Record<ProjectStatusType, number>,
    );

    const taskStats = projectsWithStatus.reduce(
      (acc, p) => {
        acc.pending += p.pendingTasks;
        acc.in_progress += p.inProgressTasks;
        acc.completed += p.completedTasks;
        acc.cancelled += p.cancelledTasks;
        return acc;
      },
      { pending: 0, in_progress: 0, completed: 0, cancelled: 0 }
    );

    return { totalProjects, statusCounts, taskStats };
  }, [projectsWithStatus]);

  const clientProjectsData = useMemo((): ClientProjectsData[] => {
    if (!projects) return [];
    const clientGroups = projects.reduce((acc, project) => {
      const clientId = project.clientId || "no-client";
      const clientName = project.client?.companyName || "Sin cliente asignado";
      if (!acc[clientId]) acc[clientId] = { clientId, clientName, projectCount: 0 };
      acc[clientId].projectCount++;
      return acc;
    }, {} as Record<string, ClientProjectsData>);
    return Object.values(clientGroups).sort((a, b) => b.projectCount - a.projectCount);
  }, [projects]);

  const weeklyChartData = useMemo(
    () => processWeeklyProjectData(projects || [], "createdAt"),
    [projects],
  );

  const monthlyChartData = useMemo(
    () => processMonthlyProjectData(projects || [], "createdAt"),
    [projects],
  );

  // Synthetic closedAt: delivered projects use deliveredAt, completed use completedAt
  const closedProjects = useMemo(
    () =>
      (projects || [])
        .filter((p) =>
          (p.status === "delivered" && !!p.deliveredAt) ||
          (p.status === "completed" && !!p.completedAt),
        )
        .map((p) => ({
          ...p,
          closedAt: p.status === "delivered" ? p.deliveredAt : p.completedAt,
        })),
    [projects],
  );

  const deliveredWeeklyChartData = useMemo(
    () => processWeeklyProjectData(closedProjects, "closedAt" as any),
    [closedProjects],
  );

  const deliveredMonthlyChartData = useMemo(
    () => processMonthlyProjectData(closedProjects, "closedAt" as any),
    [closedProjects],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
            Analytics de Proyectos
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Estado y progreso de todos los proyectos basado en tareas completadas
          </p>
        </div>

        {/* Period selector + PDF export */}
        <div className="flex flex-col gap-2 sm:items-end shrink-0">
          <p className="text-xs text-muted-foreground">Período del reporte</p>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1">
              <Button
                variant={periodMode === "week" ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs px-3"
                onClick={() => handlePeriodModeChange("week")}
              >
                Semana
              </Button>
              <Button
                variant={periodMode === "month" ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs px-3"
                onClick={() => handlePeriodModeChange("month")}
              >
                Mes
              </Button>
            </div>
            <Select value={periodKey} onValueChange={setPeriodKey}>
              <SelectTrigger className="h-8 text-xs w-[160px]">
                <SelectValue placeholder="Seleccionar período" />
              </SelectTrigger>
              <SelectContent>
                {periods.map((p) => (
                  <SelectItem key={p.key} value={p.key} className="text-xs">
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <AnalyticsPdfButton
              projectsWithStatus={projectsWithStatus}
              stats={stats}
              periodMode={periodMode}
              periodKey={periodKey}
              periodLabel={periodLabel}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <ProjectStatusPieChart statusCounts={stats.statusCounts} />
        <ProjectsByClientPieChart clientProjects={clientProjectsData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <TaskCompletionLineChart projects={projectsWithStatus} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <OperarioEvolutionLineChart projects={projectsWithStatus} />
        <OperarioTasksBarChart projects={projectsWithStatus} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <ProjectCreationLineChart
          weeklyChartData={weeklyChartData}
          monthlyChartData={monthlyChartData}
        />
        <ProjectDeliveryLineChart
          deliveredWeeklyChartData={deliveredWeeklyChartData}
          deliveredMonthlyChartData={deliveredMonthlyChartData}
        />
      </div>

      <ProjectProgressGrid filteredProjects={projectsWithStatus} />
    </>
  );
}
