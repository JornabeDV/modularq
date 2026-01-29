"use client";

import { formatDate } from "@/lib/utils";
import { getProgressColor } from "@/lib/utils/project-utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Calendar, Target, Timer, Users, type LucideIcon } from "lucide-react";
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";
import { SummaryMetrics } from "./types";

type RadialProps = {
  title: string;
  valueLabel: string;
  data: any[];
  config: ChartConfig;
  isMobile: boolean;
  Icon: LucideIcon;
};

export function SummaryCard({
  project,
  metrics,
  taskProgress,
  timeProgress,
  isMobile,
}: {
  project: any;
  metrics: SummaryMetrics;
  taskProgress: number;
  timeProgress: number;
  isMobile: boolean;
}) {
  const taskProgressColor = getProgressColor(taskProgress);
  const timeProgressColor = getProgressColor(timeProgress);

  const taskRadialData = [
    { name: "progreso", value: taskProgress, fill: taskProgressColor },
  ];
  const taskRadialConfig = {
    progreso: { label: "Progreso", color: taskProgressColor },
  } satisfies ChartConfig;

  const timeRadialData = [
    { name: "tiempo", value: timeProgress, fill: timeProgressColor },
  ];
  const timeRadialConfig = {
    tiempo: { label: "Tiempo", color: timeProgressColor },
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Resumen del Proyecto
            </CardTitle>
            <CardDescription>
              Métricas generales y progreso del proyecto
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <SummaryStat label="Total Activas" value={metrics.totalTasks} />
          <SummaryStat
            label="Completadas"
            value={metrics.completedTasks}
            className="text-green-600"
          />
          <SummaryStat
            label="En Progreso"
            value={metrics.inProgressTasks}
            className="text-blue-600"
          />
          <SummaryStat
            label="Pendientes"
            value={metrics.pendingTasks}
            className="text-gray-600"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <RadialCard
            title="Progreso de Tareas"
            valueLabel={`${taskProgress}%`}
            data={taskRadialData}
            config={taskRadialConfig}
            isMobile={isMobile}
            Icon={Target}
          />
          <RadialCard
            title="Tiempo Estimado Completado"
            valueLabel={
              metrics.estimatedHours > 0
                ? `${metrics.completedEstimatedHours}h de ${metrics.estimatedHours}h`
                : "0h de 0h"
            }
            data={timeRadialData}
            config={timeRadialConfig}
            isMobile={isMobile}
            Icon={Timer}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-8 border-t">
          <div className="flex items-center gap-2 text-sm sm:text-base">
            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate">
              {metrics.totalOperarios} operarios asignados
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm sm:text-base">
            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate">
              {metrics.totalSubcontractors} subcontratistas asignados
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm sm:text-base">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate">
              Inicio: {formatDate(project.startDate)}
            </span>
          </div>
          {project.endDate && (
            <div className="flex items-center gap-2 text-sm sm:text-base sm:col-span-2 lg:col-span-1">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">
                Fin: {formatDate(project.endDate)}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryStat({
  label,
  value,
  className = "",
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className="text-center p-3 border rounded-lg">
      <div className={`text-lg sm:text-2xl font-bold ${className}`}>
        {value}
      </div>
      <div className="text-xs sm:text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function RadialCard({
  title,
  valueLabel,
  data,
  config,
  isMobile,
  Icon,
}: RadialProps) {
  const value = data[0]?.value ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
        <span className="flex items-center gap-1 text-sm">
          <Icon className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{title}</span>
        </span>
        <span className="font-semibold text-sm sm:text-base">{valueLabel}</span>
      </div>
      <ChartContainer
        config={config}
        className="aspect-square h-36 sm:h-44 flex-shrink-0 mx-auto"
      >
        <RadialBarChart
          data={data}
          endAngle={90 + value * 3.6}
          innerRadius={isMobile ? 45 : 55}
          outerRadius={isMobile ? 72 : 88}
          startAngle={90}
          width={isMobile ? 144 : 176}
          height={isMobile ? 144 : 176}
        >
          <PolarGrid
            gridType="circle"
            radialLines={false}
            stroke="none"
            className="first:fill-muted last:fill-background"
            polarRadius={isMobile ? [55, 35] : [65, 40]}
          />
          <RadialBar dataKey="value" background cornerRadius={6} />
          <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
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
                          isMobile ? "text-lg" : "text-xl"
                        }`}
                      >
                        {value}%
                      </tspan>
                    </text>
                  );
                }
              }}
            />
          </PolarRadiusAxis>
        </RadialBarChart>
      </ChartContainer>
    </div>
  );
}
