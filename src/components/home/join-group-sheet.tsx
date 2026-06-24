"use client";

import { useEffect, useState, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { findGroup } from "@/app/actions/groups";
import { rememberGroup } from "@/lib/recent-groups";
import { normalizeCode } from "@/lib/ids";

export function JoinGroupSheet({ trigger }: { trigger: ReactElement }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setCode("");
  }, [open]);

  async function handleJoin() {
    const c = normalizeCode(code);
    if (!c) {
      toast.error("Ingresá un código.");
      return;
    }
    setLoading(true);
    try {
      const res = await findGroup(c);
      if (!res.found) {
        toast.error("No existe un grupo con ese código.");
        setLoading(false);
        return;
      }
      rememberGroup({ code: res.code, name: res.name, icon: res.icon });
      router.push(`/g/${res.code}`);
    } catch {
      toast.error("Hubo un error. Probá de nuevo.");
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen} modal={false}>
      <SheetTrigger render={trigger} />
      <SheetContent side="bottom" className="gap-0 rounded-t-3xl">
        <SheetHeader className="px-5">
          <SheetTitle className="text-xl">Unirse con código</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-5 px-5 pb-8 pt-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="join-code">Código del grupo</Label>
            <Input
              id="join-code"
              placeholder="Ej. ASADO1"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              autoFocus
              autoCapitalize="characters"
              className="text-center text-lg font-semibold tracking-widest"
            />
          </div>
          <Button
            size="lg"
            className="h-12 text-base"
            disabled={loading}
            onClick={handleJoin}
          >
            {loading ? "Buscando…" : "Entrar al grupo"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
