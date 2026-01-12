"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, BarChart3 } from "lucide-react";
import Link from "next/link";
import { getProgressColor } from "@/lib/utils/project-utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  RadialBarChart,
  RadialBar,
  PolarGrid,
  PolarRadiusAxis,
  Label,
} from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { getStatusInfo, type ProjectStatusType } from "./analytics-config";

interface ProjectWithStatus {
  id: string;
  name: string;
  status: ProjectStatusType;
  completionPercentage: number;
  statusInfo: ReturnType<typeof getStatusInfo>;
}

interface ProjectProgressGridProps {
  filteredProjects: ProjectWithStatus[];
}

export function ProjectProgressGrid({
  filteredProjects,
}: ProjectProgressGridProps) {
  const isMobile = useIsMobile();

  return (
    <Card className="max-sm:py-3">
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <FolderKanban className="h-4 w-4 sm:h-5 sm:w-5" />
          Progreso de Proyectos ({filteredProjects.length})
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Estado y progreso de cada proyecto basado en tareas completadas
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <BarChart3 className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium mb-2">
              No se encontraron proyectos
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Intenta ajustar los filtros de búsqueda
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredProjects.map((project) => {
              const statusInfo = project.statusInfo;

              const progressColor = getProgressColor(
                project.completionPercentage
              );

              // Datos para el gráfico radial
              const radialData = [
                {
                  name: "progreso",
                  value: project.completionPercentage,
                  fill: progressColor,
                },
              ];

              const radialChartConfig = {
                progreso: {
                  label: "Progreso",
                  color: progressColor,
                },
              } satisfies ChartConfig;

              return (
                <Link
                  key={project.id}
                  href={`/admin/projects/${project.id}/metrics`}
                  className="block"
                >
                  <Card className="hover:shadow-lg max-sm:gap-2 transition-all cursor-pointer h-full flex flex-col !py-2 sm:!py-6">
                    <CardHeader className="items-start pb-1 sm:pb-2 px-2 sm:px-6 pt-0 sm:pt-0">
                      <Badge
                        variant="outline"
                        className={`${statusInfo.color} border-current text-xs mb-1 sm:mb-2`}
                      >
                        {statusInfo.label}
                      </Badge>
                      <CardTitle className="text-xs sm:text-base line-clamp-2 text-left leading-tight">
                        {project.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 pb-0 sm:pb-0 px-2 sm:px-6">
                      <ChartContainer
                        config={radialChartConfig}
                        className="mx-auto aspect-square max-h-[180px] sm:max-h-[220px]"
                      >
                        <RadialBarChart
                          data={radialData}
                          endAngle={90 + project.completionPercentage * 3.6}
                          innerRadius={isMobile ? 55 : 65}
                          outerRadius={isMobile ? 85 : 100}
                          startAngle={90}
                          width={isMobile ? 180 : 220}
                          height={isMobile ? 180 : 220}
                        >
                          <PolarGrid
                            gridType="circle"
                            radialLines={false}
                            stroke="none"
                            className="first:fill-muted last:fill-background"
                            polarRadius={isMobile ? [60, 50] : [70, 60]}
                          />
                          <RadialBar
                            dataKey="value"
                            background
                            cornerRadius={10}
                          />
                          <PolarRadiusAxis
                            tick={false}
                            tickLine={false}
                            axisLine={false}
                          >
                            <Label
                              content={({ viewBox }) => {
                                if (
                                  viewBox &&
                                  "cx" in viewBox &&
                                  "cy" in viewBox
                                ) {
                                  return (
                                    <text
                                      x={viewBox.cx}
                                      y={viewBox.cy}
                                      textAnchor="middle"
                                      dominantBaseline="middle"
                                    >
                                      <tspan
                                        x={viewBox.cx}
                                        y={viewBox.cy}
                                        className={`fill-foreground font-bold ${
                                          isMobile ? "text-2xl" : "text-3xl"
                                        }`}
                                      >
                                        {project.completionPercentage}%
                                      </tspan>
                                      <tspan
                                        x={viewBox.cx}
                                        y={
                                          (viewBox.cy || 0) +
                                          (isMobile ? 16 : 20)
                                        }
                                        className="fill-muted-foreground text-xs"
                                      >
                                        Completado
                                      </tspan>
                                    </text>
                                  );
                                }
                              }}
                            />
                          </PolarRadiusAxis>
                        </RadialBarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
