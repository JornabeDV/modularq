"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PieChart, Pie, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { useIsMobile } from "@/hooks/use-mobile";

export interface ClientProjectsData {
  clientName: string;
  projectCount: number;
  clientId?: string;
}

interface ProjectsByClientPieChartProps {
  clientProjects: ClientProjectsData[];
}

const CLIENT_COLORS = [
  "#3b82f6", // Azul
  "#22c55e", // Verde
  "#f59e0b", // Ámbar
  "#ef4444", // Rojo
  "#a855f7", // Púrpura
  "#06b6d4", // Cyan
  "#84cc16", // Lime
  "#f97316", // Orange
  "#ec4899", // Pink
  "#6b7280", // Gray
];

export function ProjectsByClientPieChart({
  clientProjects,
}: ProjectsByClientPieChartProps) {
  const isMobile = useIsMobile();

  const chartData = clientProjects.map((client, index) => ({
    name: client.clientName || "Sin cliente",
    value: client.projectCount,
    fill: CLIENT_COLORS[index % CLIENT_COLORS.length],
  }));

  const chartConfig = clientProjects.reduce(
    (config, client, index) => {
      config[client.clientId || `client-${index}`] = {
        label: client.clientName || "Sin cliente",
        color: CLIENT_COLORS[index % CLIENT_COLORS.length],
      };
      return config;
    },
    {} as Record<string, { label: string; color: string }>,
  );

  return (
    <Card className="max-sm:py-3">
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="text-base sm:text-lg">
          Proyectos por Cliente
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Distribución de proyectos entre diferentes clientes
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
            </PieChart>
          </ChartContainer>
        </div>
      </CardContent>

      <div className="px-2 sm:px-6 pb-4 sm:pb-6">
        <div className="text-xs sm:text-sm text-muted-foreground mb-3">
          <strong>Clientes y proyectos:</strong>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {chartData.map((client, index) => (
            <div key={client.name} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: client.fill }}
              />
              <span className="text-xs sm:text-sm">
                <span className="font-medium">{client.name}</span>
                <span className="text-muted-foreground ml-1">
                  ({client.value} proyecto{client.value !== 1 ? "s" : ""})
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
