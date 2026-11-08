"use client";

import React from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Loader2, Lock, ShieldCheck } from "lucide-react";
import {
  bootstrapOwnerAction,
  loginAction,
  type LoginState,
} from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function Submit({ label, isBootstrap }: { label: string; isBootstrap?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isBootstrap ? (
        <ShieldCheck className="h-4 w-4" />
      ) : (
        <Lock className="h-4 w-4" />
      )}
      {label}
    </Button>
  );
}

export function LoginForm({
  next,
  isFirstRunBootstrap = false,
}: {
  next?: string;
  isFirstRunBootstrap?: boolean;
}) {
  const [loginState, loginFormAction] = useFormState<LoginState, FormData>(
    loginAction,
    {}
  );
  const [bootState, bootFormAction] = useFormState<LoginState, FormData>(
    bootstrapOwnerAction,
    {}
  );

  if (isFirstRunBootstrap) {
    return (
      <form action={bootFormAction} className="space-y-4">
        <div className="rounded-lg border border-border bg-accent/60 p-3 text-xs leading-relaxed text-muted-foreground">
          <strong className="text-foreground">Primera puesta en marcha:</strong>{" "}
          Todavía no existe ninguna cuenta de administración. Define tus
          credenciales de propietaria/o (sin contraseñas por defecto). Una vez
          creada, este asistente se cerrará permanentemente.
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="boot-name">Nombre completo</Label>
          <Input
            id="boot-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Dirección ESPACIO Q"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="boot-email">Email de administración</Label>
          <Input
            id="boot-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="direccion@espacioq.es"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="boot-password">
            Contraseña segura (mín. 12 caracteres)
          </Label>
          <Input
            id="boot-password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
          />
        </div>
        {bootState.error && (
          <p role="alert" className="text-sm text-destructive">
            {bootState.error}
          </p>
        )}
        <Submit label="Crear cuenta propietaria y entrar" isBootstrap />
      </form>
    );
  }

  return (
    <form action={loginFormAction} className="space-y-4">
      <input type="hidden" name="next" value={next || ""} />
      <div className="space-y-1.5">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          name="email"
          type="email"
          autoComplete="username"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="login-password">Contraseña</Label>
        <Input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {loginState.error && (
        <p role="alert" className="text-sm text-destructive">
          {loginState.error}
        </p>
      )}
      <Submit label="Acceder al panel" />
    </form>
  );
}
