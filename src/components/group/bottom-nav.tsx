"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Receipt, Scale, HandCoins, FileText, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import type { Member } from "@/db/schema";
import { ExpenseSheet } from "@/components/expense/expense-sheet";

export function BottomNav({
  code,
  members,
  currency,
}: {
  code: string;
  members: Member[];
  currency: string;
}) {
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
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md">
      <div className="pb-safe relative border-t bg-background/95 backdrop-blur">
        <ul className="grid grid-cols-5 items-end px-1 pt-1.5">
          {items.slice(0, 2).map((it) => (
            <NavItem key={it.href} {...it} active={isActive(it.href, it.exact)} />
          ))}

          {/* FAB central — abre el bottom sheet de gasto */}
          <li className="flex justify-center">
            <ExpenseSheet
              groupCode={code}
              members={members}
              currency={currency}
              trigger={
                <button
                  className="-mt-7 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-background transition active:scale-95"
                  aria-label="Agregar gasto"
                >
                  <Plus className="size-7" />
                </button>
              }
            />
          </li>

          {items.slice(2).map((it) => (
            <NavItem key={it.href} {...it} active={isActive(it.href, it.exact)} />
          ))}
        </ul>
      </div>
    </nav>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] font-medium transition",
          active ? "text-primary" : "text-muted-foreground"
        )}
      >
        <Icon className="size-5" />
        {label}
      </Link>
    </li>
  );
}
