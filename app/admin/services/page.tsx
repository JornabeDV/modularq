"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit,
  Trash2,
  Wrench,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DialogForm } from "@/components/ui/dialog-form";
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
import { PriceInput } from "@/components/ui/price-input";
import { getExchangeRate, ExchangeRate } from "@/lib/exchange-rate";

interface Service {
  id: string;
  name: string;
  description?: string;
  unit_price: number;
  unit: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ServiceForm {
  name: string;
  description: string;
  unit_price: string;
  unit: string;
  is_active: boolean;
}

const ALLOWED_ROLES = ["admin", "supervisor"];

function formatUSD(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatARS(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(amount);
}

function ServiceFormFields({
  form,
  setForm,
  exchangeRate,
}: {
  form: ServiceForm;
  setForm: React.Dispatch<React.SetStateAction<ServiceForm>>;
  exchangeRate: ExchangeRate | null;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre *</Label>
        <Input
          id="name"
          placeholder="Ej: Transporte especial"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          placeholder="Detalles del servicio..."
          className="text-sm"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unit_price">Precio unitario (USD) *</Label>
          <PriceInput
            id="unit_price"
            placeholder="0"
            value={form.unit_price}
            onChange={(val) => setForm((f) => ({ ...f, unit_price: val }))}
          />
          {exchangeRate && form.unit_price && (
            <p className="text-[10px] sm:text-xs sm:text-sm text-muted-foreground">
              {formatARS((parseFloat(form.unit_price.replace(",", ".")) || 0) * exchangeRate.venta)}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit">Unidad</Label>
          <Input
            id="unit"
            placeholder="unidad, hora, día..."
            value={form.unit}
            onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
          />
        </div>
      </div>
      {/* Estado activo se gestiona desde el listado */}
    </div>
  );
}

export default function ServicesAdminPage() {
  const { userProfile, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);

  const [form, setForm] = useState<ServiceForm>({
    name: "",
    description: "",
    unit_price: "",
    unit: "unidad",
    is_active: true,
  });

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/services?active=false");
      const data = await res.json();
      setServices(data.services ?? []);
    } catch {
      toast({ title: "Error al cargar servicios", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!authLoading && !userProfile) {
      router.push("/login");
      return;
    }
    if (!authLoading && userProfile && !ALLOWED_ROLES.includes(userProfile.role)) {
      router.push("/projects");
    }
  }, [authLoading, userProfile, router]);

  useEffect(() => {
    if (userProfile && ALLOWED_ROLES.includes(userProfile.role)) {
      loadServices();
    }
  }, [userProfile, loadServices]);

  useEffect(() => {
    getExchangeRate().then(setExchangeRate).catch(() => {});
  }, []);

  function resetForm() {
    setForm({
      name: "",
      description: "",
      unit_price: "",
      unit: "unidad",
      is_active: true,
    });
    setEditingService(null);
  }

  function openCreate() {
    resetForm();
    setDialogOpen(true);
  }

  function openEdit(service: Service) {
    setEditingService(service);
    setForm({
      name: service.name,
      description: service.description ?? "",
      unit_price: service.unit_price.toFixed(2).replace(".", ","),
      unit: service.unit,
      is_active: service.is_active,
    });
    setDialogOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.unit_price.trim()) {
      toast({ title: "Nombre y precio son requeridos", variant: "destructive" });
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      unit_price: parseFloat(form.unit_price.replace(",", ".")) || 0,
      unit: form.unit.trim() || "unidad",
      is_active: form.is_active,
    };

    setSaving(true);
    try {
      if (editingService) {
        const res = await fetch(`/api/services/${editingService.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Error al actualizar");
        toast({ title: "Servicio actualizado" });
      } else {
        const res = await fetch("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Error al crear");
        toast({ title: "Servicio creado" });
      }
      setDialogOpen(false);
      resetForm();
      await loadServices();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(service: Service) {
    setServiceToDelete(service);
    setDeleteDialogOpen(true);
  }

  async function handleDelete() {
    if (!serviceToDelete) return;
    try {
      const res = await fetch(`/api/services/${serviceToDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al eliminar");
      toast({ title: "Servicio eliminado" });
      await loadServices();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setServiceToDelete(null);
    }
  }

  async function handleToggleActive(service: Service) {
    try {
      const res = await fetch(`/api/services/${service.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !service.is_active }),
      });
      if (!res.ok) throw new Error("Error al actualizar estado");
      toast({
        title: service.is_active ? "Servicio desactivado" : "Servicio activado",
      });
      await loadServices();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
    }
  }

  if (authLoading || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!ALLOWED_ROLES.includes(userProfile.role)) return null;

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 mx-auto space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Catálogo de Servicios</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Administrá los servicios disponibles para cotizaciones.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo servicio
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : services.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Wrench className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="text-muted-foreground text-sm">
                No hay servicios cargados todavía.
              </p>
              <Button onClick={openCreate} variant="outline" className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Crear servicio
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {services.map((service) => (
              <Card key={service.id} className={!service.is_active ? "opacity-60" : "py-0 md:py-0 h-auto sm:gap-0"}>
                <CardHeader className="py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{service.name}</span>
                        <Badge
                          variant={service.is_active ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {service.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                      {service.description && (
                        <p className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5">
                          {service.description}
                        </p>
                      )}
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        Unidad: {service.unit}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex flex-col items-end mr-auto sm:mr-0">
                        <span className="font-bold tabular-nums text-sm">
                          {formatUSD(service.unit_price)}
                        </span>
                        {exchangeRate && (
                          <span className="text-[10px] text-muted-foreground tabular-nums">
                            {formatARS(service.unit_price * exchangeRate.venta)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="items-center flex">
                              <Switch
                                checked={service.is_active}
                                onCheckedChange={() => handleToggleActive(service)}
                                className="cursor-pointer"
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              {service.is_active ? "Desactivar servicio" : "Activar servicio"}
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="cursor-pointer"
                                onClick={() => openEdit(service)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar servicio</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="cursor-pointer"
                                onClick={() => confirmDelete(service)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Eliminar servicio</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogForm onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle>
              {editingService ? "Editar servicio" : "Nuevo servicio"}
            </DialogTitle>
          </DialogHeader>
          <ServiceFormFields form={form} setForm={setForm} exchangeRate={exchangeRate} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving || !form.name.trim() || !form.unit_price}
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogForm>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar servicio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El servicio{" "}
              <strong>{serviceToDelete?.name}</strong> se eliminará permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
