"use client"

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, Clock, AlertCircle, GripVertical } from 'lucide-react'
import type { ProjectTask } from '@/lib/types'

interface DraggableTaskCardProps {
  projectTask: ProjectTask
  onUnassign: (projectTaskId: string) => void
  onEdit: (task: ProjectTask) => void
  isDragging?: boolean
  taskNumber?: number
  onDragStart?: (e: React.DragEvent, taskId: string) => void
  onDragEnd?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent, taskId: string) => void
}

export function DraggableTaskCard({
  projectTask,
  onUnassign,
  onEdit,
  isDragging = false,
  taskNumber = 1,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop
}: DraggableTaskCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />
      case 'pending': return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente'
      case 'in_progress': return 'En Progreso'
      case 'completed': return 'Completada'
      case 'cancelled': return 'Cancelada'
      default: return 'Desconocido'
    }
  }

  return (
    <Card 
      className={`p-4 transition-all duration-200 cursor-move select-none ${
        isDragging 
          ? 'opacity-50 scale-95 shadow-lg' 
          : isHovered 
            ? 'shadow-md scale-[1.02]' 
            : 'hover:shadow-sm'
      }`}
      draggable
      onDragStart={(e) => onDragStart?.(e, projectTask.id)}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop?.(e, projectTask.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Task Number */}
            <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
              {taskNumber}
            </div>
            
            {/* Drag Handle */}
            <div className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors">
              <GripVertical className="h-5 w-5" />
            </div>
            
            {/* Status Icon */}
            <div className="flex-shrink-0">
              {getStatusIcon(projectTask.status)}
            </div>
            
            {/* Task Info */}
            <div className="flex-1 min-w-0">
              <h5 className="font-medium truncate">{projectTask.task?.title}</h5>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {projectTask.task?.category}
                </Badge>
                <Badge 
                  variant={projectTask.task?.type === 'standard' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {projectTask.task?.type === 'standard' ? 'Estándar' : 'Personalizada'}
                </Badge>
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(projectTask.status)}`}>
                  {getStatusLabel(projectTask.status)}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span>{projectTask.task?.estimatedHours}h estimadas</span>
                <span>{projectTask.actualHours}h reales</span>
                <span>{projectTask.progressPercentage}% completado</span>
                {projectTask.assignedUser && (
                  <span>Asignado a: {projectTask.assignedUser.name}</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onEdit(projectTask)}
            >
              Editar
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onUnassign(projectTask.id)}
            >
              Desasignar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}