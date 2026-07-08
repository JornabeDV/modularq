"use client";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  LogOut,
  Shield,
  CheckSquare,
  Building2,
  BarChart3,
  ClipboardList,
  Package,
  ShoppingCart,
  History,
  ChevronLeft,
  ChevronRight,
  Truck,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Proyectos Activos", href: "/projects", icon: FolderKanban },
];

const adminNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    name: "Relevamiento Diario",
    href: "/admin/daily-survey",
    icon: ClipboardList,
  },
  { name: "Gestión del Personal", href: "/admin/users", icon: Shield },
  { name: "Gestión de Tareas", href: "/admin/tasks", icon: CheckSquare },
  { name: "Gestión de Proyectos", href: "/admin/projects", icon: FolderKanban },
  { name: "Gestión de Alquileres", href: "/rentals/modules", icon: Truck },
  { name: "Gestión de Clientes", href: "/admin/clients", icon: Building2 },
  { name: "Gestión de Proveedores", href: "/admin/suppliers", icon: Building2 },
  { name: "Gestión de Stock", href: "/admin/stock", icon: Package },
  { name: "Gestión de Compra", href: "/admin/purchase-management", icon: ShoppingCart },  { name: "Cotizador", href: "/quoter", icon: ShoppingCart },
  { name: "Cotizaciones", href: "/quoter/history", icon: History },
  {
    name: "Módulos Estándar",
    href: "/admin/standard-modules",
    icon: Package,
    adminOnly: true,
  },
  {
    name: "Catálogo de Servicios",
    href: "/admin/services",
    icon: ShoppingCart,
    adminOnly: true,
  },
  { name: "Reportes", href: "/reports", icon: FileText },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

function NavLink({
  href,
  icon: Icon,
  name,
  isActive,
  collapsed,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  isActive: boolean;
  collapsed: boolean;
}) {
  const link = (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
        collapsed ? "justify-center px-2" : "",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-accent",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{name}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{name}</TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, userProfile, logout } = useAuth();
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-card border-r transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header con logo */}
      {!collapsed && (
        <div className="hidden lg:flex h-24 items-center justify-center px-6 border-b shrink-0">
          <Image
            src="/assets/logo.png"
            alt="ModulArq Logo"
            width={150}
            height={150}
            className="object-contain"
          />
        </div>
      )}

      {/* Usuario */}
      <div className={cn("p-3 border-b", collapsed && "flex justify-center")}>
        <div
          className={cn(
            "flex items-center gap-3",
            collapsed && "justify-center",
          )}
        >
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 cursor-default">
                <span className="text-sm font-medium text-primary">
                  {userProfile?.name && typeof userProfile.name === "string"
                    ? userProfile.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()
                    : "U"}
                </span>
              </div>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right">
                {userProfile?.name || user?.email || "Usuario"}
                <br />
                <span className="capitalize text-muted-foreground">
                  {userProfile?.role || "Sin rol"}
                </span>
              </TooltipContent>
            )}
          </Tooltip>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {userProfile?.name || user?.email || "Usuario"}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground capitalize">
                {userProfile?.role || "Sin rol"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-2 overflow-y-auto scrollbar-subtle">
        <ul className="space-y-0.5">
          {userProfile?.role === "operario" &&
            navigation.map((item) => (
              <li key={item.name}>
                <NavLink
                  href={item.href}
                  icon={item.icon}
                  name={item.name}
                  isActive={pathname === item.href}
                  collapsed={collapsed}
                />
              </li>
            ))}

          {userProfile?.role === "vendedor" && (
            <>
              <li key="cotizador">
                <NavLink
                  href="/quoter"
                  icon={ShoppingCart}
                  name="Cotizador"
                  isActive={pathname === "/quoter"}
                  collapsed={collapsed}
                />
              </li>
              <li key="cotizador-historial">
                <NavLink
                  href="/quoter/history"
                  icon={History}
                  name="Cotizaciones"
                  isActive={pathname === "/quoter/history"}
                  collapsed={collapsed}
                />
              </li>
            </>
          )}

          {(userProfile?.role === "admin" ||
            userProfile?.role === "supervisor") && (
            <>
              {adminNavigation
                .filter((item) => {
                  if (
                    "adminOnly" in item &&
                    item.adminOnly &&
                    userProfile?.role !== "admin"
                  ) {
                    return false;
                  }
                  if (
                    item.name === "Gestión del Personal" &&
                    userProfile?.role !== "admin"
                  ) {
                    return false;
                  }
                  return true;
                })
                .map((item) => (
                  <li key={item.name}>
                    <NavLink
                      href={item.href}
                      icon={item.icon}
                      name={item.name}
                      isActive={pathname === item.href}
                      collapsed={collapsed}
                    />
                  </li>
                ))}
            </>
          )}
        </ul>
      </nav>

      {/* Toggle sidebar */}
      <div className={cn("p-2 max-sm:hidden border-t", collapsed && "flex justify-center")}>
        {collapsed ? (
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-foreground cursor-pointer"
                onClick={onToggle}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Expandir</TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={onToggle}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="text-sm">Colapsar menú</span>
          </Button>
        )}
      </div>

      {/* Logout */}
      <div className={cn("p-2 border-t", collapsed && "flex justify-center")}>
        {collapsed ? (
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-foreground cursor-pointer"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Cerrar Sesión</TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </Button>
        )}
      </div>
    </div>
  );
}
