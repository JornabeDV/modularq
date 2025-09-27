"use client"

import { TableCell, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Trash2 } from 'lucide-react'
import { DeleteTaskButton } from './delete-task-button'
import type { Task } from '@/lib/types'
import { TASK_PRIORITIES } from '@/lib/constants'

interface TaskRowProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  users?: Array<{ id: string; name: string; role: string }>
}

export function TaskRow({ task, onEdit, onDelete, users = [] }: TaskRowProps) {
  const getPriorityInfo = (priority: string) => {
    const priorityInfo = TASK_PRIORITIES.find(p => p.value === priority)
    return priorityInfo || { value: priority, label: priority, color: 'default' }
  }

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
        <Badge variant={getPriorityInfo(task.priority).color}>
          {getPriorityInfo(task.priority).label}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <div className="text-sm">
          <div className="font-medium">{task.estimatedHours}h</div>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div className="text-sm">
          {task.assignedUsers && task.assignedUsers.length > 0 ? (
            <div className="space-y-1">
              {task.assignedUsers.map((user, index) => (
                <div key={user.id || index}>
                  <div className="font-medium text-xs">
                    {user.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {user.role}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground">Sin asignar</div>
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