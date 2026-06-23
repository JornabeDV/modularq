"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Truck, ExternalLink } from "lucide-react"
import type { Project } from "@/lib/types"
import { useRentalModules } from "@/hooks/use-rental-modules"

interface ProjectRentalCardProps {
  project: Project
}

export function ProjectRentalCard({ project }: ProjectRentalCardProps) {
  const { modules, loading } = useRentalModules()

  if (project.condition !== "alquiler") return null

  const projectModule = modules.find((m) => m.project_id === project.id)

  const statusLabel: Record<string, string> = {
    available: "Disponible",
    rented: "En Alquiler",
    maintenance: "Mantenimiento",
    retired: "Dado de Baja",
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Truck className="h-4 w-4" />
          Módulo de Alquiler
        </CardTitle>
        {projectModule && (
          <Badge
            variant={
              projectModule.status === "available"
                ? "secondary"
                : projectModule.status === "rented"
                  ? "default"
                  : "outline"
            }
          >
            {statusLabel[projectModule.status] || projectModule.status}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Cargando...</div>
        ) : projectModule ? (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Código</span>
              <span className="font-medium">{projectModule.code}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Estado</span>
              <span className="font-medium">{statusLabel[projectModule.status] || projectModule.status}</span>
            </div>
            {projectModule.current_contract?.client?.company_name && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cliente Actual</span>
                <span className="font-medium">
                  {projectModule.current_contract.client.company_name}
                </span>
              </div>
            )}
            <div className="pt-2">
              <Link href={`/rentals/modules/${projectModule.id}`}>
                <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Ver en Alquileres
                </Badge>
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Este proyecto no tiene un módulo de alquiler registrado.
            <br />
            <Link href="/rentals/modules" className="text-primary hover:underline inline-flex items-center mt-1">
              <ExternalLink className="h-3 w-3 mr-1" />
              Ir a Alquileres para crearlo
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
