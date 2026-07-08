"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, Plus, Star, Camera } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CURRENCIES } from "@/lib/currencies";
import { createGroup } from "@/app/actions/groups";
import { rememberGroup } from "@/lib/recent-groups";
import { cn, scrollIntoCenter } from "@/lib/utils";
import { fileToResizedDataUrl } from "@/lib/image";

type Step = "form" | "confirm-empty" | "confirm-ready";

export function CreateGroupSheet({ trigger }: { trigger: ReactElement }) {
  const router = useRouter();
  const memberRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [currency, setCurrency] = useState("ARS");
  const [memberInput, setMemberInput] = useState("");
  const [memberList, setMemberList] = useState<
    { name: string; isAdmin: boolean }[]
  >([]);
  const [step, setStep] = useState<Step>("form");
  const [saving, setSaving] = useState(false);

  // Campos vacíos en cada apertura.
  useEffect(() => {
    if (open) {
      setName("");
      setPhoto(null);
      setCurrency("ARS");
      setMemberInput("");
      setMemberList([]);
      setStep("form");
      const id = setTimeout(() => {
        const el = document.querySelector(
          '[data-slot="sheet-content"]'
        ) as HTMLElement | null;
        el?.scrollTo({ top: 0 });
        const active = document.activeElement as HTMLElement | null;
        if (active && el?.contains(active)) active.blur();
      }, 60);
      return () => clearTimeout(id);
    }
  }, [open]);

  async function onPickFile(file: File | undefined) {
    if (!file) return;
    try {
      setPhoto(await fileToResizedDataUrl(file, 1000, 0.72));
    } catch {
      toast.error("No se pudo procesar la imagen.");
    }
  }

  function addMember() {
    const n = memberInput.trim();
    if (!n) return;
    if (memberList.some((m) => m.name.toLowerCase() === n.toLowerCase())) {
      toast.error("Ese miembro ya está.");
      return;
    }
    setMemberList((prev) => [...prev, { name: n, isAdmin: false }]);
    setMemberInput("");
  }

  function toggleAdmin(name: string) {
    setMemberList((prev) =>
      prev.map((m) => (m.name === name ? { ...m, isAdmin: !m.isAdmin } : m))
    );
  }

  function onCreatePressed() {
    if (!name.trim()) {
      toast.error("Poné un nombre al grupo.");
      return;
    }
    setStep(memberList.length === 0 ? "confirm-empty" : "confirm-ready");
  }

  async function doCreate() {
    setSaving(true);
    try {
      const res = await createGroup({ name, photo, currency, members: memberList });
      rememberGroup({ code: res.code, name: res.name, icon: res.icon });
      toast.success(`Grupo creado: ${res.code}`);
      router.push(`/g/${res.code}`);
    } catch (err) {
      console.error("createGroup falló:", err);
      toast.error("No se pudo crear el grupo.");
      setSaving(false);
      setStep("form");
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen} modal={false}>
      <SheetTrigger render={trigger} />
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="max-h-[92vh] gap-0 overflow-y-auto rounded-t-3xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-popover px-5 py-3">
          <SheetTitle className="text-xl">Crear grupo</SheetTitle>
          <SheetClose
            render={
              <button
                aria-label="Cerrar"
                className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition active:bg-muted"
              >
                <X className="size-5" />
              </button>
            }
          />
        </div>

        <div className="flex flex-col gap-5 px-5 pb-6 pt-4">
          {/* Foto del grupo (opcional) */}
          <div className="flex flex-col gap-2">
            <Label>Foto del grupo (opcional)</Label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="relative size-16 shrink-0 overflow-hidden rounded-full border bg-muted"
                aria-label="Agregar foto"
              >
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt="" className="size-full object-cover" />
                ) : (
                  <span className="flex size-full items-center justify-center text-muted-foreground">
                    <Camera className="size-6" />
                  </span>
                )}
              </button>
              <Button
                type="button"
                variant="outline"
                className="h-10"
                onClick={() => fileRef.current?.click()}
              >
                {photo ? "Cambiar foto" : "Agregar foto"}
              </Button>
              {photo && (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10"
                  onClick={() => setPhoto(null)}
                >
                  Quitar
                </Button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPickFile(e.target.files?.[0])}
            />
          </div>

          {/* Nombre */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="g-name">Nombre del grupo</Label>
            <Input
              id="g-name"
              placeholder="Ej. Asado del finde"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={scrollIntoCenter}
              autoCapitalize="words"
            />
          </div>

          {/* Moneda */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="g-cur">Moneda del grupo</Label>
            <select
              id="g-cur"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="h-11 rounded-xl border bg-card px-3 text-base outline-none focus:border-[var(--color-gold)]"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol} · {c.label} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Miembros */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="g-member">Miembros del grupo</Label>
            <div className="flex gap-2">
              <Input
                id="g-member"
                ref={memberRef}
                placeholder="Nombre del miembro"
                value={memberInput}
                onChange={(e) => setMemberInput(e.target.value)}
                onFocus={scrollIntoCenter}
                autoCapitalize="words"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addMember();
                  }
                }}
              />
              <Button
                type="button"
                className="shrink-0 gap-1.5 px-4"
                onClick={addMember}
              >
                <Plus className="size-4" /> Agregar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              La <span className="text-[var(--color-gold)]">⭐</span> marca
              administrador. Si no marcás ninguno, todos pueden editar. Se genera
              un código para compartir.
            </p>

            {memberList.length > 0 && (
              <ul className="flex flex-wrap gap-2 pt-1">
                {memberList.map((m) => (
                  <li
                    key={m.name}
                    className="flex items-center gap-1.5 rounded-full bg-muted py-1 pl-3 pr-1.5 text-sm"
                  >
                    <button
                      type="button"
                      onClick={() => toggleAdmin(m.name)}
                      title="Marcar como administrador"
                    >
                      <Star
                        className={cn(
                          "size-4",
                          m.isAdmin
                            ? "fill-[var(--color-gold)] text-[var(--color-gold)]"
                            : "text-muted-foreground"
                        )}
                      />
                    </button>
                    {m.name}
                    <button
                      type="button"
                      onClick={() =>
                        setMemberList((prev) =>
                          prev.filter((x) => x.name !== m.name)
                        )
                      }
                      className="text-muted-foreground"
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Acción / confirmaciones */}
          {step === "form" && (
            <Button
              size="lg"
              className="h-12 text-base"
              onClick={onCreatePressed}
            >
              Crear grupo
            </Button>
          )}

          {step === "confirm-empty" && (
            <div className="flex flex-col gap-2 rounded-2xl border bg-muted/40 p-4">
              <p className="text-sm font-medium">
                No agregaste ningún miembro. ¿Querés agregar uno?
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="h-11 flex-1"
                  onClick={() => {
                    setStep("form");
                    setTimeout(() => memberRef.current?.focus(), 50);
                  }}
                >
                  Añadir
                </Button>
                <Button
                  className="h-11 flex-1 bg-[var(--color-pos)] text-white hover:opacity-90"
                  disabled={saving}
                  onClick={doCreate}
                >
                  {saving ? "Creando…" : "Continuar"}
                </Button>
              </div>
            </div>
          )}

          {step === "confirm-ready" && (
            <div className="flex flex-col gap-2 rounded-2xl border bg-muted/40 p-4">
              <p className="text-sm font-medium">
                ¿Desea crear el grupo con {memberList.length} miembro
                {memberList.length === 1 ? "" : "s"}?
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="h-11 flex-1"
                  onClick={() => setStep("form")}
                >
                  Volver
                </Button>
                <Button
                  className="h-11 flex-1 bg-[var(--color-pos)] text-white hover:opacity-90"
                  disabled={saving}
                  onClick={doCreate}
                >
                  {saving ? "Creando…" : "Crear grupo"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
