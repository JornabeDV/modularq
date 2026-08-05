"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit,
  Trash2,
  Tag,
  Loader2,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { MainLayout } from "@/components/layout/main-layout";
import { AdminOnly } from "@/components/auth/route-guard";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import {
  useMaterialCategories,
  type MaterialCategory,
} from "@/hooks/use-material-categories";

interface CategoryForm {
  name: string;
  slug: string;
  code_prefix: string;
  order: string;
}

function normalizeForSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function generateCodePrefixFromName(name: string): string {
  const words = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((w) => w.length >= 2);

  if (words.length === 0) return "CAT";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();

  return words
    .map((w) => w[0].toUpperCase())
    .join("")
    .slice(0, 3);
}

function CategoryFormFields({
  form,
  setForm,
  isEditing,
  onRegenerateSlug,
  onRegeneratePrefix,
}: {
  form: CategoryForm;
  setForm: React.Dispatch<React.SetStateAction<CategoryForm>>;
  isEditing: boolean;
  onRegenerateSlug: () => void;
  onRegeneratePrefix: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre *</Label>
        <Input
          id="name"
          placeholder="Ej: Estructura Metálica"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug (identificador) *</Label>
        <div className="flex gap-2">
          <Input
            id="slug"
            placeholder="estructura-metalica"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            className="flex-1"
          />
          {!isEditing && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onRegenerateSlug}
              title="Regenerar slug"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Se usa internamente para referenciar la categoría. No debería cambiar
          una vez en uso.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="code_prefix">Prefijo de código *</Label>
        <div className="flex gap-2">
          <Input
            id="code_prefix"
            placeholder="EME"
            value={form.code_prefix}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                code_prefix: e.target.value.toUpperCase(),
              }))
            }
            className="flex-1"
            maxLength={10}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onRegeneratePrefix}
            title="Regenerar prefijo"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Se usa para generar códigos de materiales (ej: EME-001).
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="order">Orden</Label>
        <Input
          id="order"
          type="number"
          min={0}
          value={form.order}
          onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
        />
      </div>
    </div>
  );
}

