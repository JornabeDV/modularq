"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TaskRow } from './task-row'
import { TaskFilters } from './task-filters'
import { useTaskAssignments } from '@/hooks/use-task-assignments'
import type { Task } from '@/lib/types'
import { useUsers } from '@/hooks/use-users'

interface TaskTableProps {
  tasks: Task[]
  searchTerm: string
  onSearchChange: (value: string) => void
  categoryFilter: string
  onCategoryFilterChange: (value: string) => void
  typeFilter: string
  onTypeFilterChange: (value: string) => void
  onEditTask: (task: Task) => void
  onDeleteTask: (taskId: string) => void
}

export function TaskTable({
  tasks,
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  typeFilter,
  onTypeFilterChange,
  onEditTask,
  onDeleteTask
}: TaskTableProps) {
  const { users } = useUsers()
  const { assignments } = useTaskAssignments()

  const getAssignedUsers = (taskId: string) => {
    return assignments
      .filter(a => a.taskId === taskId)
      .map(a => a.user)
      .filter(Boolean) as Array<{ id: string; name: string; role: string }>
  }

  return (
    <Card>
      <CardHeader>
        <TaskFilters
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={onCategoryFilterChange}
          typeFilter={typeFilter}
          onTypeFilterChange={onTypeFilterChange}
        />
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-background">
                <TableHead className="min-w-[200px]">Tarea</TableHead>
                <TableHead className="text-center min-w-[120px]">Categoría</TableHead>
                <TableHead className="text-center min-w-[100px]">Tipo</TableHead>
                <TableHead className="text-center min-w-[100px]">Horas</TableHead>
                <TableHead className="text-center min-w-[150px]">Operarios Asignados</TableHead>
                <TableHead className="text-center min-w-[120px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">
                    No se encontraron tareas
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                    assignedUsers={getAssignedUsers(task.id)}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}