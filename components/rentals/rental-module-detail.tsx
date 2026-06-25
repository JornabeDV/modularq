"use client";

import { useState } from "react";
import Link from "next/link";
import { useRentalModule } from "@/hooks/use-rental-modules";
import { useRentalContracts } from "@/hooks/use-rental-contracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Wrench,
  CheckCircle,
  Truck,
  RotateCcw,
  Phone,
  Mail,
  CalendarIcon,
  PackageOpen,
} from "lucide-react";
import { formatProjectDate } from "@/lib/utils/project-utils";
import { RentalContractForm } from "./rental-contract-form";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

const currentYear = new Date().getFullYear();
const calendarStartMonth = new Date(currentYear, 0, 1);
const calendarEndMonth = new Date(currentYear + 10, 11, 31);

function formatDateLabel(dateString: string) {
  if (!dateString) return null;
  return new Date(dateString + "T00:00:00").toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  available: { label: "Disponible", color: "bg-emerald-100 text-emerald-700" },
  rented: { label: "En Alquiler", color: "bg-blue-100 text-blue-700" },
  maintenance: { label: "Mantenimiento", color: "bg-amber-100 text-amber-700" },
  retired: { label: "Dado de Baja", color: "bg-gray-100 text-gray-700" },
};

const LOCATION_LABELS: Record<string, string> = {
  factory: "Fábrica",
  destination: "En destino",
};

