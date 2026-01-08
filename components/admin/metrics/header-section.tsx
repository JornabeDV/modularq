"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getStatusColor, getStatusText } from "./metrics-helpers";

export function HeaderSection({ project }: { project: any }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="outline" size="sm" className="cursor-pointer">
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Volver</span>
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold truncate">
            {project.name}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Métricas detalladas del proyecto
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 self-start sm:self-auto">
        <div
          className={`w-3 h-3 rounded-full ${getStatusColor(project.status)}`}
        />
        <Badge variant="outline" className="text-xs sm:text-sm">
          {getStatusText(project.status)}
        </Badge>
      </div>
    </div>
  );
}
