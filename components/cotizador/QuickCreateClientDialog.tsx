"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  useClientsPrisma,
  type Client,
  type CreateClientData,
} from "@/hooks/use-clients-prisma";

interface QuickCreateClientDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (client: Client) => void;
}

export function QuickCreateClientDialog({
  open,
  onClose,
  onCreate,
}: QuickCreateClientDialogProps) {
  const { createClient } = useClientsPrisma();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    cuit: "",
    company_name: "",
    representative: "",
    email: "",
    phone: "",
  });

  function reset() {
    setForm({ cuit: "", company_name: "", representative: "", email: "", phone: "" });
  }

  async function handleSubmit() {
    if (!form.cuit.trim() || !form.company_name.trim()) return;
    setSaving(true);
    try {
      const data: CreateClientData = {
        cuit: form.cuit.trim(),
        company_name: form.company_name.trim(),
        representative: form.representative.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
      };
      const result = await createClient(data);
      if (result.success && result.client) {
        toast({ title: `Cliente "${data.company_name}" creado` });
        onCreate(result.client);
        reset();
        onClose();
      } else {
        toast({ title: result.error ?? "Error al crear cliente", variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo cliente</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">CUIT *</Label>
            <Input
              placeholder="20-12345678-9"
              value={form.cuit}
              onChange={(e) => setForm((f) => ({ ...f, cuit: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Razón Social *</Label>
            <Input
              placeholder="Empresa S.A."
              value={form.company_name}
              onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Contacto</Label>
            <Input
              placeholder="Nombre del contacto"
              value={form.representative}
              onChange={(e) => setForm((f) => ({ ...f, representative: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                placeholder="mail@empresa.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Teléfono</Label>
              <Input
                placeholder="+54 11..."
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !form.cuit.trim() || !form.company_name.trim()}
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Crear cliente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
