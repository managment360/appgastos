"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Pencil,
  Share2,
  NotebookPen,
  Trash2,
  Type,
  ChevronRight,
} from "lucide-react";
import type { Group, Member, Note } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ShareGroupSheet } from "./share-group-sheet";
import { NotesSheet } from "./notes-sheet";
import { MembersView } from "@/components/members/members-view";
import { TextSizeControl } from "@/components/text-size-control";
import { updateGroupProfile, deleteGroup } from "@/app/actions/groups";
import { fileToResizedDataUrl } from "@/lib/image";
import { scrollIntoCenter } from "@/lib/utils";

export function ConfigView({
  group,
  members,
  notes,
  memberIdsWithActivity,
}: {
  group: Group;
  members: Member[];
  notes: Note[];
  memberIdsWithActivity: string[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(group.name);
  const [photo, setPhoto] = useState<string | null>(group.photo ?? null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const dirty = name.trim() !== group.name || photo !== (group.photo ?? null);

  async function onPickFile(file: File | undefined) {
    if (!file) return;
    try {
      const dataUrl = await fileToResizedDataUrl(file, 1000, 0.72);
      setPhoto(dataUrl);
    } catch {
      toast.error("No se pudo procesar la imagen.");
    }
  }

  async function saveProfile() {
    if (!name.trim()) return toast.error("El nombre es obligatorio.");
    setSaving(true);
    try {
      await updateGroupProfile({ groupCode: group.code, name, photo });
      toast.success("Grupo actualizado");
      router.refresh();
    } catch {
      toast.error("No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function removeGroup() {
    setDeleting(true);
    try {
      await deleteGroup({ code: group.code });
      toast.success("Grupo eliminado");
      router.push("/");
    } catch {
      toast.error("No se pudo eliminar.");
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col">
      {/* Header propio */}
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b bg-background/95 px-3 py-3 backdrop-blur">
        <button
          onClick={() => router.push(`/g/${group.code}`)}
          aria-label="Volver"
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition active:scale-95"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-lg font-bold">Configuración de grupo</h1>
      </header>

      <div className="flex flex-col gap-6 px-4 py-4 pb-12">
        {/* Personalizar grupo */}
        <section className="flex flex-col gap-2">
          <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Personalizar grupo
          </h2>
          <div className="flex flex-col gap-4 rounded-2xl border bg-card p-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="relative size-20 shrink-0 overflow-hidden rounded-full border bg-muted"
                aria-label="Cambiar foto del grupo"
              >
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="flex size-full items-center justify-center text-3xl">
                    {group.icon}
                  </span>
                )}
                <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/55 py-1 text-[10px] font-semibold text-white">
                  <Pencil className="size-3" /> Editar
                </span>
              </button>
              <div className="flex-1">
                <Label htmlFor="g-name" className="mb-1.5 block">
                  Nombre del grupo
                </Label>
                <Input
                  id="g-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={scrollIntoCenter}
                  autoCapitalize="words"
                />
              </div>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPickFile(e.target.files?.[0])}
            />

            <div className="flex gap-2">
              {photo && (
                <Button
                  variant="outline"
                  className="h-10"
                  onClick={() => setPhoto(null)}
                >
                  Quitar foto
                </Button>
              )}
              <Button
                className="h-10 flex-1"
                disabled={!dirty || saving}
                onClick={saveProfile}
              >
                {saving ? "Guardando…" : "Guardar cambios"}
              </Button>
            </div>
          </div>
        </section>

        {/* Administrar miembros */}
        <section className="flex flex-col gap-2">
          <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Administrar miembros
          </h2>
          <div className="overflow-hidden rounded-2xl border bg-card">
            <ShareGroupSheet
              group={group}
              trigger={
                <button className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-muted">
                  <Share2 className="size-5 text-primary" />
                  <span className="flex-1 font-medium">
                    Invitar personas (link / QR)
                  </span>
                  <ChevronRight className="size-5 text-muted-foreground" />
                </button>
              }
            />
          </div>

          <MembersView
            group={group}
            members={members}
            memberIdsWithActivity={memberIdsWithActivity}
          />
        </section>

        {/* Más */}
        <section className="flex flex-col gap-2">
          <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Más
          </h2>
          <div className="overflow-hidden rounded-2xl border bg-card">
            <NotesSheet
              code={group.code}
              members={members}
              notes={notes}
              trigger={
                <button className="flex w-full items-center gap-3 border-b px-4 py-3.5 text-left transition active:bg-muted">
                  <NotebookPen className="size-5 text-primary" />
                  <span className="flex-1 font-medium">Pizarra del grupo</span>
                  {notes.length > 0 && (
                    <span className="rounded-full bg-[var(--color-gold)] px-2 py-0.5 text-xs font-bold text-white">
                      {notes.length}
                    </span>
                  )}
                  <ChevronRight className="size-5 text-muted-foreground" />
                </button>
              }
            />
            <div className="flex items-center gap-3 px-4 py-3">
              <Type className="size-5 text-primary" />
              <span className="flex-1 font-medium">Tamaño de letra</span>
              <TextSizeControl />
            </div>
          </div>
        </section>

        {/* Otro */}
        <section className="flex flex-col gap-2">
          <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Otro
          </h2>
          <Dialog>
            <DialogTrigger
              render={
                <button className="flex w-full items-center gap-3 rounded-2xl border border-[var(--color-neg)]/30 bg-card px-4 py-3.5 text-left text-[var(--color-neg)] transition active:bg-neg-soft">
                  <Trash2 className="size-5" />
                  <span className="flex-1 font-semibold">Eliminar grupo</span>
                </button>
              }
            />
            <DialogContent className="max-w-xs rounded-2xl">
              <DialogHeader>
                <DialogTitle>¿Eliminar grupo?</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Se elimina <strong>{group.name}</strong> y{" "}
                <strong>todos sus datos</strong> (gastos, miembros, saldos) para
                todos. No se puede deshacer.
              </p>
              <DialogFooter className="flex-row justify-end gap-2">
                <DialogClose render={<Button variant="outline">Cancelar</Button>} />
                <Button
                  variant="destructive"
                  disabled={deleting}
                  onClick={removeGroup}
                >
                  Eliminar grupo
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </section>
      </div>
    </div>
  );
}
