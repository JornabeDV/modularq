"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { AdminOnly } from "@/components/auth/route-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Plus, Clock, TrendingUp, FolderOpen } from "lucide-react"
import Link from "next/link"
import { useOperarios } from "@/hooks/use-operarios"
import { useState, useEffect } from "react"

export default function AdminWorkersPage() {
  return (
    <AdminOnly>
      <AdminWorkersContent />
    </AdminOnly>
  )
}

function AdminWorkersContent() {
  const { operarios, loading, error, getOperarioStats } = useOperarios()
  const [operarioStats, setOperarioStats] = useState<Record<string, any>>({})

  // Cargar estadísticas de cada operario
  useEffect(() => {
    const loadStats = async () => {
      const stats: Record<string, any> = {}
      for (const operario of operarios) {
        stats[operario.id!] = await getOperarioStats(operario.id!)
      }
      setOperarioStats(stats)
    }
    
    if (operarios.length > 0) {
      loadStats()
    }
  }, [operarios, getOperarioStats])

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-balance">Rendimiento de Operarios</h1>
            <p className="text-muted-foreground">Métricas y estadísticas de productividad del personal</p>
          </div>          
        </div>       

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando operarios...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-destructive mb-4">Error al cargar operarios: {error}</p>
              <Button onClick={() => window.location.reload()}>
                Reintentar
              </Button>
            </div>
          </div>
        )}

        {/* Operarios Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {operarios.map((operario) => {
              const stats = operarioStats[operario.id!] || { total: 0, completed: 0, inProgress: 0, pending: 0 }
              const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0

            return (
              <Card key={operario.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="text-lg font-semibold">
                        {operario.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{operario.name}</CardTitle>
                      <Badge variant="outline" className="mt-2">
                        {operario.role || 'Sin rol'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Efficiency */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Eficiencia
                      </span>
                      <span className="font-medium">{operario.efficiency || 0}%</span>
                    </div>
                    <Progress value={operario.efficiency || 0} className="h-2" />
                  </div>

                  {/* Task Statistics */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center p-2 bg-muted/50 rounded-lg">
                      <div className="text-lg font-bold text-green-500">{stats.completed}</div>
                      <p className="text-muted-foreground">Completadas</p>
                    </div>
                    <div className="text-center p-2 bg-muted/50 rounded-lg">
                      <div className="text-lg font-bold text-blue-500">{stats.inProgress}</div>
                      <p className="text-muted-foreground">En Progreso</p>
                    </div>
                  </div>


                  {/* Hours and Completion Rate */}
                  <div className="pt-2 border-t space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Horas totales
                      </span>
                      <span className="font-medium">{operario.total_hours || 0}h</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tasa de finalización</span>
                      <span className="font-medium">{Math.round(completionRate)}%</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="w-full bg-transparent">
                        Ver Tareas
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
          </div>
        )}
      </div>
    </MainLayout>
  )
}