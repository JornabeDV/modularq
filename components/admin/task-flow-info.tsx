"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Info, ArrowRight, CheckCircle, Plus } from 'lucide-react'

export function TaskFlowInfo() {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Flujo de Gestión de Tareas
        </CardTitle>
        <CardDescription>
          Entiende cómo funcionan las tareas estándar y personalizadas en el sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tareas Estándar */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="default">Estándar</Badge>
              <span className="font-medium">Tareas Estándar</span>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Se crean en la sección de Tareas</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-blue-500" />
                <span>Se asignan automáticamente a todos los proyectos nuevos</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Ideales para procesos repetitivos</span>
              </div>
            </div>
          </div>

          {/* Tareas Personalizadas */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Personalizada</Badge>
              <span className="font-medium">Tareas Personalizadas</span>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Se crean en la sección de Tareas</span>
              </div>
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-blue-500" />
                <span>Se asignan manualmente a proyectos específicos</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Ideales para casos únicos</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            <strong>Consejo:</strong> Crea tareas estándar para procesos comunes (ej: "Instalación eléctrica", "Pintura") 
            y tareas personalizadas para casos específicos de cada proyecto.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
