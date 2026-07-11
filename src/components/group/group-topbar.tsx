"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, Settings } from "lucide-react";
import type { Group, Member, Activity } from "@/db/schema";
import { MePill } from "./me-pill";
import { ActivityBell } from "./activity-bell";

/** Banner del grupo: foto de portada (o navy) + título + atrás + campana + tuerca. */
export function GroupTopbar({
  group,
  members,
  activity,
}: {
  group: Group;
  members: Member[];
  activity: Activity[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const base = `/g/${group.code}`;

  // En Configuración no se muestra el banner (esa página tiene su propio header).
  if (pathname === `${base}/config`) return null;

  function goBack() {
    if (pathname === base) router.push("/");
    else router.push(base);
  }

  return (
    <header className="relative h-40 shrink-0 overflow-hidden">
      {/* Fondo: foto o degradé navy */}
      {group.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={group.photo}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-navy)] to-[var(--color-navy-soft)]" />
      )}
      {/* Velo para legibilidad */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />

      {/* Controles arriba */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
        <button
          onClick={goBack}
          aria-label="Volver"
          className="flex size-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur transition active:scale-95"
        >
          <ArrowLeft className="size-5" />
        </button>
        <MePill code={group.code} members={members} />
        <div className="flex items-center gap-2">
          <ActivityBell code={group.code} activity={activity} />
          <Link
            href={`${base}/config`}
            aria-label="Configuración del grupo"
            className="flex size-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur transition active:scale-95"
          >
            <Settings className="size-5" />
          </Link>
        </div>
      </div>

      {/* Título */}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <h1 className="truncate text-3xl font-extrabold text-white drop-shadow">
          {group.name}
        </h1>
        <p className="text-xs font-medium text-white/80">Código {group.code}</p>
      </div>
    </header>
  );
}
