"use client"

import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LayoutDashboard, FolderKanban, Users, FileText, LogOut, Shield, CheckSquare, Building2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"

const navigation = [
  { name: "Proyectos Activos", href: "/projects", icon: FolderKanban },
]

const adminNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Gestión del Personal", href: "/admin/users", icon: Shield },
  { name: "Gestión de Tareas", href: "/admin/tasks", icon: CheckSquare },
  { name: "Gestión de Proyectos", href: "/admin/projects", icon: FolderKanban },
  { name: "Gestión de Clientes", href: "/admin/clients", icon: Building2 },
  { name: "Reportes", href: "/reports", icon: FileText },
]

export function Sidebar() {
  const { user, userProfile, logout } = useAuth()
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r">
      {/* Header - Solo en desktop */}
      <div className="hidden lg:flex h-24 items-center justify-center gap-2 px-6 border-b w-full">
        <Image
          src="/assets/logo.png"
          alt="MODULARQ Logo"
          width={150}
          height={150}
          className="object-contain"
        />
      </div>

      {/* User Info */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {userProfile?.name && typeof userProfile.name === 'string'
                ? userProfile.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                : "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {userProfile?.name || user?.email || "Usuario"}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {userProfile?.role || "Sin rol"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {/* Solo operarios ven "Proyectos Activos" */}
          {userProfile?.role === 'operario' && navigation.map((item) => {
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
          
          {/* Admin Navigation */}
          {userProfile?.role === 'admin' && (
            <>
              {adminNavigation.map((item) => {
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
            </>
          )}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground cursor-pointer"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  )
}
