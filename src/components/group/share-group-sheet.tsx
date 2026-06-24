"use client";

import { useEffect, useState, type ReactElement } from "react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { Share2, Copy, Check, MessageCircle, Link2 } from "lucide-react";
import type { Group } from "@/db/schema";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  copyToClipboard,
  groupUrl,
  inviteMessage,
  whatsappLink,
} from "@/lib/share";

export function ShareGroupSheet({
  group,
  trigger,
}: {
  group: Group;
  trigger?: ReactElement;
}) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [open, setOpen] = useState(false);
  const [qr, setQr] = useState<string>("");

  // Genera el QR del link del grupo al abrir.
  useEffect(() => {
    if (!open) return;
    QRCode.toDataURL(groupUrl(group.code), {
      width: 320,
      margin: 1,
      color: { dark: "#15253f", light: "#ffffff" },
    })
      .then(setQr)
      .catch(() => setQr(""));
  }, [open, group.code]);

  async function copy(kind: "code" | "link") {
    const value = kind === "code" ? group.code : groupUrl(group.code);
    const ok = await copyToClipboard(value);
    if (ok) {
      setCopied(kind);
      toast.success("¡Copiado!");
      setTimeout(() => setCopied(null), 1500);
    } else {
      toast.error("No se pudo copiar.");
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          trigger ?? (
            <button
              className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition active:scale-95"
              aria-label="Compartir grupo"
            >
              <Share2 className="size-4" />
            </button>
          )
        }
      />
      <SheetContent side="bottom" className="gap-0 rounded-t-3xl">
        <SheetHeader className="px-5">
          <SheetTitle className="text-xl">Compartir grupo</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-5 pb-8 pt-2">
          {/* QR del grupo */}
          {qr && (
            <div className="flex flex-col items-center gap-1">
              <img
                src={qr}
                alt="QR del grupo"
                className="size-44 rounded-2xl border bg-white p-2"
              />
              <span className="text-xs text-muted-foreground">
                Escaneá para unirte al grupo
              </span>
            </div>
          )}

          {/* Código grande */}
          <button
            onClick={() => copy("code")}
            className="flex flex-col items-center gap-1 rounded-2xl border bg-card py-5 transition active:scale-[0.99]"
          >
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Código del grupo
            </span>
            <span className="text-3xl font-bold tracking-[0.3em]">
              {group.code}
            </span>
            <span className="mt-1 flex items-center gap-1 text-xs text-primary">
              {copied === "code" ? (
                <>
                  <Check className="size-3.5" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="size-3.5" /> Tocá para copiar
                </>
              )}
            </span>
          </button>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-12 gap-2"
              onClick={() => copy("link")}
            >
              {copied === "link" ? (
                <Check className="size-4" />
              ) : (
                <Link2 className="size-4" />
              )}
              Copiar link
            </Button>
            <Button
              className="h-12 gap-2 bg-[#25D366] text-white hover:bg-[#1da851]"
              onClick={() =>
                window.open(
                  whatsappLink(inviteMessage(group.name, group.code)),
                  "_blank"
                )
              }
            >
              <MessageCircle className="size-4" />
              WhatsApp
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