export default function MaterialCategoriesAdminPage() {
  const { userProfile, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    restoreCategory,
    refetch,
  } = useMaterialCategories(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<MaterialCategory | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] =
    useState<MaterialCategory | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<CategoryForm>({
    name: "",
    slug: "",
    code_prefix: "",
    order: "0",
  });

  const resetForm = useCallback(() => {
    setForm({
      name: "",
      slug: "",
      code_prefix: "",
      order: "0",
    });
    setEditingCategory(null);
  }, []);

  const regenerateSlug = useCallback(() => {
    setForm((f) => ({ ...f, slug: normalizeForSlug(f.name) }));
  }, []);

  const regeneratePrefix = useCallback(() => {
    setForm((f) => ({ ...f, code_prefix: generateCodePrefixFromName(f.name) }));
  }, []);

  useEffect(() => {
    if (!authLoading && !userProfile) {
      router.push("/login");
      return;
    }
  }, [authLoading, userProfile, router]);

  useEffect(() => {
    if (editingCategory) {
      setForm({
        name: editingCategory.name,
        slug: editingCategory.slug,
        code_prefix: editingCategory.code_prefix,
        order: String(editingCategory.order ?? 0),
      });
    } else {
      resetForm();
    }
  }, [editingCategory, resetForm]);

  useEffect(() => {
    if (!dialogOpen) {
      resetForm();
    }
  }, [dialogOpen, resetForm]);

  // Auto-generar slug y prefijo cuando cambia el nombre en creación
  useEffect(() => {
    if (editingCategory) return;
    setForm((f) => ({
      ...f,
      slug: f.slug || normalizeForSlug(f.name),
      code_prefix: f.code_prefix || generateCodePrefixFromName(f.name),
    }));
  }, [form.name, editingCategory]);

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (category: MaterialCategory) => {
    setEditingCategory(category);
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const slug = form.slug.trim();
    const codePrefix = form.code_prefix.trim().toUpperCase();
    const order = parseInt(form.order, 10) || 0;

    if (!name || !slug || !codePrefix) {
      toast({
        title: "Campos requeridos",
        description: "Nombre, slug y prefijo son obligatorios",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (editingCategory) {
        const result = await updateCategory(editingCategory.id, {
          name,
          slug,
          code_prefix: codePrefix,
          order,
        });
        if (!result.success) throw new Error(result.error);
        toast({ title: "Categoría actualizada" });
      } else {
        const result = await createCategory({
          name,
          slug,
          code_prefix: codePrefix,
          order,
        });
        if (!result.success) throw new Error(result.error);
        toast({ title: "Categoría creada" });
      }
      setDialogOpen(false);
      resetForm();
      await refetch(true);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (category: MaterialCategory) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      const result = await deleteCategory(categoryToDelete.id);
      if (!result.success) throw new Error(result.error);
      toast({ title: "Categoría eliminada" });
      await refetch(true);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleRestore = async (category: MaterialCategory) => {
    try {
      const result = await restoreCategory(category.id);
      if (!result.success) throw new Error(result.error);
      toast({ title: "Categoría reactivada" });
      await refetch(true);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
    }
  };

  if (authLoading || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <AdminOnly>
      <MainLayout>
        <TooltipProvider>
          <div className="p-4 sm:p-6 space-y-3">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/admin/stock")}
                className="cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Volver</span>
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">Categorías de Materiales</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Administrá las categorías disponibles para los materiales.
                </p>
              </div>
              <Button onClick={openCreate} className="cursor-pointer">
                <Plus className="w-4 h-4 mr-2" />
                Nueva categoría
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-destructive">{error}</p>
                </CardContent>
              </Card>
            ) : categories.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Tag className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                  <p className="text-muted-foreground text-sm">
                    No hay categorías cargadas todavía.
                  </p>
                  <Button
                    onClick={openCreate}
                    variant="outline"
                    className="mt-4"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Crear categoría
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {categories.map((category) => (
                  <Card
                    key={category.id}
                    className={
                      category.deleted_at
                        ? "opacity-60"
                        : "py-0 md:py-0 h-auto sm:gap-0"
                    }
                  >
                    <CardHeader className="py-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">
                              {category.name}
                            </span>
                            <Badge
                              variant={
                                category.deleted_at ? "secondary" : "default"
                              }
                              className="text-[10px]"
                            >
                              {category.deleted_at ? "Inactiva" : "Activa"}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs sm:text-sm text-muted-foreground">
                            <span>Slug: {category.slug}</span>
                            <span>Prefijo: {category.code_prefix}</span>
                            <span>Orden: {category.order}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {category.deleted_at ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="cursor-pointer"
                                  onClick={() => handleRestore(category)}
                                >
                                  <RefreshCw className="h-4 w-4 mr-1" />
                                  Reactivar
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                Reactivar categoría
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="cursor-pointer"
                                    onClick={() => openEdit(category)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Editar categoría
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="cursor-pointer"
                                    onClick={() => confirmDelete(category)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Eliminar categoría
                                </TooltipContent>
                              </Tooltip>
                            </>
                          )}
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
            <DialogForm
              onSubmit={handleSave}
              className="h-[100dvh] w-[100dvw] max-w-none rounded-none md:h-auto md:w-full md:max-w-2xl md:rounded-lg"
            >
              <div className="flex flex-1 flex-col gap-4 overflow-y-auto max-sm:mt-12">
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? "Editar categoría" : "Nueva categoría"}
                  </DialogTitle>
                </DialogHeader>
                <CategoryFormFields
                  form={form}
                  setForm={setForm}
                  isEditing={!!editingCategory}
                  onRegenerateSlug={regenerateSlug}
                  onRegeneratePrefix={regeneratePrefix}
                />
              </div>
              <DialogFooter className="max-md:gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="cursor-pointer max-md:order-2 max-md:w-full"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    saving ||
                    !form.name.trim() ||
                    !form.slug.trim() ||
                    !form.code_prefix.trim()
                  }
                  className="cursor-pointer max-md:order-1 max-md:w-full"
                >
                  {saving && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Guardar
                </Button>
              </DialogFooter>
            </DialogForm>
          </Dialog>

          {/* Delete Confirmation */}
          <AlertDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
                <AlertDialogDescription>
                  La categoría <strong>{categoryToDelete?.name}</strong> se
                  marcará como inactiva. Los materiales que la usan conservarán
                  la categoría, pero no se podrá seleccionar en nuevos
                  materiales.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TooltipProvider>
      </MainLayout>
    </AdminOnly>
  );
}
