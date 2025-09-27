"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TaskRow } from './task-row'
import { TaskFilters } from './task-filters'
import type { Task } from '@/lib/types'
import { useUsers } from '@/hooks/use-users'

interface TaskTableProps {
  tasks: Task[]
  searchTerm: string
  onSearchChange: (value: string) => void
  categoryFilter: string
  onCategoryFilterChange: (value: string) => void
  onEditTask: (task: Task) => void
  onDeleteTask: (taskId: string) => void
}

export function TaskTable({
  tasks,
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  onEditTask,
  onDeleteTask
}: TaskTableProps) {
  const { users } = useUsers()
  return (
    <Card>
      <CardHeader>
        <TaskFilters
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={onCategoryFilterChange}
        />
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-background">
                <TableHead className="min-w-[200px]">Tarea</TableHead>
                <TableHead className="text-center min-w-[120px]">Categoría</TableHead>
                <TableHead className="text-center min-w-[100px]">Horas</TableHead>
                <TableHead className="text-center min-w-[120px]">Asignado a</TableHead>
                <TableHead className="text-center min-w-[120px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
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
                    users={users.map(user => ({
                      id: user.id || '',
                      name: user.name || 'Usuario desconocido',
                      role: user.role || 'operario'
                    }))}
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