"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Receipt, Scale, HandCoins, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

export function BottomNav({ code }: { code: string }) {
  const pathname = usePathname();
  const base = `/g/${code}`;

  const items = [
    { href: base, label: t.nav.expenses, icon: Receipt, exact: true },
    { href: `${base}/saldos`, label: t.nav.balances, icon: Scale },
    { href: `${base}/saldar`, label: t.nav.settle, icon: HandCoins },
    { href: `${base}/reporte`, label: t.nav.report, icon: FileText },
  ];

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md">
      <div className="pb-safe border-t border-[var(--color-navy-soft)] bg-[var(--color-navy)]">
        <ul className="grid grid-cols-4">
          {items.map((it) => {
            const active = isActive(it.href, it.exact);
            const Icon = it.icon;
            return (
              <li key={it.href}>
                <Link
                  href={it.href}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[12px] font-semibold transition",
                    active
                      ? "text-[var(--color-navy)]"
                      : "text-[var(--color-sky)]"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-14 items-center justify-center rounded-full transition",
                      active ? "bg-[var(--color-gold)]" : "bg-transparent"
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className={active ? "text-white" : ""}>{it.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
