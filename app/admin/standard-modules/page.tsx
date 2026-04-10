"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit,
  Trash2,
  Package,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import {
  useStandardModules,
  StandardModule,
} from "@/hooks/use-standard-modules";
import { StandardModuleDetail } from "@/components/cotizador/StandardModuleDetail";

interface ModuleForm {
  name: string;
  description: string;
  base_price: string;
  order: string;
}

function ModuleFormFields({
  form,
  setForm,
}: {
  form: ModuleForm;
  setForm: React.Dispatch<React.SetStateAction<ModuleForm>>;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre *</Label>
        <Input
          id="name"
          placeholder="Ej: Planta Libre"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          placeholder="Descripción del módulo..."
          className="text-sm"
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="base_price">Precio base ($)</Label>
          <Input
            id="base_price"
            type="number"
            min="0"
            placeholder="0"
            value={form.base_price}
            onChange={(e) =>
              setForm((f) => ({ ...f, base_price: e.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="order">Orden de visualización</Label>
          <Input
            id="order"
            type="number"
            min="0"
            placeholder="0"
            value={form.order}
            onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
          />
        </div>
      </div>
    </div>
  );
}

export default function StandardModulesPage() {
  const { modules, loading, reload, createModule, updateModule, patchModule, deleteModule } =
    useStandardModules();
  const { toast } = useToast();
  const { userProfile, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [createOpen, setCreateOpen] = useState(false);
  const [editModule, setEditModule] = useState<StandardModule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StandardModule | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    base_price: "",
    order: "",
  });

  useEffect(() => {
    if (
      !authLoading &&
      userProfile &&
      !["admin", "supervisor"].includes(userProfile.role)
    ) {
      router.push("/dashboard");
    }
  }, [authLoading, userProfile, router]);

  if (authLoading || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!["admin", "supervisor"].includes(userProfile.role)) {
    return null;
  }

  function resetForm() {
    setForm({ name: "", description: "", base_price: "", order: "" });
  }

  function openCreate() {
    resetForm();
    setCreateOpen(true);
  }

  function openEdit(mod: StandardModule) {
    setForm({
      name: mod.name,
      description: mod.description ?? "",
      base_price: mod.base_price.toString(),
      order: mod.order.toString(),
    });
    setEditModule(mod);
  }

  async function handleCreate() {
    try {
      await createModule({
        name: form.name,
        description: form.description || undefined,
        base_price: parseFloat(form.base_price) || 0,
        order: parseInt(form.order) || 0,
      });
      setCreateOpen(false);
      resetForm();
      toast({ title: "Módulo creado correctamente" });
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Error al crear módulo",
        variant: "destructive",
      });
    }
  }

  async function handleEdit() {
    if (!editModule) return;
    try {
      await updateModule(editModule.id, {
        name: form.name,
        description: form.description || undefined,
        base_price: parseFloat(form.base_price) || 0,
        order: parseInt(form.order) || 0,
      });
      setEditModule(null);
      resetForm();
      toast({ title: "Módulo actualizado correctamente" });
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Error al actualizar módulo",
        variant: "destructive",
      });
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteModule(deleteTarget.id);
      setDeleteTarget(null);
      toast({ title: "Módulo eliminado" });
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Error al eliminar módulo",
        variant: "destructive",
      });
    }
  }

  async function handleToggleActive(mod: StandardModule) {
    try {
      await patchModule(mod.id, { is_active: !mod.is_active });
      toast({
        title: mod.is_active ? "Módulo desactivado" : "Módulo activado",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      });
    }
  }

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 mx-auto space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Módulos Estándar</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Configurá los módulos que se usan como base al crear cotizaciones.
            </p>
          </div>
          <Button onClick={openCreate} className="cursor-pointer">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo módulo
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Cargando módulos...
          </div>
        ) : modules.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-40" />
              <p className="text-muted-foreground">
                No hay módulos estándar creados.
              </p>
              <Button onClick={openCreate} variant="outline" className="mt-4 cursor-pointer">
                <Plus className="w-4 h-4 mr-2" />
                Crear el primero
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {modules.map((mod) => (
              <Card key={mod.id} className={!mod.is_active ? "opacity-60" : "py-0 md:py-0 h-auto sm:gap-0"}>
                <CardHeader
                  className="py-4 cursor-pointer select-none"
                  onClick={() =>
                    setExpandedId(expandedId === mod.id ? null : mod.id)
                  }
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                    {/* Title + badge + description */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <ChevronDown
                        className={`mt-0.5 w-4 h-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                          expandedId === mod.id ? "rotate-180" : ""
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-base">{mod.name}</CardTitle>
                          <Badge variant={mod.is_active ? "default" : "secondary"}>
                            {mod.is_active ? "Activo" : "Inactivo"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {mod.materials.length} materiales ·{" "}
                            {mod.attachments.length} adjuntos
                          </span>
                        </div>
                        {mod.description && (
                          <p className="text-sm text-muted-foreground mt-1 truncate">
                            {mod.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Price + actions */}
                    <div
                      className="flex items-center gap-2 pl-7 sm:pl-0 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-sm font-semibold tabular-nums mr-auto sm:mr-0">
                        {new Intl.NumberFormat("es-AR", {
                          style: "currency",
                          currency: "ARS",
                          minimumFractionDigits: 0,
                        }).format(mod.base_price)}
                      </span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="items-center flex">
                            <Switch
                              checked={mod.is_active}
                              onCheckedChange={() => handleToggleActive(mod)}
                              className="cursor-pointer"
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            {mod.is_active ? "Desactivar módulo" : "Activar módulo"}
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="cursor-pointer"
                              onClick={() => openEdit(mod)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar módulo</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="cursor-pointer"
                              onClick={() => setDeleteTarget(mod)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Eliminar módulo</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </CardHeader>

                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    expandedId === mod.id
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <CardContent className="pt-0 pb-4">
                      <StandardModuleDetail
                        module={mod}
                        onRefresh={reload}
                        onSaveDescription={(sections) =>
                          patchModule(mod.id, { module_description: sections })
                        }
                      />
                    </CardContent>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog crear */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="h-[100dvh] w-[100dvw] max-w-none rounded-none md:h-auto md:w-full md:max-w-2xl md:rounded-lg">
            <DialogHeader>
              <DialogTitle>Nuevo módulo estándar</DialogTitle>
            </DialogHeader>
            <ModuleFormFields form={form} setForm={setForm} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)} className="cursor-pointer max-md:order-2">
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={!form.name.trim()} className="cursor-pointer max-md:order-1">
                Crear módulo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog editar */}
        <Dialog
          open={!!editModule}
          onOpenChange={(o) => !o && setEditModule(null)}
        >
          <DialogContent className="h-[100dvh] w-[100dvw] max-w-none rounded-none md:h-auto md:w-full md:max-w-2xl md:rounded-lg">
            <DialogHeader>
              <DialogTitle>Editar módulo</DialogTitle>
            </DialogHeader>
            <ModuleFormFields form={form} setForm={setForm} />
            <DialogFooter className="max-md:gap-4">
              <Button variant="outline" className="cursor-pointer max-md:order-2" onClick={() => setEditModule(null)}>
                Cancelar
              </Button>
              <Button onClick={handleEdit} className="cursor-pointer max-md:order-1" disabled={!form.name.trim()}>
                Guardar cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirm delete */}
        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={(o) => !o && setDeleteTarget(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar módulo?</AlertDialogTitle>
              <AlertDialogDescription>
                Se eliminará <strong>{deleteTarget?.name}</strong> junto con
                todos sus materiales y archivos adjuntos. Esta acción no se
                puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}                
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
