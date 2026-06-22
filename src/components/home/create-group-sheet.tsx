"use client";

import { useState, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, Plus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GROUP_ICONS } from "@/lib/i18n";
import { createGroup } from "@/app/actions/groups";
import { rememberGroup } from "@/lib/recent-groups";
import { cn } from "@/lib/utils";

export function CreateGroupSheet({ trigger }: { trigger: ReactElement }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<string>(GROUP_ICONS[0]);
  const [description, setDescription] = useState("");
  const [memberInput, setMemberInput] = useState("");
  const [memberNames, setMemberNames] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function addMember() {
    const n = memberInput.trim();
    if (!n) return;
    if (memberNames.some((m) => m.toLowerCase() === n.toLowerCase())) {
      toast.error("Ese miembro ya está.");
      return;
    }
    setMemberNames((prev) => [...prev, n]);
    setMemberInput("");
  }

  async function handleSubmit() {
    if (!name.trim()) {
      toast.error("Poné un nombre al grupo.");
      return;
    }
    setSaving(true);
    try {
      const res = await createGroup({
        name,
        icon,
        description,
        currency: "ARS",
        memberNames,
      });
      rememberGroup({ code: res.code, name: res.name, icon: res.icon });
      toast.success(`Grupo creado: ${res.code}`);
      router.push(`/g/${res.code}`);
    } catch {
      toast.error("No se pudo crear el grupo.");
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={trigger} />
      <SheetContent
        side="bottom"
        className="max-h-[92vh] gap-0 overflow-y-auto rounded-t-3xl"
      >
        <SheetHeader className="px-5">
          <SheetTitle className="text-xl">Crear grupo</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-5 pb-6">
          {/* Ícono */}
          <div className="flex flex-col gap-2">
            <Label>Ícono</Label>
            <div className="flex flex-wrap gap-2">
              {GROUP_ICONS.map((emo) => (
                <button
                  key={emo}
                  type="button"
                  onClick={() => setIcon(emo)}
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl border text-xl transition",
                    icon === emo
                      ? "border-primary bg-primary/10 ring-2 ring-primary/40"
                      : "bg-card"
                  )}
                >
                  {emo}
                </button>
              ))}
            </div>
          </div>

          {/* Nombre */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="g-name">Nombre</Label>
            <Input
              id="g-name"
              placeholder="Ej. Asado del finde"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Descripción */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="g-desc">Descripción (opcional)</Label>
            <Input
              id="g-desc"
              placeholder="Una nota corta"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Miembros iniciales */}
          <div className="flex flex-col gap-2">
            <Label>Miembros (opcional, los sumás ahora o después)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Nombre"
                value={memberInput}
                onChange={(e) => setMemberInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addMember();
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={addMember}>
                <Plus className="size-4" />
              </Button>
            </div>
            {memberNames.length > 0 && (
              <ul className="flex flex-wrap gap-2 pt-1">
                {memberNames.map((m) => (
                  <li
                    key={m}
                    className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm"
                  >
                    {m}
                    <button
                      type="button"
                      onClick={() =>
                        setMemberNames((prev) => prev.filter((x) => x !== m))
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

          <div className="rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            Moneda: <strong>ARS</strong> · Se generará un código para compartir.
          </div>

          <Button
            size="lg"
            className="h-12 text-base"
            disabled={saving}
            onClick={handleSubmit}
          >
            {saving ? "Creando…" : "Crear grupo"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
