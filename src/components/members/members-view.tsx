"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Copy,
  MoreVertical,
  UserX,
  UserCheck,
  Trash2,
  Star,
} from "lucide-react";
import type { Group, Member } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { cn, scrollIntoCenter } from "@/lib/utils";
import { copyToClipboard } from "@/lib/share";
import {
  addMember,
  updateMember,
  setMemberActive,
  setMemberAdmin,
  deleteMember,
} from "@/app/actions/members";
import { useCanEdit } from "@/lib/current-member";

export function MembersView({
  group,
  members,
  memberIdsWithActivity,
}: {
  group: Group;
  members: Member[];
  memberIdsWithActivity: string[];
}) {
  const router = useRouter();
  const activitySet = new Set(memberIdsWithActivity);
  const canEdit = useCanEdit(group.code, members);

  return (
    <div className="flex flex-col px-4 py-4">
      <div className="mb-4 flex items-center justify-between px-1">
        <h2 className="text-lg font-bold">Miembros</h2>
        {canEdit && (
          <MemberSheet
            group={group}
            trigger={
              <Button size="sm" className="h-9 gap-1">
                <Plus className="size-4" /> Agregar miembro
              </Button>
            }
          />
        )}
      </div>

      <ul className="flex flex-col gap-2">
        {members.map((m) => (
          <li
            key={m.id}
            className={cn(
              "flex items-center gap-3 rounded-2xl border bg-card px-4 py-3 shadow-sm",
              !m.active && "opacity-60"
            )}
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-muted font-semibold uppercase">
              {m.name.slice(0, 1)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-semibold leading-tight">
                {m.name}
                {m.isAdmin && (
                  <span className="flex items-center gap-0.5 rounded-full bg-[var(--color-gold-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-gold)]">
                    <Star className="size-3 fill-current" /> admin
                  </span>
                )}
                {!m.active && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    inactivo
                  </span>
                )}
              </p>
              {m.aliasCbu ? (
                <button
                  onClick={async () => {
                    const ok = await copyToClipboard(m.aliasCbu!);
                    toast[ok ? "success" : "error"](
                      ok ? "¡Alias copiado!" : "No se pudo copiar."
                    );
                  }}
                  className="flex items-center gap-1 text-xs text-muted-foreground"
                >
                  <Copy className="size-3" /> {m.aliasCbu}
                </button>
              ) : (
                <p className="text-xs text-muted-foreground">Sin alias/CBU</p>
              )}
            </div>

            {canEdit && (
              <MemberMenu
                group={group}
                member={m}
                hasActivity={activitySet.has(m.id)}
                onChanged={() => router.refresh()}
              />
            )}
          </li>
        ))}
      </ul>

      {members.length === 0 && (
        <p className="px-1 py-8 text-center text-sm text-muted-foreground">
          Todavía no hay miembros. Agregá el primero.
        </p>
      )}
    </div>
  );
}

