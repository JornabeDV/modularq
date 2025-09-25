"use client"

import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LayoutDashboard, FolderKanban, Users, Clock, FileText, Settings, LogOut, Factory } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Proyectos", href: "/projects", icon: FolderKanban },
  { name: "Operarios", href: "/operarios", icon: Users },
  { name: "Tiempo", href: "/time-tracking", icon: Clock },
  { name: "Reportes", href: "/reports", icon: FileText },
  { name: "Configuración", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r">
      {/* Header */}
      <div className="flex h-16 items-center gap-2 px-6 border-b">
        <Factory className="h-8 w-8 text-primary" />
        <div>
          <h1 className="font-bold text-lg">Sistema Operarios</h1>
          <p className="text-xs text-muted-foreground">Gestión Industrial</p>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {user?.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  )
}
