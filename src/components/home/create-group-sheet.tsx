"use client";

import { useState, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, Plus, Star } from "lucide-react";
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
import { CURRENCIES } from "@/lib/currencies";
import { createGroup } from "@/app/actions/groups";
import { rememberGroup } from "@/lib/recent-groups";
import { cn } from "@/lib/utils";

export function CreateGroupSheet({ trigger }: { trigger: ReactElement }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<string>(GROUP_ICONS[0]);
  const [currency, setCurrency] = useState("ARS");
  const [memberInput, setMemberInput] = useState("");
  const [memberList, setMemberList] = useState<
    { name: string; isAdmin: boolean }[]
  >([]);
  const [saving, setSaving] = useState(false);

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
        currency,
        members: memberList,
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

          {/* Moneda */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="g-cur">Moneda</Label>
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

          {/* Miembros iniciales */}
          <div className="flex flex-col gap-2">
            <Label>Miembros (la ⭐ marca administrador)</Label>
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
            <p className="text-xs text-muted-foreground">
              Si no marcás ningún admin, todos pueden editar. Se genera un código
              para compartir.
            </p>
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
