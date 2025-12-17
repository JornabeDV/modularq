"use client"

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TableCell, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Edit, Eye, GripVertical } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { DeleteProjectButton } from './delete-project-button'
import { getStatusInfo } from '@/lib/utils/project-utils'
import type { Project } from '@/lib/types'

interface DraggableProjectRowProps {
  project: Project
  index: number
  onEdit: (project: Project) => void
  onDelete: (projectId: string) => void
  onStatusChange?: (projectId: string, newStatus: string) => Promise<void>
  isDragging?: boolean
  onDragStart?: (e: React.DragEvent, projectId: string) => void
  onDragEnd?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent, projectId: string) => void
  isReadOnly?: boolean
}

export function DraggableProjectRow({ 
  project, 
  index,
  onEdit, 
  onDelete,
  onStatusChange,
  isDragging = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  isReadOnly = false
}: DraggableProjectRowProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const router = useRouter()

  const handleRowClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const isDragHandle = target.closest('[data-drag-handle]')
    const isActionButton = target.closest('[data-action-button]')
    const isLink = target.closest('a')
    const isSelect = target.closest('[data-status-select]')
    
    if (isDragHandle || isActionButton || isLink || isSelect) {
      return
    }
    
    router.push(`/admin/projects/${project.id}`)
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!onStatusChange || isUpdatingStatus) return
    
    setIsUpdatingStatus(true)
    try {
      await onStatusChange(project.id, newStatus)
    } catch (error) {
      console.error('Error updating project status:', error)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleEdit = () => {
    onEdit(project)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Sin fecha'
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Calcular progreso del proyecto basado en tareas completadas
  const calculateProgress = () => {
    const totalTasks = project.projectTasks.length
    if (totalTasks === 0) return 0
    
    const completedTasks = project.projectTasks.filter(task => task.status === 'completed').length
    return Math.round((completedTasks / totalTasks) * 100)
  }

  const progress = calculateProgress()

  return (
    <TooltipProvider>
    <TableRow 
      className={`transition-all duration-200 select-none cursor-pointer ${
        isDragging 
          ? 'opacity-50 shadow-lg' 
          : isHovered 
            ? 'shadow-md' 
            : isReadOnly 
              ? 'hover:!bg-background' 
              : 'hover:shadow-sm'
      }`}
      style={isReadOnly ? { backgroundColor: 'transparent' } : undefined}
      draggable={!isReadOnly}
      onDragStart={(e) => !isReadOnly && onDragStart?.(e, project.id)}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={(e) => !isReadOnly && onDrop?.(e, project.id)}
      onMouseEnter={() => !isReadOnly && setIsHovered(true)}
      onMouseLeave={() => !isReadOnly && setIsHovered(false)}
      onClick={handleRowClick}
    >
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-2">
          {!isReadOnly && (
            <GripVertical 
              className="h-4 w-4 text-muted-foreground cursor-move" 
              data-drag-handle
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
            {index}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium">{project.name}</div>
          <div className="text-sm text-muted-foreground mt-1 hidden sm:block">
            {project.description.length > 80 
              ? `${project.description.substring(0, 80)}...` 
              : project.description
            }
          </div>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div className="text-sm">
          <div className="font-medium">
            {project.client?.companyName || 'Sin cliente'}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
        {project.status === 'completed' && !isReadOnly && onStatusChange ? (
          <Select
            value={project.status}
            onValueChange={handleStatusChange}
            disabled={isUpdatingStatus}
            data-status-select
          >
            <SelectTrigger className="w-[140px] h-7 text-xs" data-status-select>
              <SelectValue />
            </SelectTrigger>
            <SelectContent data-status-select>
              <SelectItem value="completed">Completado</SelectItem>
              <SelectItem value="delivered">Entregado</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Badge variant={getStatusInfo(project.status).color}>
            {getStatusInfo(project.status).label}
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-center">
        <Badge variant={project.condition === 'alquiler' ? 'default' : 'outline'}>
          {project.condition === 'alquiler' ? 'Alquiler' : 'Venta'}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <div className="text-sm">
          <div className="font-medium">{formatDate(project.startDate)}</div>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div className="text-sm">
          <div className="font-medium">{formatDate(project.endDate)}</div>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div className="text-sm">
          <div className="font-medium">{progress}%</div>
        </div>
      </TableCell>
      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center space-x-2" data-action-button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={`/admin/projects/${project.id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  data-action-button
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ver detalles del proyecto</p>
            </TooltipContent>
          </Tooltip>
          
          {!isReadOnly && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                    className="cursor-pointer"
                    data-action-button
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Editar proyecto</p>
                </TooltipContent>
              </Tooltip>
              
              {project.status !== 'active' && (
                <div data-action-button>
                  <DeleteProjectButton
                    projectId={project.id}
                    projectName={project.name}
                    onDelete={onDelete}
                  />
                </div>
              )}
            </>
        )}
        </div>
      </TableCell>
    </TableRow>
    </TooltipProvider>
  )
}