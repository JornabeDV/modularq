"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { TrendingUp } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { getOperarioList, processOperarioEvolution } from "./analytics-utils";

interface OperarioEvolutionLineChartProps {
  projects: any[];
}

const chartConfig: ChartConfig = {
  tareas: { label: "Tareas completadas", color: "#a855f7" },
};

export function OperarioEvolutionLineChart({ projects }: OperarioEvolutionLineChartProps) {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<"week" | "month">("month");

  const operarios = useMemo(() => getOperarioList(projects), [projects]);
  const [selectedOperario, setSelectedOperario] = useState<string>("");

  const activeOperario = selectedOperario || operarios[0] || "";

  const data = useMemo(() => {
    if (!activeOperario) return [];
    return processOperarioEvolution(projects, activeOperario, mode);
  }, [projects, activeOperario, mode]);

  const displayData = isMobile && data.length > 12 ? data.slice(-12) : data;

  return (
    <Card className="max-sm:py-3">
      <CardHeader className="pb-3 sm:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
              Evolución por Operario
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">
              Tareas completadas por {mode === "week" ? "semana" : "mes"}
              {activeOperario ? ` — ${activeOperario}` : ""}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={activeOperario}
              onValueChange={setSelectedOperario}
            >
              <SelectTrigger className="h-7 text-xs w-[150px] sm:w-[180px]">
                <SelectValue placeholder="Seleccionar operario" />
              </SelectTrigger>
              <SelectContent>
                {operarios.map(op => (
                  <SelectItem key={op} value={op} className="text-xs">
                    {op}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              <Button
                variant={mode === "week" ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => setMode("week")}
              >
                Semana
              </Button>
              <Button
                variant={mode === "month" ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => setMode("month")}
              >
                Mes
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6 pb-4 sm:pb-6">
        {operarios.length === 0 ? (
          <div className="flex items-center justify-center h-[250px] sm:h-[300px] text-muted-foreground text-sm">
            <p>No hay operarios con tareas registradas</p>
          </div>
        ) : displayData.length === 0 ? (
          <div className="flex items-center justify-center h-[250px] sm:h-[300px] text-muted-foreground text-sm">
            <p>Sin tareas completadas para este operario</p>
          </div>
        ) : (
          <div className="w-full overflow-hidden relative max-w-full">
            <ChartContainer
              config={chartConfig}
              className="h-[250px] sm:h-[300px] w-full !aspect-auto [&>div]:overflow-hidden [&>div]:max-w-full"
            >
              <LineChart
                data={displayData}
                margin={{
                  top: 5,
                  right: isMobile ? 5 : 10,
                  left: isMobile ? -5 : 0,
                  bottom: isMobile ? 70 : 35,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="semana"
                  angle={isMobile ? -90 : -45}
                  textAnchor="end"
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
                        const label = chartConfig[name as keyof typeof chartConfig]?.label ?? name;
                        return (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs sm:text-sm">{label}</span>
                            <span className="text-foreground font-mono font-medium tabular-nums text-xs sm:text-sm">
                              {typeof value === "number" ? value.toLocaleString() : value}
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
                  dataKey="tareas"
                  stroke="#a855f7"
                  strokeWidth={isMobile ? 2 : 3}
                  dot={{ fill: "#a855f7", r: isMobile ? 3 : 4, strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: isMobile ? 5 : 6, strokeWidth: 2, stroke: "#fff" }}
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
