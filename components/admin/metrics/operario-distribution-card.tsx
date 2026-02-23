"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { buildOperarioStats } from "./metrics-helpers";

export function OperarioDistributionCard({ project }: { project: any }) {
  const { operarioStatsArray, completedWithoutOperario } =
    buildOperarioStats(project);

  if (operarioStatsArray.length === 0 && completedWithoutOperario === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Distribución por Operario
          </CardTitle>
          <CardDescription>
            Resumen de tareas trabajadas por operario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              No hay operarios trabajando
            </h3>
            <p className="text-muted-foreground">
              Ningún operario ha tomado tareas de este proyecto aún
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Distribución por Operario
        </CardTitle>
        <CardDescription>
          Resumen de tareas trabajadas por operario
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {operarioStatsArray.map((stats: any) => (
            <div
              key={stats.name}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg gap-3"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {stats.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium truncate">{stats.name}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {stats.total} tareas • {stats.totalHours}h estimadas
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                {stats.inProgress > 0 && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-orange-50 text-orange-700 border-orange-200"
                  >
                    {stats.inProgress} en progreso
                  </Badge>
                )}
                {stats.assigned > 0 && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                  >
                    {stats.assigned} asignadas
                  </Badge>
                )}
                {stats.pending > 0 && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200"
                  >
                    {stats.pending} pendientes
                  </Badge>
                )}
                {stats.completed > 0 && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-green-50 text-green-700 border-green-200"
                  >
                    {stats.completed} completadas
                  </Badge>
                )}
              </div>
            </div>
          ))}

          {completedWithoutOperario > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg border-orange-200 bg-orange-50 gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  ⚠️
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-orange-800 truncate">
                    Tareas completadas sin operario
                  </h4>
                  <p className="text-xs sm:text-sm text-orange-600">
                    {completedWithoutOperario} tareas completadas sin asignar a
                    operario
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="text-xs border-orange-300 text-orange-700 self-start sm:self-auto"
              >
                {completedWithoutOperario} sin asignar
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
