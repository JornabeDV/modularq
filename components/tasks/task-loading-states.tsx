"use client"

import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface TaskLoadingStatesProps {
  state: 'loading' | 'not-found' | 'access-denied'
  onBackToProject?: () => void
  onBackToProjects?: () => void
}

export function TaskLoadingStates({ state, onBackToProject, onBackToProjects }: TaskLoadingStatesProps) {
  if (state === 'loading') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando tarea...</p>
        </div>
      </div>
    )
  }

  if (state === 'not-found') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive">Tarea no encontrada</h2>
          <p className="text-muted-foreground mt-2">La tarea solicitada no existe</p>
          {onBackToProject && (
            <Button 
              onClick={onBackToProject} 
              className="mt-4 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Proyecto
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (state === 'access-denied') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive">Acceso Denegado</h2>
          <p className="text-muted-foreground mt-2">No tienes acceso a esta tarea</p>
          {onBackToProjects && (
            <Button 
              onClick={onBackToProjects} 
              className="mt-4 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a Proyectos
            </Button>
          )}
        </div>
      </div>
    )
  }

  return null
}