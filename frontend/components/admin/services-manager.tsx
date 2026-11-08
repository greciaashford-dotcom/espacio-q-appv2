"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteOrDeactivateServiceAction,
  deleteServiceCategoryAction,
  saveServiceAction,
  saveServiceCategoryAction,
} from "@/app/admin/servicios/actions";
import { formatPrice } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
  servicesCount: number;
};

type ServiceItem = {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  durationMin: number;
  bufferBeforeMin: number;
  bufferAfterMin: number;
  priceType: "FIXED" | "FROM" | "CONSULT";
  priceCents: number | null;
  featured: boolean;
  active: boolean;
  imageAssetId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  sortOrder: number;
  professionalsCount: number;
};

type MediaOption = {
  id: string;
  internalName: string;
};

export function ServicesManager({
  categories,
  services,
  mediaAssets,
}: {
  categories: CategoryItem[];
  services: ServiceItem[];
  mediaAssets: MediaOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [catForm, setCatForm] = useState({
    id: "",
    name: "",
    slug: "",
    description: "",
    sortOrder: 0,
    active: true,
  });

  const emptyServiceForm = {
    id: "",
    categoryId: categories[0]?.id ?? "",
    name: "",
    slug: "",
    shortDescription: "",
    description: "",
    durationMin: 45,
    bufferBeforeMin: 0,
    bufferAfterMin: 10,
    priceType: "FIXED" as "FIXED" | "FROM" | "CONSULT",
    priceEuros: "",
    featured: false,
    active: true,
    imageAssetId: "",
    seoTitle: "",
    seoDescription: "",
    sortOrder: 0,
  };

  const [srvForm, setSrvForm] = useState(emptyServiceForm);

  function editService(s: ServiceItem) {
    setSrvForm({
      id: s.id,
      categoryId: s.categoryId,
      name: s.name,
      slug: s.slug,
      shortDescription: s.shortDescription,
      description: s.description,
      durationMin: s.durationMin,
      bufferBeforeMin: s.bufferBeforeMin,
      bufferAfterMin: s.bufferAfterMin,
      priceType: s.priceType,
      priceEuros: s.priceCents !== null ? String((s.priceCents / 100).toFixed(2)) : "",
      featured: s.featured,
      active: s.active,
      imageAssetId: s.imageAssetId ?? "",
      seoTitle: s.seoTitle ?? "",
      seoDescription: s.seoDescription ?? "",
      sortOrder: s.sortOrder,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const res = await saveServiceCategoryAction({
        id: catForm.id || undefined,
        name: catForm.name,
        slug: catForm.slug || undefined,
        description: catForm.description,
        sortOrder: catForm.sortOrder,
        active: catForm.active,
      });
      if (res.ok) {
        setFeedback({ type: "ok", text: "Categoría guardada." });
        setCatForm({ id: "", name: "", slug: "", description: "", sortOrder: 0, active: true });
        router.refresh();
      } else {
        setFeedback({ type: "err", text: res.error ?? "No se pudo guardar la categoría." });
      }
    });
  }

  function handleSaveService(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const res = await saveServiceAction({
        ...srvForm,
        id: srvForm.id || undefined,
        slug: srvForm.slug || undefined,
      });
      if (res.ok) {
        setFeedback({ type: "ok", text: "Servicio guardado y catálogo público actualizado." });
        setSrvForm({ ...emptyServiceForm, categoryId: srvForm.categoryId });
        router.refresh();
      } else {
        setFeedback({ type: "err", text: res.error ?? "No se pudo guardar el servicio." });
      }
    });
  }

  return (
    <div className="space-y-8">
      {feedback && (
        <div
          role="status"
          className={`rounded-lg border px-4 py-3 text-sm ${
            feedback.type === "ok"
              ? "border-success/40 bg-success/10 text-foreground"
              : "border-destructive/40 bg-destructive/10 text-destructive"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Formulario de servicio */}
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{srvForm.id ? "Editar servicio" : "Nuevo servicio"}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Define duración real, buffers de preparación/limpieza y tarifa exacta (o consulta previa).
              </p>
            </div>
            {srvForm.id && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSrvForm(emptyServiceForm)}
              >
                Cancelar edición
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Crea primero al menos una categoría en la columna derecha para poder dar de alta servicios.
              </p>
            ) : (
              <form onSubmit={handleSaveService} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="srv-cat">Categoría</Label>
                    <select
                      id="srv-cat"
                      className="flex h-10 w-full rounded-lg border border-input bg-card px-3 text-sm"
                      value={srvForm.categoryId}
                      onChange={(e) => setSrvForm({ ...srvForm, categoryId: e.target.value })}
                      required
                    >
                      <option value="">Selecciona categoría...</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {!c.active ? "(Inactiva)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="srv-name">Nombre del servicio</Label>
                    <Input
                      id="srv-name"
                      placeholder="Ej. Corte y diseño editorial"
                      value={srvForm.name}
                      onChange={(e) => setSrvForm({ ...srvForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="srv-slug">Slug URL (opcional, autogenerado)</Label>
                    <Input
                      id="srv-slug"
                      placeholder="corte-diseno-editorial"
                      value={srvForm.slug}
                      onChange={(e) => setSrvForm({ ...srvForm, slug: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="srv-img">Imagen asociada (Multimedia)</Label>
                    <select
                      id="srv-img"
                      className="flex h-10 w-full rounded-lg border border-input bg-card px-3 text-sm"
                      value={srvForm.imageAssetId}
                      onChange={(e) => setSrvForm({ ...srvForm, imageAssetId: e.target.value })}
                    >
                      <option value="">— Sin imagen específica —</option>
                      {mediaAssets.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.internalName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="srv-short">Resumen breve (listados y tarjetas)</Label>
                  <Input
                    id="srv-short"
                    value={srvForm.shortDescription}
                    onChange={(e) => setSrvForm({ ...srvForm, shortDescription: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="srv-desc">Descripción detallada</Label>
                  <Textarea
                    id="srv-desc"
                    rows={3}
                    value={srvForm.description}
                    onChange={(e) => setSrvForm({ ...srvForm, description: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                  <div className="space-y-1">
                    <Label htmlFor="srv-dur">Duración (min)</Label>
                    <Input
                      id="srv-dur"
                      type="number"
                      min={5}
                      max={600}
                      step={5}
                      value={srvForm.durationMin}
                      onChange={(e) =>
                        setSrvForm({ ...srvForm, durationMin: Number(e.target.value) })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="srv-pre">Buffer pre (min)</Label>
                    <Input
                      id="srv-pre"
                      type="number"
                      min={0}
                      max={120}
                      step={5}
                      value={srvForm.bufferBeforeMin}
                      onChange={(e) =>
                        setSrvForm({ ...srvForm, bufferBeforeMin: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="srv-post">Buffer post (min)</Label>
                    <Input
                      id="srv-post"
                      type="number"
                      min={0}
                      max={120}
                      step={5}
                      value={srvForm.bufferAfterMin}
                      onChange={(e) =>
                        setSrvForm({ ...srvForm, bufferAfterMin: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="srv-ptype">Tipo de precio</Label>
                    <select
                      id="srv-ptype"
                      className="flex h-10 w-full rounded-lg border border-input bg-card px-2.5 text-sm"
                      value={srvForm.priceType}
                      onChange={(e) =>
                        setSrvForm({
                          ...srvForm,
                          priceType: e.target.value as "FIXED" | "FROM" | "CONSULT",
                        })
                      }
                    >
                      <option value="FIXED">Precio cerrado</option>
                      <option value="FROM">Desde (€)</option>
                      <option value="CONSULT">A consultar</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="srv-price">Importe (€ EUR)</Label>
                    <Input
                      id="srv-price"
                      placeholder="Ej. 45.00"
                      disabled={srvForm.priceType === "CONSULT"}
                      value={srvForm.priceType === "CONSULT" ? "" : srvForm.priceEuros}
                      onChange={(e) => setSrvForm({ ...srvForm, priceEuros: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-3 text-sm">
                  <div className="flex flex-wrap items-center gap-5">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={srvForm.active}
                        onChange={(e) => setSrvForm({ ...srvForm, active: e.target.checked })}
                      />
                      <span>Activo (visible y reservable)</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={srvForm.featured}
                        onChange={(e) => setSrvForm({ ...srvForm, featured: e.target.checked })}
                      />
                      <span>Destacado en portada</span>
                    </label>
                  </div>
                  <Button type="submit" disabled={isPending}>
                    {srvForm.id ? "Actualizar servicio" : "Crear servicio"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Gestión de categorías */}
        <Card>
          <CardHeader>
            <CardTitle>{catForm.id ? "Editar categoría" : "Categorías"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSaveCategory} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="cat-name">Nombre</Label>
                <Input
                  id="cat-name"
                  placeholder="Ej. Cabello y corte"
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cat-desc">Descripción (opcional)</Label>
                <Input
                  id="cat-desc"
                  value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between gap-2 text-xs">
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={catForm.active}
                    onChange={(e) => setCatForm({ ...catForm, active: e.target.checked })}
                  />
                  <span>Activa</span>
                </label>
                <div className="flex gap-2">
                  {catForm.id && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setCatForm({
                          id: "",
                          name: "",
                          slug: "",
                          description: "",
                          sortOrder: 0,
                          active: true,
                        })
                      }
                    >
                      Cancelar
                    </Button>
                  )}
                  <Button type="submit" size="sm" disabled={isPending}>
                    {catForm.id ? "Actualizar" : "Añadir categoría"}
                  </Button>
                </div>
              </div>
            </form>

            <div className="divide-y divide-border border-t border-border pt-3">
              {categories.length === 0 ? (
                <p className="py-3 text-xs text-muted-foreground">Sin categorías creadas todavía.</p>
              ) : (
                categories.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                    <div>
                      <p className="font-medium">
                        {c.name}{" "}
                        <span className="text-xs text-muted-foreground">({c.servicesCount})</span>
                      </p>
                      {!c.active && <Badge variant="secondary">Inactiva</Badge>}
                    </div>
                    <div className="flex gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setCatForm({
                            id: c.id,
                            name: c.name,
                            slug: c.slug,
                            description: c.description ?? "",
                            sortOrder: c.sortOrder,
                            active: c.active,
                          })
                        }
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          startTransition(async () => {
                            const res = await deleteServiceCategoryAction(c.id);
                            if (res.message) setFeedback({ type: "ok", text: res.message });
                            router.refresh();
                          });
                        }}
                      >
                        {c.servicesCount > 0 ? "Desactivar" : "Eliminar"}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Listado del catálogo */}
      <Card>
        <CardHeader>
          <CardTitle>Servicios configurados ({services.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              El catálogo está vacío. Añade categorías y servicios reales del salón; mientras tanto, la web pública muestra el estado honesto «Catálogo en actualización».
            </p>
          ) : (
            <div className="divide-y divide-border">
              {services.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{s.name}</span>
                      <Badge variant="outline">{s.categoryName}</Badge>
                      <Badge variant={s.active ? "success" : "secondary"}>
                        {s.active ? "Activo" : "Inactivo"}
                      </Badge>
                      {s.featured && <Badge variant="warning">Destacado</Badge>}
                      {s.professionalsCount === 0 && (
                        <Badge variant="warning">Sin profesional asignado</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {s.durationMin} min (+{s.bufferBeforeMin}/{s.bufferAfterMin} min buffer) ·{" "}
                      <strong>{formatPrice(s.priceType, s.priceCents)}</strong> ·{" "}
                      {s.professionalsCount} profesional(es) habilitado(s)
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => editService(s)}>
                      Editar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={isPending}
                      onClick={() => {
                        startTransition(async () => {
                          const res = await deleteOrDeactivateServiceAction(s.id);
                          if (res.ok) {
                            setFeedback({
                              type: "ok",
                              text: res.message ?? "Servicio eliminado.",
                            });
                            router.refresh();
                          }
                        });
                      }}
                    >
                      Eliminar / Baja
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
