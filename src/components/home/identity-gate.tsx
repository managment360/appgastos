"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getProfile, setProfile, type Profile } from "@/lib/profile";
import { scrollIntoCenter } from "@/lib/utils";

/**
 * "¿Quién sos?" a nivel APP (momento 0). Al entrar sin perfil se abre solo y no
 * se puede cerrar hasta cargar nombre + teléfono. También sirve para editar.
 */
export function IdentityGate({
  open,
  onOpenChange,
  forced = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Onboarding obligatorio: no se puede cerrar sin completar. */
  forced?: boolean;
}) {
  const [name, setName] = useState("");
  const [aliasCbu, setAliasCbu] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Al abrir, precargo lo que ya haya (edición) o vacío (alta).
  useEffect(() => {
    if (open) {
      const p = getProfile();
      setName(p?.name ?? "");
      setAliasCbu(p?.aliasCbu ?? "");
      setPhone(p?.phone ?? "");
      setEmail(p?.email ?? "");
    }
  }, [open]);

  function save() {
    if (!name.trim()) return toast.error("El nombre es obligatorio.");
    if (!phone.trim()) return toast.error("El teléfono es obligatorio.");
    const profile: Profile = {
      name: name.trim(),
      aliasCbu: aliasCbu.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
    };
    setProfile(profile);
    toast.success(`¡Hola, ${profile.name}!`);
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      // En modo forzado se ignora cualquier intento de cerrar.
      onOpenChange={(o) => {
        if (forced && !o) return;
        onOpenChange(o);
      }}
      modal={false}
    >
      <DialogContent
        className="max-w-sm rounded-2xl"
        showCloseButton={!forced}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">
            {forced ? "¿Quién sos?" : "Tus datos"}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {forced
            ? "Cargá tus datos una vez. Se usan para identificarte y sumarte como miembro cuando creás un grupo."
            : "Estos datos te identifican en la app y se usan al crear un grupo."}
        </p>

        <div className="flex flex-col gap-4 pt-1">
          <Field label="Nombre *">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre"
              onFocus={scrollIntoCenter}
              autoCapitalize="words"
              autoFocus
            />
          </Field>
          <Field label="Alias / CBU (para que te transfieran)">
            <Input
              value={aliasCbu}
              onChange={(e) => setAliasCbu(e.target.value)}
              placeholder="ej. juan.mp"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Teléfono *">
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej. 11 5555 5555"
                inputMode="tel"
                onFocus={scrollIntoCenter}
              />
            </Field>
            <Field label="Email">
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="opcional"
                inputMode="email"
              />
            </Field>
          </div>
          <Button size="lg" className="h-12 text-base" onClick={save}>
            {forced ? "Empezar" : "Guardar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
