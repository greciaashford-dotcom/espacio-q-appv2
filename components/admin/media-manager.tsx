"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Link2,
  Loader2,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  deleteMediaAssetAction,
  updateMediaAssetAction,
} from "@/app/admin/multimedia/actions";

export type MediaAssetItem = {
  id: string;
  internalName: string;
  src: string;
  sourceType: string;
  altText: string;
  caption: string | null;
  category: string;
  focalPointX: number;
  focalPointY: number;
  sortOrder: number;
  authorCredit: string | null;
  licenseNote: string | null;
  isProvisional: boolean;
  publicVisible: boolean;
  usageLabels: string[];
};

const CATEGORIES = [
  "hero",
  "galeria",
  "salon",
  "servicios",
  "equipo",
  "newsletter",
  "og",
];

export function MediaManager({
  assets,
  allowedDomains,
}: {
  assets: MediaAssetItem[];
  allowedDomains: string[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [busyUpload, setBusyUpload] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);
  const [editing, setEditing] = useState<MediaAssetItem | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleFileUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploadMsg(null);
    const fd = new FormData(e.currentTarget);
    setBusyUpload(true);
    try {
      const res = await fetch("/api/v1/admin/media/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUploadMsg({
          type: "error",
          text: data.error || "Error al subir el archivo.",
        });
        return;
      }
      setUploadMsg({
        type: "ok",
        text: "Imagen subida y validada correctamente.",
      });
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } catch {
      setUploadMsg({ type: "error", text: "Error de red al subir la imagen." });
    } finally {
      setBusyUpload(false);
    }
  }

  async function handleExternalUrl(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploadMsg(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      url: String(fd.get("url") || ""),
      internalName: String(fd.get("internalName") || ""),
      altText: String(fd.get("altText") || ""),
      category: String(fd.get("category") || "galeria"),
      licenseNote: String(fd.get("licenseNote") || ""),
      importCopy: fd.get("importCopy") === "on",
    };
    setBusyUpload(true);
    try {
      const res = await fetch("/api/v1/admin/media/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUploadMsg({
          type: "error",
          text: data.error || "URL rechazada.",
        });
        return;
      }
      setUploadMsg({
        type: "ok",
        text: payload.importCopy
          ? "Imagen remota importada al almacenamiento propio."
          : "URL HTTPS referenciada correctamente.",
      });
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } catch {
      setUploadMsg({ type: "error", text: "Error de conexión." });
    } finally {
      setBusyUpload(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Alta de nueva imagen */}
      <div className="rounded-editorial border border-border bg-card p-6 shadow-subtle space-y-5">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={tab === "upload" ? "default" : "outline"}
            onClick={() => setTab("upload")}
          >
            <Upload className="h-4 w-4" /> Subir archivo desde dispositivo
          </Button>
          <Button
            type="button"
            size="sm"
            variant={tab === "url" ? "default" : "outline"}
            onClick={() => setTab("url")}
          >
            <Link2 className="h-4 w-4" /> Añadir mediante URL externa HTTPS
          </Button>
        </div>

        {tab === "upload" ? (
          <form
            onSubmit={handleFileUpload}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="up-file">Archivo (JPG, PNG, WebP, AVIF ≤ 8MB) *</Label>
              <Input
                id="up-file"
                name="file"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="up-name">Nombre interno *</Label>
              <Input
                id="up-name"
                name="internalName"
                placeholder="Ej.: Tocador principal"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="up-alt">Texto alternativo (alt) *</Label>
              <Input
                id="up-alt"
                name="altText"
                placeholder="Descripción accesible"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="up-cat">Categoría</Label>
              <select
                id="up-cat"
                name="category"
                className="min-h-[44px] w-full rounded-lg border border-input bg-card px-3 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3 space-y-1.5">
              <Label htmlFor="up-lic">Autoría / Licencia (opcional)</Label>
              <Input
                id="up-lic"
                name="licenseNote"
                placeholder="Fotografía propia autorizada de ESPACIO Q"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={busyUpload} className="w-full">
                {busyUpload ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Subir imagen
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleExternalUrl} className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Dominios HTTPS autorizados: <code>{allowedDomains.join(", ")}</code>
              . Protegido frente a SSRF (se rechazan IPs privadas, localhost,
              redirecciones y SVG).
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="ext-url">URL HTTPS directa de imagen *</Label>
                <Input
                  id="ext-url"
                  name="url"
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ext-name">Nombre interno *</Label>
                <Input id="ext-name" name="internalName" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ext-alt">Texto alternativo (alt) *</Label>
                <Input id="ext-alt" name="altText" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ext-cat">Categoría</Label>
                <select
                  id="ext-cat"
                  name="category"
                  className="min-h-[44px] w-full rounded-lg border border-input bg-card px-3 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="ext-lic">Autoría / Licencia</Label>
                <Input id="ext-lic" name="licenseNote" />
              </div>
              <div className="flex items-center gap-2 pt-4">
                <input
                  id="ext-import"
                  name="importCopy"
                  type="checkbox"
                  className="h-4 w-4"
                />
                <Label htmlFor="ext-import" className="text-xs font-normal">
                  Importar copia al almacenamiento propio
                </Label>
              </div>
            </div>
            <Button type="submit" disabled={busyUpload}>
              {busyUpload ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
              Validar y añadir URL
            </Button>
          </form>
        )}

        {uploadMsg && (
          <p
            role="status"
            className={
              uploadMsg.type === "ok"
                ? "text-sm text-success"
                : "text-sm text-destructive"
            }
          >
            {uploadMsg.text}
          </p>
        )}
      </div>

      {/* Editor de metadatos de imagen seleccionada */}
      {editing && (
        <div className="rounded-editorial border border-primary bg-card p-6 shadow-editorial space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl">
              Editar metadatos: {editing.internalName}
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditing(null)}
            >
              Cerrar
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Nombre interno</Label>
              <Input
                value={editing.internalName}
                onChange={(e) =>
                  setEditing({ ...editing, internalName: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Texto alternativo (alt)</Label>
              <Input
                value={editing.altText}
                onChange={(e) =>
                  setEditing({ ...editing, altText: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Categoría</Label>
              <select
                value={editing.category}
                onChange={(e) =>
                  setEditing({ ...editing, category: e.target.value })
                }
                className="min-h-[44px] w-full rounded-lg border border-input bg-card px-3 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Punto focal X (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={editing.focalPointX}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    focalPointX: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Punto focal Y (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={editing.focalPointY}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    focalPointY: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Orden</Label>
              <Input
                type="number"
                min={0}
                value={editing.sortOrder}
                onChange={(e) =>
                  setEditing({ ...editing, sortOrder: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Pie de foto (caption)</Label>
              <Input
                value={editing.caption || ""}
                onChange={(e) =>
                  setEditing({ ...editing, caption: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nota de licencia / autoría</Label>
              <Input
                value={editing.licenseNote || ""}
                onChange={(e) =>
                  setEditing({ ...editing, licenseNote: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editing.publicVisible}
                onChange={(e) =>
                  setEditing({ ...editing, publicVisible: e.target.checked })
                }
                className="h-4 w-4"
              />
              Visible en galería pública
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editing.isProvisional}
                onChange={(e) =>
                  setEditing({ ...editing, isProvisional: e.target.checked })
                }
                className="h-4 w-4"
              />
              Marcada como provisional de maquetación
            </label>
          </div>

          <Button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await updateMediaAssetAction({
                  id: editing.id,
                  internalName: editing.internalName,
                  altText: editing.altText,
                  caption: editing.caption || "",
                  category: editing.category,
                  focalPointX: editing.focalPointX,
                  focalPointY: editing.focalPointY,
                  sortOrder: editing.sortOrder,
                  authorCredit: editing.authorCredit || "",
                  licenseNote: editing.licenseNote || "",
                  isProvisional: editing.isProvisional,
                  publicVisible: editing.publicVisible,
                });
                if (!res.ok) {
                  setUploadMsg({ type: "error", text: res.error || "Error" });
                } else {
                  setEditing(null);
                  router.refresh();
                }
              })
            }
          >
            <Save className="h-4 w-4" /> Guardar cambios
          </Button>
        </div>
      )}

      {/* Cuadrícula de activos multimedia */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {assets.map((asset) => (
          <article
            key={asset.id}
            className="flex flex-col justify-between overflow-hidden rounded-editorial border border-border bg-card shadow-subtle"
          >
            <div>
              <div className="relative aspect-[4/5] bg-secondary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset.src}
                  alt={asset.altText}
                  className="h-full w-full object-cover"
                  style={{
                    objectPosition: `${asset.focalPointX}% ${asset.focalPointY}%`,
                  }}
                />
                <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                  <Badge variant="secondary">{asset.category}</Badge>
                  {asset.isProvisional && (
                    <Badge variant="warning">Provisional</Badge>
                  )}
                  {!asset.publicVisible && (
                    <Badge variant="outline">Oculta</Badge>
                  )}
                </div>
              </div>
              <div className="space-y-1.5 p-4 text-xs">
                <p className="font-semibold text-sm text-foreground">
                  {asset.internalName}
                </p>
                <p className="text-muted-foreground line-clamp-2">
                  Alt: {asset.altText}
                </p>
                {asset.usageLabels.length > 0 && (
                  <p className="text-[11px] font-medium text-foreground">
                    En uso: {asset.usageLabels.join(" · ")}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-border p-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditing(asset)}
              >
                Editar
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => {
                  if (
                    !window.confirm(
                      `¿Eliminar "${asset.internalName}" de la biblioteca?`
                    )
                  )
                    return;
                  startTransition(async () => {
                    const res = await deleteMediaAssetAction(asset.id);
                    if (!res.ok) {
                      window.alert(res.error);
                    } else {
                      router.refresh();
                    }
                  });
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
