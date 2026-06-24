"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Star } from "lucide-react";
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
import { updateMember } from "@/app/actions/members";

/** Al entrar al grupo: preguntar quién sos (sin login) y completar tus datos. */
export function WhoAreYou({
  code,
  members,
}: {
  code: string;
  members: Member[];
}) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<"pick" | "data">("pick");
  const [picked, setPicked] = useState<Member | null>(null);
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

  function choose(m: Member) {
    setCurrentMember(code, m.id);
    setPicked(m);
    setAlias(m.aliasCbu ?? "");
    setPhone(m.phone ?? "");
    setEmail(m.email ?? "");
    setStep("data");
  }

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
      toast.success(`¡Hola, ${picked.name}!`);
      router.refresh();
    } catch {
      toast.error("No se pudieron guardar los datos.");
    } finally {
      // Cierra SIEMPRE (aunque falle la red): nunca queda colgado.
      setSaving(false);
      setVisible(false);
    }
  }

  return (
    <Dialog
      open={visible}
      onOpenChange={(o) => !o && setVisible(false)}
      modal={false}
    >
      <DialogContent className="max-w-sm rounded-2xl" showCloseButton={false}>
        {step === "pick" ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">¿Quién sos?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Elegí tu nombre en este grupo. Sirve para mostrarte qué te toca y
              quién puede editar.
            </p>
            <ul className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto pt-1">
              {members.map((m) => (
                <li key={m.id}>
                  <button
                    onClick={() => choose(m)}
                    className="flex w-full items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left transition active:scale-[0.99]"
                  >
                    <span className="flex size-9 items-center justify-center rounded-full bg-sky font-semibold uppercase">
                      {m.name.slice(0, 1)}
                    </span>
                    <span className="flex-1 font-semibold">{m.name}</span>
                    {m.isAdmin && (
                      <Star className="size-4 fill-[var(--color-gold)] text-[var(--color-gold)]" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setVisible(false)}
              className="pt-1 text-center text-sm text-muted-foreground underline"
            >
              Ver sin elegir
            </button>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">
                Tus datos, {picked?.name}
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Completá tu alias para que te transfieran (opcional).
            </p>
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
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
