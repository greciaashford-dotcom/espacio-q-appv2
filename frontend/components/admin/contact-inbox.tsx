"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateContactMessageStatusAction } from "@/app/admin/informes/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type MsgItem = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: string;
  createdAt: string;
};

export function ContactInbox({ messages }: { messages: MsgItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (messages.length === 0) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        No hay consultas recibidas desde el formulario público de contacto.
      </p>
    );
  }

  return (
    <div className="divide-y divide-border">
      {messages.map((m) => (
        <div key={m.id} className="space-y-2 py-3.5 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-medium">{m.name}</span>{" "}
              <span className="text-xs text-muted-foreground">
                · {m.email} {m.phone ? `· ${m.phone}` : ""} ·{" "}
                {new Date(m.createdAt).toLocaleString("es-ES")}
              </span>
            </div>
            <Badge
              variant={
                m.status === "NEW"
                  ? "warning"
                  : m.status === "RESOLVED"
                  ? "success"
                  : "secondary"
              }
            >
              {m.status}
            </Badge>
          </div>
          {m.subject && <p className="text-xs font-medium">Asunto: {m.subject}</p>}
          <p className="whitespace-pre-wrap text-xs text-muted-foreground">{m.message}</p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {m.status !== "IN_PROGRESS" && (
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await updateContactMessageStatusAction(m.id, "IN_PROGRESS");
                    router.refresh();
                  })
                }
              >
                En curso
              </Button>
            )}
            {m.status !== "RESOLVED" && (
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await updateContactMessageStatusAction(m.id, "RESOLVED");
                    router.refresh();
                  })
                }
              >
                Marcar resuelta
              </Button>
            )}
            {m.status !== "ARCHIVED" && (
              <Button
                size="sm"
                variant="ghost"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await updateContactMessageStatusAction(m.id, "ARCHIVED");
                    router.refresh();
                  })
                }
              >
                Archivar
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
