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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Users } from "lucide-react";
import { getAvailablePeriods, processOperariosForPeriod } from "./analytics-utils";

interface OperarioTasksBarChartProps {
  projects: any[];
}

const chartConfig: ChartConfig = {
  tareas: { label: "Tareas completadas", color: "#3b82f6" },
};

export function OperarioTasksBarChart({ projects }: OperarioTasksBarChartProps) {
  const [mode, setMode] = useState<"week" | "month" | "total">("month");

  const periods = useMemo(() => getAvailablePeriods(mode === "total" ? "month" : mode), [mode]);
  const defaultPeriod = periods[periods.length - 1]?.key ?? "";
  const [selectedPeriod, setSelectedPeriod] = useState<string>(defaultPeriod);

  // Reset to latest period when mode changes
  const handleModeChange = (newMode: "week" | "month" | "total") => {
    setMode(newMode);
    if (newMode !== "total") {
      const newPeriods = getAvailablePeriods(newMode);
      setSelectedPeriod(newPeriods[newPeriods.length - 1]?.key ?? "");
    }
  };

  const data = useMemo(
    () => processOperariosForPeriod(projects, mode, selectedPeriod),
    [projects, mode, selectedPeriod]
  );

  const chartHeight = Math.max(180, data.length * 44);

  const periodLabel = useMemo(() => {
    if (mode === "total") return "en total";
    const found = periods.find(p => p.key === selectedPeriod);
    return found ? `— ${found.label}` : "";
  }, [mode, periods, selectedPeriod]);

  return (
    <Card className="max-sm:py-3">
      <CardHeader className="pb-3 sm:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
              Comparación por Período
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">
              Tareas completadas por operario {periodLabel}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1">
              <Button
                variant={mode === "week" ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => handleModeChange("week")}
              >
                Semana
              </Button>
              <Button
                variant={mode === "month" ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => handleModeChange("month")}
              >
                Mes
              </Button>
              <Button
                variant={mode === "total" ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => handleModeChange("total")}
              >
                Total
              </Button>
            </div>
            {mode !== "total" && (
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="h-7 text-xs w-[150px] sm:w-[170px]">
                  <SelectValue placeholder="Seleccionar período" />
                </SelectTrigger>
                <SelectContent>
                  {periods.map(p => (
                    <SelectItem key={p.key} value={p.key} className="text-xs">
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6 pb-4 sm:pb-6">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[180px] text-muted-foreground text-sm">
            <p>Sin tareas completadas en este período</p>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="w-full !aspect-auto"
            style={{ height: chartHeight }}
          >
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 48, left: 8, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                tick={{ fontSize: 10 }}
              />
              <YAxis
                type="category"
                dataKey="operario"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
                width={110}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, _name, item) => (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs">
                          {item.payload.operario}
                        </span>
                        <span className="font-mono font-medium tabular-nums text-xs">
                          {value} tarea{Number(value) !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Bar dataKey="tareas" fill="#3b82f6" radius={[0, 4, 4, 0]} maxBarSize={32}>
                <LabelList
                  dataKey="tareas"
                  position="right"
                  style={{ fontSize: 11, fill: "var(--foreground)", fontWeight: 500 }}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
