"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Clock, Calendar, MoreHorizontal, Play, Pause, CheckCircle } from "lucide-react"
import type { Task } from "@/lib/types"

interface TaskCardProps {
  task: Task
  onStatusChange?: (taskId: string, newStatus: Task["status"]) => void
}

export function TaskCard({ task, onStatusChange }: TaskCardProps) {
  const operario = null
  const project = null

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default"
      case "in-progress":
        return "default"
      case "pending":
        return "secondary"
      case "blocked":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "destructive"
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "secondary"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "in-progress":
        return <Play className="h-4 w-4 text-blue-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "blocked":
        return <Pause className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const progressPercentage = task.estimatedHours > 0 ? Math.min((task.actualHours / task.estimatedHours) * 100, 100) : 0

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Sin fecha"
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              {getStatusIcon(task.status)}
              <h3 className="font-semibold text-sm">{task.title}</h3>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusColor(task.status)} className="text-xs">
                {task.status}
              </Badge>
              <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                {task.priority}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onStatusChange?.(task.id, "in-progress")}>
                Iniciar tarea
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange?.(task.id, "completed")}>
                Marcar completada
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange?.(task.id, "blocked")}>Marcar bloqueada</DropdownMenuItem>
              <DropdownMenuItem>Editar</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{task.description}</p>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Progreso</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{task.actualHours}h trabajadas</span>
            <span>{task.estimatedHours}h estimadas</span>
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
            <span className="font-medium">Proyecto:</span> {project?.name || "Desconocido"}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}