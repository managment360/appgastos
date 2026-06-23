"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NotebookPen } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { updateGroupNotes } from "@/app/actions/groups";

/** Pizarra/anotador del grupo, visible para todos. */
export function NotesSheet({
  code,
  initialNotes,
}: {
  code: string;
  initialNotes: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await updateGroupNotes({ groupCode: code, notes });
      toast.success("Notas guardadas");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("No se pudieron guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <button
            className="flex size-9 items-center justify-center rounded-full bg-[var(--color-navy-soft)] text-white transition active:scale-95"
            aria-label="Notas del grupo"
          >
            <NotebookPen className="size-4" />
          </button>
        }
      />
      <SheetContent side="bottom" className="gap-0 rounded-t-3xl">
        <SheetHeader className="px-5">
          <SheetTitle className="text-xl">Pizarra del grupo</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-3 px-5 pb-8 pt-2">
          <p className="text-sm text-muted-foreground">
            Anotaciones visibles para todo el grupo (qué falta comprar,
            recordatorios, etc.).
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Escribí acá las notas del grupo…"
            rows={8}
            className="w-full resize-none rounded-xl border bg-card p-3 text-base outline-none focus:border-[var(--color-gold)]"
            autoFocus
          />
          <Button
            size="lg"
            className="h-12 text-base"
            disabled={saving}
            onClick={save}
          >
            {saving ? "Guardando…" : "Guardar notas"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
