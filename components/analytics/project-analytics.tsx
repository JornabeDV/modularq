"use client";

import { useState, useMemo } from "react";
import { BarChart3 } from "lucide-react";
import { useProjectsPrisma } from "@/hooks/use-projects-prisma";
import { useIsMobile } from "@/hooks/use-mobile";
import { ProjectStatusPieChart } from "./project-status-pie-chart";
import { ProjectCreationLineChart } from "./project-creation-line-chart";
import { ProjectDeliveryLineChart } from "./project-delivery-line-chart";
import { ProjectProgressGrid } from "./project-progress-grid";
import { processWeeklyProjectData, getProgressLevel } from "./analytics-utils";
import { getStatusInfo, type ProjectStatusType } from "./analytics-config";

export function ProjectAnalytics() {
  const { projects, loading } = useProjectsPrisma();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatusType | "all">(
    "active"
  );
  const isMobile = useIsMobile();

  const projectsWithStatus = useMemo(() => {
    if (!projects) return [];

    return projects.map((project) => {
      const totalTasks = project.projectTasks?.length || 0;
      const completedTasks =
        project.projectTasks?.filter((task: any) => task.status === "completed")
          .length || 0;
      const inProgressTasks =
        project.projectTasks?.filter(
          (task: any) =>
            task.status === "in_progress" || task.status === "assigned"
        ).length || 0;
      const pendingTasks =
        project.projectTasks?.filter((task: any) => task.status === "pending")
          .length || 0;

      const completionPercentage =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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
        completionPercentage,
        progressLevel,
      };
    });
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projectsWithStatus.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.client?.companyName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || project.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [projectsWithStatus, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const totalProjects = projectsWithStatus.length;
    const statusCounts = (
      [
        "planning",
        "active",
        "paused",
        "completed",
        "delivered",
      ] as ProjectStatusType[]
    ).reduce((acc, statusType) => {
      acc[statusType] = projectsWithStatus.filter(
        (p) => p.status === statusType
      ).length;
      return acc;
    }, {} as Record<ProjectStatusType, number>);

    const totalTasks = projectsWithStatus.reduce(
      (sum, p) => sum + p.totalTasks,
      0
    );
    const totalCompletedTasks = projectsWithStatus.reduce(
      (sum, p) => sum + p.completedTasks,
      0
    );
    const averageCompletion =
      totalProjects > 0
        ? Math.round(
            projectsWithStatus.reduce(
              (sum, p) => sum + p.completionPercentage,
              0
            ) / totalProjects
          )
        : 0;

    const activeProjects = projectsWithStatus.filter(
      (p) => p.status === "active"
    );
    const activeProjectsAverage =
      activeProjects.length > 0
        ? Math.round(
            activeProjects.reduce((sum, p) => sum + p.completionPercentage, 0) /
              activeProjects.length
          )
        : 0;

    return {
      totalProjects,
      statusCounts,
      totalTasks,
      totalCompletedTasks,
      averageCompletion,
      activeProjectsAverage,
      activeProjectsCount: activeProjects.length,
    };
  }, [projectsWithStatus]);

  const weeklyChartData = useMemo(
    () => processWeeklyProjectData(projects || [], "createdAt"),
    [projects]
  );

  const deliveredWeeklyChartData = useMemo(
    () =>
      processWeeklyProjectData(
        projects || [],
        "updatedAt",
        (p: any) => p.status === "delivered"
      ),
    [projects]
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
            Analytics de Proyectos
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Estado y progreso de todos los proyectos basado en tareas
            completadas
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-6">
        <ProjectStatusPieChart statusCounts={stats.statusCounts} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <ProjectCreationLineChart weeklyChartData={weeklyChartData} />
        <ProjectDeliveryLineChart
          deliveredWeeklyChartData={deliveredWeeklyChartData}
        />
      </div>

      <ProjectProgressGrid filteredProjects={filteredProjects} />
    </>
  );
}
