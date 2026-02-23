"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";
import type { Project } from "@/lib/types";

interface ProjectSpecsProps {
  project: Project;
}

export function ProjectSpecs({ project }: ProjectSpecsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Especificaciones Técnicas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Modulación
            </Label>
            <p className="text-sm font-medium">{project.modulation}</p>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Medidas
            </Label>
            <p className="text-sm font-medium">
              <span className="text-muted-foreground">Alto:</span>{" "}
              {project.height}m •
              <span className="text-muted-foreground"> Ancho:</span>{" "}
              {project.width}m •
              <span className="text-muted-foreground"> Profundidad:</span>{" "}
              {project.depth}m
            </p>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Módulos
            </Label>
            <p className="text-sm font-medium">{project.moduleCount} módulos</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
