"use client";

import { Card } from "@/components/ui/card";
import { Users, Shield, Wrench } from "lucide-react";

interface UserStatsProps {
  totalUsers: number;
  adminCount: number;
  operarioCount: number;
  subcontractorCount: number;
}

export function UserStats({
  totalUsers,
  adminCount,
  operarioCount,
  subcontractorCount,
}: UserStatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
      <Card className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-bold">{totalUsers}</p>
          </div>
          <Users className="h-4 w-4 text-muted-foreground" />
        </div>
      </Card>

      <Card className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Admins</p>
            <p className="text-lg font-bold">{adminCount}</p>
          </div>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </div>
      </Card>

      <Card className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Operarios</p>
            <p className="text-lg font-bold">{operarioCount}</p>
          </div>
          <Wrench className="h-4 w-4 text-muted-foreground" />
        </div>
      </Card>

      <Card className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Subcontratistas</p>
            <p className="text-lg font-bold">{subcontractorCount}</p>
          </div>
          <Users className="h-4 w-4 text-muted-foreground" />
        </div>
      </Card>
    </div>
  );
}
