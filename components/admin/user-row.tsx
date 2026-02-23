"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableRow, TableCell } from "@/components/ui/table";
import { Edit, Shield, UserCheck, Users, Wrench } from "lucide-react";
import { DeleteUserButton } from "./delete-user-button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type { User } from "@/lib/prisma-typed-service";

interface UserRowProps {
  user: User;
  currentUserId?: string;
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
  onRestore?: (userId: string) => void;
  isReadOnly?: boolean;
  showDeleted?: boolean;
}

export function UserRow({
  user,
  currentUserId,
  onEdit,
  onDelete,
  onRestore,
  isReadOnly = false,
  showDeleted = false,
}: UserRowProps) {
  const isDeleted = !!user.deleted_at;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4" />;
      case "supervisor":
        return <UserCheck className="h-4 w-4" />;
      case "operario":
        return <Wrench className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "supervisor":
        return "default";
      case "operario":
        return "secondary";
      case "subcontratista":
        return "warning";
      default:
        return "secondary";
    }
  };

  const handleEdit = () => {
    onEdit(user);
  };


  return (
    <TooltipProvider>
      <TableRow>
        <TableCell>
          <div
            className={`font-medium ${
              isDeleted ? "line-through text-muted-foreground" : ""
            }`}
          >
            {user.name}
            {isDeleted && (
              <span className="ml-2 text-xs text-red-500">(Eliminado)</span>
            )}
          </div>
        </TableCell>
        <TableCell className="text-center">
          <Badge variant={getRoleColor(user.role)}>
            {getRoleIcon(user.role)}
            <span className="ml-1 capitalize">{user.role}</span>
          </Badge>
        </TableCell>
        <TableCell className="text-center">
          <div className="flex items-center justify-center space-x-2">
            {!isReadOnly && (
              <>
                {!isDeleted && (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleEdit}
                          className="cursor-pointer"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Editar usuario</p>
                      </TooltipContent>
                    </Tooltip>

                    <DeleteUserButton
                      userId={user.id}
                      userName={user.name}
                      currentUserId={currentUserId}
                      onDelete={onDelete}
                    />
                  </>
                )}
              </>
            )}
          </div>
        </TableCell>
      </TableRow>
    </TooltipProvider>
  );
}
