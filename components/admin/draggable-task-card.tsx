"use client"

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GripVertical } from 'lucide-react'
import type { ProjectTask } from '@/lib/types'

interface DraggableTaskCardProps {
  projectTask: ProjectTask
  onUnassign: (projectTaskId: string) => void
  onEdit: (task: ProjectTask) => void
  isDragging?: boolean
  taskNumber?: number
  isReadOnly?: boolean
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
  isReadOnly = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop
}: DraggableTaskCardProps) {
  const [isHovered, setIsHovered] = useState(false)


  return (
    <Card 
      className={`p-4 transition-all duration-200 select-none ${
        isReadOnly 
          ? 'cursor-default' 
          : 'cursor-move'
      } ${
        isDragging 
          ? 'opacity-50 shadow-lg' 
          : isHovered 
            ? 'shadow-md' 
            : 'hover:shadow-sm'
      }`}
      draggable={!isReadOnly}
      onDragStart={!isReadOnly ? (e) => onDragStart?.(e, projectTask.id) : undefined}
      onDragEnd={!isReadOnly ? onDragEnd : undefined}
      onDragOver={!isReadOnly ? onDragOver : undefined}
      onDrop={!isReadOnly ? (e) => onDrop?.(e, projectTask.id) : undefined}
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
            {!isReadOnly && (
              <div className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors">
                <GripVertical className="h-5 w-5" />
              </div>
            )}
            
            {/* Task Info */}
            <div className="flex-1 min-w-0">
              <h5 className="font-medium truncate">{projectTask.task?.title}</h5>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {projectTask.task?.category}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span>{projectTask.task?.estimatedHours}h estimadas</span>
                {projectTask.actualHours > 0 && (
                  <span>{projectTask.actualHours}h reales</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {!isReadOnly ? (
              <>
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
              </>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}