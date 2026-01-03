"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Clock, Calendar, MoreHorizontal, Play, Pause, CheckCircle } from "lucide-react"
import type { Task, ProjectTask } from "@/lib/types"

interface TaskCardProps {
  task: ProjectTask
  onStatusChange?: (taskId: string, newStatus: ProjectTask["status"]) => void
}

export function TaskCard({ task, onStatusChange }: TaskCardProps) {
  const operario = null
  const project = null

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default"
      case "in_progress":
        return "default"
      case "pending":
        return "secondary"
      case "cancelled":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "in_progress":
        return <Play className="h-4 w-4 text-blue-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "cancelled":
        return <Pause className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const progressPercentage = task.status === 'completed' ? 100 : (task.progressPercentage || 0)

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Sin fecha"
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <TooltipProvider>
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              {getStatusIcon(task.status)}
              <h3 className="font-semibold text-sm">{task.task?.title}</h3>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusColor(task.status)} className="text-xs">
                {task.status}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="cursor-pointer">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Opciones de tarea</p>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onStatusChange?.(task.id, "in_progress")}>
                Iniciar tarea
              </DropdownMenuItem>
              {task.status === "in_progress" && (
                <DropdownMenuItem onClick={() => onStatusChange?.(task.id, "completed")}>
                  Marcar completada
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onStatusChange?.(task.id, "cancelled")}>Marcar cancelada</DropdownMenuItem>
              <DropdownMenuItem>Editar</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{task.task?.description || 'Sin descripción'}</p>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Progreso</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{task.actualHours || 0}h trabajadas</span>
            <span>{task.task?.estimatedHours || 0}h estimadas</span>
          </div>
        </div>

        {/* Task Details */}
        <div className="space-y-2 text-sm">

          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Inicio: {formatDate(task.startDate)}</span>
            {task.endDate && <span>• Fin: {formatDate(task.endDate)}</span>}
          </div>

          <div className="text-muted-foreground">
            <span className="font-medium">Proyecto:</span> Desconocido
          </div>
        </div>
      </CardContent>
    </Card>
    </TooltipProvider>
  )
}