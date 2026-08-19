"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, List, Plus, Repeat, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/transactions", label: "Movs.", icon: List },
];

const itemsRight = [
  { href: "/recurring", label: "Fijos", icon: Repeat },
  { href: "/settings", label: "Ajustes", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  const renderItem = ({
    href,
    label,
    icon: Icon,
  }: (typeof items)[number]) => {
    const active = pathname === href;
    return (
      <Link
        key={href}
        href={href}
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs",
          active ? "text-primary" : "text-muted-foreground"
        )}
      >
        <Icon className="h-5 w-5" />
        {label}
      </Link>
    );
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg items-center">
        {items.map(renderItem)}
        <div className="flex flex-1 flex-col items-center justify-center py-2">
          <Link
            href="/add"
            className="flex h-12 w-12 -translate-y-3 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
            aria-label="Agregar gasto o ingreso"
          >
            <Plus className="h-6 w-6" />
          </Link>
        </div>
        {itemsRight.map(renderItem)}
      </div>
    </nav>
  );
}
