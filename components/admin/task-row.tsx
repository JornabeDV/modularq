"use client"

import { TableCell, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Trash2 } from 'lucide-react'
import { DeleteTaskButton } from './delete-task-button'
import type { Task } from '@/lib/types'

interface TaskRowProps {
  task: Task
  index: number
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
}

export function TaskRow({ 
  task, 
  index,
  onEdit, 
  onDelete
}: TaskRowProps) {
  const handleEdit = () => {
    onEdit(task)
  }

  return (
    <TableRow>
      <TableCell className="text-center">
        <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
          {index}
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