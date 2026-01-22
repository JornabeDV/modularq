"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { useIsMobile } from "@/hooks/use-mobile";
import { type ChartConfig } from "@/components/ui/chart";

interface ProjectDeliveryLineChartProps {
  deliveredWeeklyChartData: Array<{
    semana: string;
    proyectos: number;
    fecha: string;
  }>;
}

export function ProjectDeliveryLineChart({
  deliveredWeeklyChartData,
}: ProjectDeliveryLineChartProps) {
  const isMobile = useIsMobile();

  const deliveredChartConfig: ChartConfig = {
    proyectos: {
      label: "Proyectos Entregados",
      color: "hsl(var(--chart-1))",
    },
  };

  const displayData =
    isMobile && deliveredWeeklyChartData.length > 12
      ? deliveredWeeklyChartData.slice(-12)
      : deliveredWeeklyChartData;

  return (
    <Card className="max-sm:py-3">
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="text-base sm:text-lg">
          Proyectos Entregados por Semana
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Evolución semanal de proyectos entregados
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:px-6 pb-4 sm:pb-6">
        {displayData.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] sm:h-[300px] text-muted-foreground text-sm">
            <p>No hay datos suficientes para mostrar</p>
          </div>
        ) : (
          <div className="w-full overflow-hidden relative max-w-full">
            <ChartContainer
              config={deliveredChartConfig}
              className="h-[200px] sm:h-[300px] w-full !aspect-auto [&>div]:overflow-hidden [&>div]:max-w-full"
            >
              <LineChart
                data={displayData}
                margin={{
                  top: 5,
                  right: isMobile ? 5 : 10,
                  left: isMobile ? -5 : 0,
                  bottom: isMobile ? 90 : 35,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="semana"
                  angle={isMobile ? -90 : -45}
                  textAnchor={isMobile ? "end" : "end"}
                  height={isMobile ? 80 : 50}
                  interval={displayData.length > 6 ? (isMobile ? 2 : 1) : 0}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: isMobile ? 9 : 10 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  domain={[0, "auto"]}
                  tick={{ fontSize: isMobile ? 8 : 10 }}
                  width={isMobile ? 30 : 40}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => {
                        const itemConfig =
                          deliveredChartConfig[name as keyof typeof deliveredChartConfig];
                        const label = itemConfig?.label || name;
                        return (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs sm:text-sm">
                              {label}
                            </span>
                            <span className="text-foreground font-mono font-medium tabular-nums text-xs sm:text-sm">
                              {typeof value === "number"
                                ? value.toLocaleString()
                                : value}
                            </span>
                          </div>
                        );
                      }}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  type="monotone"
                  dataKey="proyectos"
                  stroke="#a855f7"
                  strokeWidth={isMobile ? 2 : 3}
                  dot={{
                    fill: "#a855f7",
                    r: isMobile ? 3 : 4,
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{
                    r: isMobile ? 5 : 6,
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  connectNulls={false}
                />
              </LineChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
