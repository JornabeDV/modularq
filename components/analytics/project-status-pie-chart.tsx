"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { useIsMobile } from "@/hooks/use-mobile";
import { chartConfig, statusColors, STATUS_CONFIG, type ProjectStatusType } from "./analytics-config";

interface ProjectStatusPieChartProps {
  statusCounts: Record<ProjectStatusType, number>;
}

export function ProjectStatusPieChart({ statusCounts }: ProjectStatusPieChartProps) {
  const isMobile = useIsMobile();

  const chartData = STATUS_CONFIG.map((config) => ({
    name: config.label,
    value: statusCounts[config.type] || 0,
    fill: statusColors[config.type] || "#64748b",
  }));

  return (
    <Card className="max-sm:py-3">
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="text-base sm:text-lg">
          Distribución Porcentual por Estado
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Porcentaje de proyectos en cada estado del proyecto
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:px-6 pb-4 sm:pb-6">
        <div className="w-full overflow-hidden relative max-w-full">
          <ChartContainer
            config={chartConfig}
            className="h-[200px] sm:h-[300px] w-full !aspect-auto [&>div]:overflow-hidden [&>div]:max-w-full"
          >
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent, value }) => {
                  // Mostrar label solo si hay valor
                  if (value === 0) return "";
                  return `${name}\n${(percent * 100).toFixed(0)}%`;
                }}
                outerRadius={isMobile ? 40 : 60}
                innerRadius={isMobile ? 15 : 20}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartLegend
                content={<ChartLegendContent nameKey="name" />}
                verticalAlign="bottom"
                height={36}
              />
            </PieChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