function MemberMenu({
  group,
  member,
  hasActivity,
  onChanged,
}: {
  group: Group;
  member: Member;
  hasActivity: boolean;
  onChanged: () => void;
}) {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <button
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition active:bg-muted"
            aria-label="Opciones"
          >
            <MoreVertical className="size-5" />
          </button>
        }
      />
      <SheetContent side="bottom" className="gap-0 rounded-t-3xl">
        <SheetHeader className="px-5">
          <SheetTitle>{member.name}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-1 px-3 pb-8 pt-2">
          <MemberSheet
            group={group}
            member={member}
            trigger={
              <button className="rounded-xl px-3 py-3 text-left transition active:bg-muted">
                Editar datos
              </button>
            }
          />
          <button
            className="flex items-center gap-2 rounded-xl px-3 py-3 text-left transition active:bg-muted"
            onClick={async () => {
              await setMemberActive({
                id: member.id,
                groupCode: group.code,
                active: !member.active,
              });
              toast.success(member.active ? "Miembro desactivado" : "Miembro activado");
              onChanged();
            }}
          >
            {member.active ? (
              <>
                <UserX className="size-4" /> Desactivar
              </>
            ) : (
              <>
                <UserCheck className="size-4" /> Activar
              </>
            )}
          </button>
          <button
            className="flex items-center gap-2 rounded-xl px-3 py-3 text-left transition active:bg-muted"
            onClick={async () => {
              await setMemberAdmin({
                id: member.id,
                groupCode: group.code,
                isAdmin: !member.isAdmin,
              });
              toast.success(
                member.isAdmin ? "Ya no es administrador" : "Ahora es administrador"
              );
              onChanged();
            }}
          >
            <Star className="size-4" />
            {member.isAdmin ? "Quitar administrador" : "Hacer administrador"}
          </button>

          {/* Eliminar: solo si NO tiene gastos. Si tiene, hay que desactivarlo. */}
          {hasActivity ? (
            <p className="rounded-xl bg-muted/60 px-3 py-3 text-xs text-muted-foreground">
              {member.name} tiene gastos cargados, no se puede eliminar. Usá{" "}
              <strong>Desactivar</strong> (deja de sumarse a gastos nuevos pero se
              conservan las cuentas).
            </p>
          ) : (
            <Dialog>
              <DialogTrigger
                render={
                  <button className="flex items-center gap-2 rounded-xl px-3 py-3 text-left text-destructive transition active:bg-destructive/10">
                    <Trash2 className="size-4" /> Eliminar
                  </button>
                }
              />
              <DialogContent className="max-w-xs rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Eliminar a {member.name}</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                  No tiene movimientos. Se puede eliminar sin afectar las cuentas.
                </p>
                <DialogFooter className="flex-row justify-end gap-2">
                  <DialogClose
                    render={<Button variant="outline">Cancelar</Button>}
                  />
                  <DialogClose
                    render={
                      <Button
                        variant="destructive"
                        onClick={async () => {
                          try {
                            await deleteMember({
                              id: member.id,
                              groupCode: group.code,
                            });
                            toast.success("Miembro eliminado");
                            onChanged();
                          } catch (e) {
                            toast.error(
                              e instanceof Error ? e.message : "No se pudo eliminar."
                            );
                          }
                        }}
                      >
                        Eliminar
                      </Button>
                    }
                  />
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MemberSheet({
  group,
  member,
  trigger,
}: {
  group: Group;
  member?: Member;
  trigger: React.ReactElement;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(member?.name ?? "");
  const [phone, setPhone] = useState(member?.phone ?? "");
  const [email, setEmail] = useState(member?.email ?? "");
  const [aliasCbu, setAliasCbu] = useState(member?.aliasCbu ?? "");
  const [saving, setSaving] = useState(false);

  // Al abrir, cargar los datos del miembro (edición) o vaciar (nuevo).
  useEffect(() => {
    if (open) {
      setName(member?.name ?? "");
      setPhone(member?.phone ?? "");
      setEmail(member?.email ?? "");
      setAliasCbu(member?.aliasCbu ?? "");
    }
  }, [open, member]);

  async function save() {
    if (!name.trim()) return toast.error("El nombre es obligatorio.");
    if (!phone.trim()) return toast.error("El teléfono es obligatorio.");
    setSaving(true);
    try {
      if (member) {
        await updateMember({
          id: member.id,
          groupCode: group.code,
          name,
          phone,
          email,
          aliasCbu,
        });
      } else {
        await addMember({ groupCode: group.code, name, phone, email, aliasCbu });
      }
      toast.success(member ? "Miembro actualizado" : "Miembro agregado");
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen} modal={false}>
      <SheetTrigger render={trigger} />
      <SheetContent side="bottom" className="gap-0 rounded-t-3xl">
        <SheetHeader className="px-5">
          <SheetTitle>{member ? "Editar miembro" : "Nuevo miembro"}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-5 pb-8 pt-2">
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
          <Field label="Alias / CBU (para que le transfieran)">
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
          <Button
            size="lg"
            className="h-12"
            disabled={saving}
            onClick={save}
          >
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
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
