"use client";

import { useEffect } from "react";
import { rememberGroup } from "@/lib/recent-groups";

/** Registra el grupo en "recientes" de este dispositivo al abrirlo. */
export function RememberGroup({
  code,
  name,
  icon,
}: {
  code: string;
  name: string;
  icon: string;
}) {
  useEffect(() => {
    rememberGroup({ code, name, icon });
  }, [code, name, icon]);
  return null;
}