export function RentalModuleDetail({ moduleId }: { moduleId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { module, loading, error, refetch } = useRentalModule(moduleId);
  const { contracts, fetchContracts } = useRentalContracts();
  const [showContractForm, setShowContractForm] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [returnDate, setReturnDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [returnDateOpen, setReturnDateOpen] = useState(false);
  const [returnNotes, setReturnNotes] = useState("");
  const [returning, setReturning] = useState(false);

  if (loading) return <div className="p-6">Cargando...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!module) return <div className="p-6">Módulo no encontrado</div>;

  const statusInfo = STATUS_LABELS[module.status] || {
    label: module.status,
    color: "",
  };
  const activeContract =
    module.current_contract ||
    module.contracts?.find((c: any) => c.status === "active");

  const handleReturn = async () => {
    if (!activeContract) return;
    setReturning(true);
    try {
      const res = await fetch(
        `/api/rental-contracts/${activeContract.id}/return`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            return_date: returnDate
              ? new Date(returnDate).toISOString()
              : new Date().toISOString(),
            return_notes: returnNotes || undefined,
          }),
        },
      );
      if (!res.ok) throw new Error("Error al procesar devolución");
      toast({
        title: "Devolución registrada",
        description: "El módulo volvió a estar disponible",
      });
      setShowReturnDialog(false);
      refetch();
      fetchContracts({ rental_module_id: moduleId });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "No se pudo procesar la devolución",
        variant: "destructive",
      });
    } finally {
      setReturning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer self-start"
          onClick={() => router.push("/rentals/modules")}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">
              {module.name}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              {module.code}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Link
              href={`/rentals/modules/${moduleId}/history`}
              className="w-full sm:w-auto"
            >
              <Button
                variant="outline"
                className="cursor-pointer max-sm:w-full"
              >
                Ver Historial
              </Button>
            </Link>
            {(module.status === "available" ||
              module.status === "maintenance") && (
              <Button
                onClick={() => setShowContractForm(true)}
                className="cursor-pointer max-sm:w-full"
              >
                <Truck className="h-4 w-4 mr-2" />
                Nuevo Alquiler
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Información General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-start gap-2">
              <span className="text-sm text-muted-foreground">Código</span>
              <span className="text-sm font-medium text-right">
                {module.code}
              </span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-sm text-muted-foreground">Estado</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusInfo.color}`}
              >
                {statusInfo.label}
              </span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-sm text-muted-foreground">Ubicación</span>
              <span className="text-sm text-right">
                {LOCATION_LABELS[module.location] || module.location || "—"}
              </span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-sm text-muted-foreground">
                Proyecto Origen
              </span>
              {module.project?.id ? (
                <Link
                  href={`/admin/projects/${module.project.id}`}
                  className="text-sm text-primary hover:underline text-right"
                >
                  {module.project.name}
                </Link>
              ) : (
                <span className="text-sm">—</span>
              )}
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-sm text-muted-foreground">Módulos</span>
              <span className="text-sm">{module.module_count}</span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-sm text-muted-foreground">Dimensiones</span>
              <span className="text-sm text-right">
                {module.height}m × {module.width}m × {module.depth}m
              </span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-sm text-muted-foreground">Modulación</span>
              <span className="text-sm text-right">{module.modulation}</span>
            </div>
            {module.notes && (
              <div className="pt-2 border-t">
                <span className="text-sm text-muted-foreground">Notas</span>
                <p className="text-sm mt-1">{module.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {activeContract ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Contrato Activo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Cliente</p>
                <p className="text-base font-semibold">
                  {activeContract.client?.company_name || "—"}
                </p>
              </div>
              {(activeContract.client?.phone ||
                activeContract.client?.email) && (
                <div className="space-y-1">
                  {activeContract.client?.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      {activeContract.client.phone}
                    </div>
                  )}
                  {activeContract.client?.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      {activeContract.client.email}
                    </div>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Inicio</p>
                  <p className="text-sm">
                    {formatProjectDate(activeContract.start_date)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Finalización</p>
                  <p className="text-sm">
                    {formatProjectDate(activeContract.end_date) || "Sin fecha"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Precio Mensual</p>
                <p className="text-sm font-medium">
                  ${activeContract.monthly_price} {activeContract.currency}
                </p>
              </div>
              {activeContract.delivery_notes && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Notas de entrega
                  </p>
                  <p className="text-sm mt-1">
                    {activeContract.delivery_notes}
                  </p>
                </div>
              )}
              <Button
                className="w-full cursor-pointer"
                variant="outline"
                onClick={() => setShowReturnDialog(true)}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Procesar Devolución
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Sin Contrato Activo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center text-center py-4 sm:py-6">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-muted flex items-center justify-center mb-2 sm:mb-3">
                  <PackageOpen className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">Este módulo está libre</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
                  {module.status === "available" ||
                  module.status === "maintenance"
                    ? "Podés iniciar un nuevo alquiler desde el botón superior."
                    : "El módulo no está disponible para alquilar en este momento."}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {showContractForm && (
        <RentalContractForm
          rentalModuleId={moduleId}
          prefilledClientId={module.project?.client?.id}
          onClose={() => setShowContractForm(false)}
          onSuccess={() => {
            setShowContractForm(false);
            refetch();
            fetchContracts({ rental_module_id: moduleId });
          }}
        />
      )}

      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Procesar Devolución</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="return-date">Fecha de devolución</Label>
              <Popover open={returnDateOpen} onOpenChange={setReturnDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="return-date"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal text-sm",
                      !returnDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDateLabel(returnDate) || "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    captionLayout="dropdown-years"
                    startMonth={calendarStartMonth}
                    endMonth={calendarEndMonth}
                    selected={
                      returnDate
                        ? new Date(returnDate + "T00:00:00")
                        : undefined
                    }
                    onSelect={(date) => {
                      if (date) {
                        setReturnDate(date.toISOString().split("T")[0]);
                        setReturnDateOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="return-notes">Notas de devolución</Label>
              <Input
                id="return-notes"
                placeholder="Estado del módulo, observaciones..."
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                className="cursor-pointer flex-1"
                onClick={() => setShowReturnDialog(false)}
                disabled={returning}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleReturn}
                disabled={returning}
                className="cursor-pointer flex-1 "
              >
                {returning ? "Procesando..." : "Confirmar Devolución"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
