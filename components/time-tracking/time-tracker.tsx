"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, Square, Clock } from "lucide-react"
import { mockTasks, mockProjects } from "@/lib/mock-data"
import type { TimeEntry } from "@/lib/types"

interface TimeTrackerProps {
  operarioId: string
  onTimeEntryCreate?: (entry: Omit<TimeEntry, "id">) => void
}

export function TimeTracker({ operarioId, onTimeEntryCreate }: TimeTrackerProps) {
  const [isTracking, setIsTracking] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [selectedTaskId, setSelectedTaskId] = useState("")
  const [description, setDescription] = useState("")

  // Get tasks assigned to this operario
  const assignedTasks = mockTasks.filter((task) => task.assignedTo === operarioId)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isTracking && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime.getTime())
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTracking, startTime])

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`
  }

  const handleStart = () => {
    if (!selectedTaskId) return

    const now = new Date()
    setStartTime(now)
    setIsTracking(true)
    setElapsedTime(0)
  }

  const handlePause = () => {
    setIsTracking(false)
  }

  const handleStop = () => {
    if (!startTime || !selectedTaskId) return

    const endTime = new Date()
    const hours = elapsedTime / (1000 * 60 * 60)
    const selectedTask = mockTasks.find((t) => t.id === selectedTaskId)

    const timeEntry: Omit<TimeEntry, "id"> = {
      operarioId,
      taskId: selectedTaskId,
      projectId: selectedTask?.projectId || "",
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      hours: Math.round(hours * 100) / 100,
      description: description || "Trabajo registrado",
      date: startTime.toISOString().split("T")[0],
    }

    onTimeEntryCreate?.(timeEntry)

    // Reset state
    setIsTracking(false)
    setStartTime(null)
    setElapsedTime(0)
    setDescription("")
    setSelectedTaskId("")
  }

  const selectedTask = mockTasks.find((t) => t.id === selectedTaskId)
  const selectedProject = selectedTask ? mockProjects.find((p) => p.id === selectedTask.projectId) : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Registro de Tiempo
        </CardTitle>
        <CardDescription>Registra el tiempo trabajado en tus tareas asignadas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Task Selection */}
        <div className="space-y-2">
          <Label htmlFor="task-select">Seleccionar Tarea</Label>
          <Select value={selectedTaskId} onValueChange={setSelectedTaskId} disabled={isTracking}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una tarea" />
            </SelectTrigger>
            <SelectContent>
              {assignedTasks.map((task) => {
                const project = mockProjects.find((p) => p.id === task.projectId)
                return (
                  <SelectItem key={task.id} value={task.id}>
                    <div className="flex flex-col">
                      <span>{task.title}</span>
                      <span className="text-xs text-muted-foreground">{project?.name}</span>
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Selected Task Info */}
        {selectedTask && selectedProject && (
          <div className="p-3 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{selectedProject.name}</Badge>
              <Badge variant={selectedTask.status === "in-progress" ? "default" : "secondary"}>
                {selectedTask.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{selectedTask.description}</p>
          </div>
        )}

        {/* Timer Display */}
        <div className="text-center py-6">
          <div className="text-4xl font-mono font-bold mb-2">{formatTime(elapsedTime)}</div>
          <div className="flex justify-center gap-2">
            {!isTracking && elapsedTime === 0 && (
              <Button onClick={handleStart} disabled={!selectedTaskId} className="gap-2">
                <Play className="h-4 w-4" />
                Iniciar
              </Button>
            )}
            {isTracking && (
              <Button onClick={handlePause} variant="outline" className="gap-2 bg-transparent">
                <Pause className="h-4 w-4" />
                Pausar
              </Button>
            )}
            {!isTracking && elapsedTime > 0 && (
              <>
                <Button onClick={handleStart} variant="outline" className="gap-2 bg-transparent">
                  <Play className="h-4 w-4" />
                  Continuar
                </Button>
                <Button onClick={handleStop} className="gap-2">
                  <Square className="h-4 w-4" />
                  Finalizar
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Descripción del Trabajo (Opcional)</Label>
          <Textarea
            id="description"
            placeholder="Describe el trabajo realizado..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isTracking}
            rows={3}
          />
        </div>

        {/* Manual Time Entry */}
        <div className="pt-4 border-t">
          <Button variant="outline" className="w-full bg-transparent">
            Registrar Tiempo Manual
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
