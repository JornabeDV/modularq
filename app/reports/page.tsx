"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { AdminOnly } from "@/components/auth/route-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductivityReport } from "@/components/reports/productivity-report"
import { AuditLogComponent } from "@/components/reports/audit-log"
import { FileText, TrendingUp, Activity, Download, Calendar, BarChart3 } from "lucide-react"

export default function ReportsPage() {
  return (
    <AdminOnly>
      <ReportsContent />
    </AdminOnly>
  )
}

function ReportsContent() {
  const [selectedDateRange, setSelectedDateRange] = useState("last-30-days")

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-balance">Reportes y Auditoría</h1>
            <p className="text-muted-foreground">Análisis detallado del rendimiento y actividad del sistema</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Programar Reporte
            </Button>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Exportar Todo
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-sm text-muted-foreground">Reportes Generados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">87%</div>
                  <p className="text-sm text-muted-foreground">Eficiencia Promedio</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold">156</div>
                  <p className="text-sm text-muted-foreground">Eventos de Auditoría</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-orange-500" />
                <div>
                  <div className="text-2xl font-bold">324h</div>
                  <p className="text-sm text-muted-foreground">Horas Analizadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="productivity" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="productivity" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Productividad
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Auditoría
            </TabsTrigger>
            <TabsTrigger value="time-analysis" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Análisis de Tiempo
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reportes Personalizados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="productivity" className="space-y-6">
            <ProductivityReport />
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <AuditLogComponent />
          </TabsContent>

          <TabsContent value="time-analysis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Análisis de Tiempo</CardTitle>
                <CardDescription>Análisis detallado del uso del tiempo por operario y proyecto</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Análisis de Tiempo</h3>
                  <p className="text-muted-foreground mb-4">
                    Visualización avanzada de patrones de tiempo y productividad
                  </p>
                  <Button>Generar Análisis</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="custom" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Reportes Personalizados</CardTitle>
                <CardDescription>Crea reportes específicos según tus necesidades</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <TrendingUp className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Reporte de Rendimiento</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Análisis detallado del rendimiento por operario
                      </p>
                      <Button variant="outline" size="sm">
                        Crear Reporte
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <BarChart3 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Análisis de Proyectos</h3>
                      <p className="text-sm text-muted-foreground mb-4">Estado y progreso de todos los proyectos</p>
                      <Button variant="outline" size="sm">
                        Crear Reporte
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <Activity className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Reporte de Actividad</h3>
                      <p className="text-sm text-muted-foreground mb-4">Resumen de actividades por período</p>
                      <Button variant="outline" size="sm">
                        Crear Reporte
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <FileText className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Reporte Ejecutivo</h3>
                      <p className="text-sm text-muted-foreground mb-4">Resumen ejecutivo para la dirección</p>
                      <Button variant="outline" size="sm">
                        Crear Reporte
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <Calendar className="h-12 w-12 text-red-500 mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Reporte Mensual</h3>
                      <p className="text-sm text-muted-foreground mb-4">Resumen mensual automatizado</p>
                      <Button variant="outline" size="sm">
                        Crear Reporte
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-lg transition-shadow border-dashed">
                    <CardContent className="p-6 text-center">
                      <div className="h-12 w-12 border-2 border-dashed border-muted-foreground rounded-lg flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl text-muted-foreground">+</span>
                      </div>
                      <h3 className="font-semibold mb-2">Reporte Personalizado</h3>
                      <p className="text-sm text-muted-foreground mb-4">Crea tu propio reporte desde cero</p>
                      <Button variant="outline" size="sm">
                        Crear Nuevo
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
