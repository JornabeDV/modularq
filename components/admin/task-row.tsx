"use client"

import { TableCell, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, User } from 'lucide-react'
import { DeleteTaskButton } from './delete-task-button'
import type { Task } from '@/lib/types'

interface TaskRowProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  assignedUsers?: Array<{ id: string; name: string; role: string }>
}

export function TaskRow({ 
  task, 
  onEdit, 
  onDelete,
  assignedUsers = []
}: TaskRowProps) {
  const handleEdit = () => {
    onEdit(task)
  }

  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{task.title}</div>
      </TableCell>
      <TableCell className="text-center">
        <Badge variant="secondary">
          {task.category}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <Badge 
          variant={task.type === 'standard' ? 'default' : 'outline'}
          className={task.type === 'standard' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}
        >
          {task.type === 'standard' ? 'Estándar' : 'Personalizada'}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <div className="text-sm">
          <div className="font-medium">{task.estimatedHours}h</div>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div className="text-sm">
          {assignedUsers.length > 0 ? (
            <div className="space-y-1">
              {assignedUsers.map((user, index) => (
                <div key={user.id || index} className="text-xs font-medium">
                  {user.name}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="text-xs">Sin asignar</span>
            </div>
          )}
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