"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Star, Check, UserPlus } from "lucide-react";
import type { Member } from "@/db/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrentMember, setCurrentMember } from "@/lib/current-member";
import { getProfile, setProfile } from "@/lib/profile";
import { updateMember, addMember, claimMember } from "@/app/actions/members";
import { cn, scrollIntoCenter } from "@/lib/utils";

/**
 * Al entrar al grupo: "¿Quién sos?" (sin login). Cada miembro es un LUGAR:
 *  - los ya tomados aparecen en gris y bloqueados (una persona por lugar),
 *  - los admins muestran su pastilla,
 *  - al ocupar tu lugar, ese nombre pasa a ser tu identidad global (si no tenías).
 * También podés sumarte si no estás en la lista.
 */
export function WhoAreYou({
  code,
  members,
}: {
  code: string;
  members: Member[];
}) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<"pick" | "data" | "new">("pick");
  const [picked, setPicked] = useState<Member | null>(null);
  const [name, setName] = useState("");
  const [alias, setAlias] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  // Mostrar solo si todavía no dijiste quién sos en este dispositivo.
  useEffect(() => {
    if (members.length > 0 && getCurrentMember(code) === null) {
      setVisible(true);
    }
  }, [code, members.length]);

  // Elegir un lugar de la lista.
  async function choose(m: Member) {
    if (m.claimed || saving) return;
    setSaving(true);
    try {
      const res = await claimMember({ code, memberId: m.id });
      if (!res.ok) {
        toast.error("Ese lugar ya fue tomado por otra persona.");
        router.refresh(); // refresca la lista (queda en gris)
        return;
      }
      setCurrentMember(code, m.id);
      const p = getProfile();
      setPicked(m);
      setAlias(m.aliasCbu ?? p?.aliasCbu ?? "");
      setPhone(m.phone ?? p?.phone ?? "");
      setEmail(m.email ?? p?.email ?? "");
      setStep("data");
    } catch {
      toast.error("No se pudo entrar. Probá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  // Guardar tus datos en el miembro + fijar identidad global (Q1).
  async function saveData() {
    if (!picked) return;
    setSaving(true);
    try {
      await updateMember({
        id: picked.id,
        groupCode: code,
        name: picked.name,
        phone,
        email,
        aliasCbu: alias,
      });
      // El nombre del grupo es tu identidad: si no tenías perfil, se crea acá.
      if (!getProfile()) {
        setProfile({
          name: picked.name,
          aliasCbu: alias || undefined,
          phone: phone || undefined,
          email: email || undefined,
        });
      }
      toast.success(`¡Hola, ${picked.name}!`);
      router.refresh();
    } catch {
      toast.error("No se pudieron guardar los datos.");
    } finally {
      setSaving(false);
      setVisible(false);
    }
  }

  // Sumarse si no estás en la lista (nuevo integrante, no admin).
  async function addSelf() {
    if (!name.trim()) return toast.error("Poné tu nombre.");
    setSaving(true);
    try {
      const res = await addMember({
        groupCode: code,
        name: name.trim(),
        aliasCbu: alias,
        phone,
        email,
        claimed: true,
      });
      setCurrentMember(code, res.id);
      if (!getProfile()) {
        setProfile({
          name: name.trim(),
          aliasCbu: alias || undefined,
          phone: phone || undefined,
          email: email || undefined,
        });
      }
      toast.success(`¡Listo, ${name.trim()}!`);
      router.refresh();
    } catch {
      toast.error("No se pudo sumar.");
    } finally {
      setSaving(false);
      setVisible(false);
    }
  }

  function goToNew() {
    const p = getProfile();
    setName(p?.name ?? "");
    setAlias(p?.aliasCbu ?? "");
    setPhone(p?.phone ?? "");
    setEmail(p?.email ?? "");
    setStep("new");
  }

  return (
    <Dialog
      open={visible}
      onOpenChange={(o) => !o && setVisible(false)}
      modal={false}
    >
      <DialogContent className="max-w-sm rounded-2xl" showCloseButton={false}>
        {step === "pick" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">¿Quién sos?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Elegí tu lugar en el grupo. Los que ya ingresaron aparecen en gris.
            </p>
            <ul className="flex max-h-[46vh] flex-col gap-2 overflow-y-auto pt-1">
              {members.map((m) => {
                const taken = m.claimed;
                return (
                  <li key={m.id}>
                    <button
                      onClick={() => choose(m)}
                      disabled={taken || saving}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left transition",
                        taken
                          ? "cursor-not-allowed opacity-50"
                          : "active:scale-[0.99]"
                      )}
                    >
                      <span className="flex size-9 items-center justify-center rounded-full bg-sky font-semibold uppercase">
                        {m.name.slice(0, 1)}
                      </span>
                      <span className="flex-1 truncate font-semibold">
                        {m.name}
                      </span>
                      {m.isAdmin && (
                        <span className="flex items-center gap-0.5 rounded-full bg-[var(--color-gold-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-gold)]">
                          <Star className="size-3 fill-current" /> admin
                        </span>
                      )}
                      {taken && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Check className="size-3.5" /> ya ingresó
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            <button
              onClick={goToNew}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed py-2.5 text-sm font-medium text-muted-foreground transition active:bg-muted"
            >
              <UserPlus className="size-4" /> No estoy en la lista, sumarme
            </button>
            <button
              onClick={() => setVisible(false)}
              className="text-center text-sm text-muted-foreground underline"
            >
              Ver sin elegir
            </button>
          </>
        )}

        {step === "data" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">
                Tus datos, {picked?.name}
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Completá tu alias para que te transfieran (opcional).
            </p>
            <DataFields
              alias={alias}
              setAlias={setAlias}
              phone={phone}
              setPhone={setPhone}
              email={email}
              setEmail={setEmail}
            />
            <Button
              size="lg"
              className="h-12 text-base"
              disabled={saving}
              onClick={saveData}
            >
              {saving ? "Guardando…" : "Listo"}
            </Button>
            <button
              onClick={() => setVisible(false)}
              className="text-center text-sm text-muted-foreground underline"
            >
              Completar después
            </button>
          </>
        )}

        {step === "new" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Sumarte al grupo</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Entrás como integrante nuevo. Este nombre es con el que te van a ver.
            </p>
            <div className="flex flex-col gap-1.5">
              <Label>Nombre *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                onFocus={scrollIntoCenter}
                autoCapitalize="words"
                autoFocus
              />
            </div>
            <DataFields
              alias={alias}
              setAlias={setAlias}
              phone={phone}
              setPhone={setPhone}
              email={email}
              setEmail={setEmail}
            />
            <Button
              size="lg"
              className="h-12 text-base"
              disabled={saving}
              onClick={addSelf}
            >
              {saving ? "Sumándote…" : "Sumarme al grupo"}
            </Button>
            <button
              onClick={() => setStep("pick")}
              className="text-center text-sm text-muted-foreground underline"
            >
              Volver a la lista
            </button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DataFields({
  alias,
  setAlias,
  phone,
  setPhone,
  email,
  setEmail,
}: {
  alias: string;
  setAlias: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 pt-1">
      <div className="flex flex-col gap-1.5">
        <Label>Alias / CBU</Label>
        <Input
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          placeholder="ej. juan.mp"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Teléfono</Label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            placeholder="opcional"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Email</Label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            inputMode="email"
            placeholder="opcional"
          />
        </div>
      </div>
    </div>
  );
}
