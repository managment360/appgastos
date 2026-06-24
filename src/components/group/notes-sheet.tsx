"use client";

import { useState, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NotebookPen, Plus, Trash2, StickyNote } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { Member, Note } from "@/db/schema";
import { formatDateShort } from "@/lib/dates";
import { useCurrentMember } from "@/lib/current-member";
import { addNote, deleteNote } from "@/app/actions/notes";

/** Pizarra del grupo: notas de cada miembro, visibles para todos. */
export function NotesSheet({
  code,
  members,
  notes,
  trigger,
}: {
  code: string;
  members: Member[];
  notes: Note[];
  trigger?: ReactElement;
}) {
  const router = useRouter();
  const me = useCurrentMember(code);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const nameOf = (id: string | null) =>
    id ? members.find((m) => m.id === id)?.name ?? "Alguien" : "Alguien";

  async function add() {
    const t = text.trim();
    if (!t) return;
    setBusy(true);
    try {
      await addNote({ groupCode: code, memberId: me, text: t });
      setText("");
      router.refresh();
    } catch {
      toast.error("No se pudo agregar la nota.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      await deleteNote({ id, groupCode: code });
      router.refresh();
    } catch {
      toast.error("No se pudo borrar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen} modal={false}>
      <SheetTrigger
        render={
          trigger ?? (
            <button
              className="relative flex size-9 items-center justify-center rounded-full bg-[var(--color-navy-soft)] text-white transition active:scale-95"
              aria-label="Notas del grupo"
            >
              <NotebookPen className="size-4" />
              {notes.length > 0 && (
                <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-[var(--color-gold)] text-[10px] font-bold text-white">
                  {notes.length}
                </span>
              )}
            </button>
          )
        }
      />
      <SheetContent
        side="bottom"
        className="max-h-[90vh] gap-0 overflow-y-auto rounded-t-3xl"
      >
        <SheetHeader className="px-5">
          <SheetTitle className="text-xl">Pizarra del grupo</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-3 px-5 pb-8 pt-1">
          {/* Agregar nota */}
          <div className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                me
                  ? "Escribí una nota…"
                  : "Escribí una nota… (elegí quién sos para firmarla)"
              }
              rows={2}
              className="flex-1 resize-none rounded-xl border bg-card p-3 text-base outline-none focus:border-[var(--color-gold)]"
            />
            <Button
              size="icon"
              className="size-11 shrink-0 rounded-xl"
              disabled={busy || !text.trim()}
              onClick={add}
              aria-label="Agregar nota"
            >
              <Plus className="size-5" />
            </Button>
          </div>

          {/* Lista */}
          {notes.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
              <StickyNote className="size-7" />
              <p className="text-sm">
                Todavía no hay notas. Agregá la primera con el botón ＋.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {notes.map((n) => (
                <li
                  key={n.id}
                  className="rounded-2xl border bg-[var(--color-gold-soft)] px-4 py-3"
                >
                  <p className="whitespace-pre-wrap text-base text-[var(--color-navy)]">
                    {n.text}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold">{nameOf(n.memberId)}</span>
                    <span className="flex items-center gap-2">
                      {formatDateShort(n.createdAt)}
                      <button
                        onClick={() => remove(n.id)}
                        disabled={busy}
                        aria-label="Borrar nota"
                        className="text-muted-foreground transition active:text-[var(--color-neg)]"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
