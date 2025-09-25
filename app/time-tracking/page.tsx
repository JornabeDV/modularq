"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TimeTracker } from "@/components/time-tracking/time-tracker"
import { TimeEntriesList } from "@/components/time-tracking/time-entries-list"
import { useAuth } from "@/lib/auth-context"
import { mockTimeEntries, mockOperarios } from "@/lib/mock-data"
import { Clock, TrendingUp, Calendar, Users, Download } from "lucide-react"
import type { TimeEntry } from "@/lib/types"

export default function TimeTrackingPage() {
  const { user } = useAuth()
  const [selectedOperario, setSelectedOperario] = useState("all")
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(mockTimeEntries)

  const handleTimeEntryCreate = (entry: Omit<TimeEntry, "id">) => {
    const newEntry: TimeEntry = {
      ...entry,
      id: `time-${Date.now()}`,
    }
    setTimeEntries((prev) => [newEntry, ...prev])
  }

  // Calculate statistics
  const filteredEntries =
    selectedOperario === "all" ? timeEntries : timeEntries.filter((entry) => entry.operarioId === selectedOperario)

  const totalHours = filteredEntries.reduce((sum, entry) => sum + entry.hours, 0)
  const totalEntries = filteredEntries.length
  const averageHoursPerDay = totalEntries > 0 ? totalHours / totalEntries : 0

  // Get today's entries
  const today = new Date().toISOString().split("T")[0]
  const todayEntries = filteredEntries.filter((entry) => entry.date === today)
  const todayHours = todayEntries.reduce((sum, entry) => sum + entry.hours, 0)

  // Get this week's entries
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const weekStartStr = weekStart.toISOString().split("T")[0]

  const weekEntries = filteredEntries.filter((entry) => entry.date >= weekStartStr)
  const weekHours = weekEntries.reduce((sum, entry) => sum + entry.hours, 0)

  const formatHours = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h}h ${m}m`
  }

  // Find current user's operario ID
  const currentOperarioId = mockOperarios.find((op) => op.email === user?.email)?.id || "1"

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-balance">Control de Tiempo</h1>
            <p className="text-muted-foreground">Registra y supervisa el tiempo trabajado en tareas</p>
          </div>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar Reporte
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hoy</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatHours(todayHours)}</div>
              <p className="text-xs text-muted-foreground">{todayEntries.length} registros</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatHours(weekHours)}</div>
              <p className="text-xs text-muted-foreground">{weekEntries.length} registros</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatHours(totalHours)}</div>
              <p className="text-xs text-muted-foreground">{totalEntries} registros totales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio/Día</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatHours(averageHoursPerDay)}</div>
              <p className="text-xs text-muted-foreground">por registro</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Time Tracker */}
          <div className="lg:col-span-1">
            <TimeTracker operarioId={currentOperarioId} onTimeEntryCreate={handleTimeEntryCreate} />
          </div>

          {/* Time Entries */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filter */}
            {user?.role === "admin" || user?.role === "supervisor" ? (
              <Card>
                <CardHeader>
                  <CardTitle>Filtros</CardTitle>
                  <CardDescription>Filtra los registros por operario</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={selectedOperario} onValueChange={setSelectedOperario}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar operario" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los operarios</SelectItem>
                      {mockOperarios.map((operario) => (
                        <SelectItem key={operario.id} value={operario.id}>
                          {operario.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            ) : null}

            {/* Time Entries List */}
            <TimeEntriesList
              operarioId={selectedOperario === "all" ? undefined : selectedOperario}
              showOperario={selectedOperario === "all"}
            />
          </div>
        </div>

        {/* Weekly Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen Semanal</CardTitle>
            <CardDescription>Distribución de horas por operario esta semana</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockOperarios.map((operario) => {
                const operarioWeekEntries = weekEntries.filter((entry) => entry.operarioId === operario.id)
                const operarioWeekHours = operarioWeekEntries.reduce((sum, entry) => sum + entry.hours, 0)
                const percentage = weekHours > 0 ? (operarioWeekHours / weekHours) * 100 : 0

                return (
                  <div key={operario.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {operario.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{operario.name}</p>
                        <p className="text-sm text-muted-foreground">{operario.department}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatHours(operarioWeekHours)}</p>
                      <p className="text-sm text-muted-foreground">{Math.round(percentage)}% del total</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
