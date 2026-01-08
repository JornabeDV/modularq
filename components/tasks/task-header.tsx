"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { getStatusIcon, getStatusLabel } from "@/lib/utils/status-label";

interface TaskHeaderProps {
  task: {
    task?: {
      title?: string;
      description?: string;
    };
    status: string;
  };
  onBack: () => void;
}

export function TaskHeader({ task, onBack }: TaskHeaderProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "in_progress":
        return "default";
      case "pending":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button
          variant="outline"
          size="lg"
          onClick={onBack}
          className="shrink-0 text-lg px-6 py-3 cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Volver a Mis Tareas
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl sm:text-4xl font-bold text-balance">
            {task.task?.title}
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mt-2">
            {task.task?.description}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {getStatusIcon(task.status)}
        <Badge
          variant={getStatusColor(task.status)}
          className="text-lg px-4 py-2"
        >
          {getStatusLabel(task.status)}
        </Badge>
      </div>
    </div>
  );
}
