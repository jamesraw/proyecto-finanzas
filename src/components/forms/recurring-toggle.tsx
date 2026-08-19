"use client";

import { useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { toggleRecurringActive } from "@/app/actions/recurring";

export function RecurringToggle({ id, active }: { id: string; active: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <Switch
      checked={active}
      disabled={pending}
      onCheckedChange={(checked) => startTransition(() => toggleRecurringActive(id, checked))}
    />
  );
}
