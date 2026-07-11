"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Member } from "@/db/schema";
import { getCurrentMember, clearCurrentMember } from "@/lib/current-member";
import { getDeviceId } from "@/lib/device";
import { adoptClaim } from "@/app/actions/members";

/**
 * Cuida la identidad por grupo en este dispositivo:
 *  - Si tu lugar todavía no tiene dueño (grupos viejos), lo adopta.
 *  - Si otro dispositivo entró como vos (te "robó" el lugar), te expulsa:
 *    borra tu identidad local y reaparece "¿Quién sos?".
 * No renderiza nada.
 */
export function ClaimGuard({
  code,
  members,
}: {
  code: string;
  members: Member[];
}) {
  const router = useRouter();
  const kicked = useRef(false);

  useEffect(() => {
    const me = getCurrentMember(code);
    if (!me) return;
    const myMember = members.find((m) => m.id === me);
    if (!myMember) return;

    const device = getDeviceId();

    // Migración blanda: tomo posesión del lugar si todavía no tiene dueño.
    if (myMember.claimedBy == null) {
      const key = `dg:adopted:${code}:${me}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        adoptClaim({ memberId: me, deviceId: device }).catch(() => {});
      }
      return;
    }

    // Otro dispositivo ocupó mi lugar → quedo afuera.
    if (myMember.claimedBy !== device && !kicked.current) {
      kicked.current = true;
      clearCurrentMember(code);
      toast.info("Entraste desde otro dispositivo. Elegí de nuevo quién sos.");
      router.refresh();
    }
  }, [code, members, router]);

  return null;
}
