"use client"

import { useState } from 'react'
import { TableCell, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, GripVertical } from 'lucide-react'
import { DeleteTaskButton } from './delete-task-button'
import type { Task } from '@/lib/types'

interface DraggableTaskRowProps {
  task: Task
  index: number
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  isDragging?: boolean
  isReordering?: boolean
  onDragStart?: (e: React.DragEvent, taskId: string) => void
  onDragEnd?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent, taskId: string) => void
}

export function DraggableTaskRow({ 
  task, 
  index,
  onEdit, 
  onDelete,
  isDragging = false,
  isReordering = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop
}: DraggableTaskRowProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleEdit = () => {
    onEdit(task)
  }

  return (
    <TableRow 
      className={`transition-all duration-200 select-none ${
        isDragging 
          ? 'opacity-50 shadow-lg' 
          : isReordering
            ? 'opacity-75'
            : isHovered 
              ? 'shadow-md' 
              : 'hover:shadow-sm'
      }`}
      draggable
      onDragStart={(e) => onDragStart?.(e, task.id)}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop?.(e, task.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
          <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
            {index}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="font-medium">{task.title}</div>
      </TableCell>
      <TableCell className="text-center">
        <Badge variant="secondary">
          {task.category}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <Badge variant={task.type === 'standard' ? 'default' : 'outline'}>
          {task.type === 'standard' ? 'Estándar' : 'Personalizada'}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <div className="text-sm">
          <div className="font-medium">{task.estimatedHours}hs</div>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <DeleteTaskButton
            taskId={task.id}
            taskTitle={task.title}
            onDelete={onDelete}
          />
        </div>
      </TableCell>
    </TableRow>
  )
}