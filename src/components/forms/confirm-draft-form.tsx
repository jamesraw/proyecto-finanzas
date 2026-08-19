"use client";

import { useActionState, useTransition } from "react";
import { confirmDraftTransaction, discardDraftTransaction } from "@/app/actions/recurring";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Draft = {
  id: string;
  amount: number;
  currency: string;
  date: Date;
  note: string | null;
  category?: { icon: string; name: string } | null;
};

export function ConfirmDraftForm({ draft }: { draft: Draft }) {
  const [state, formAction, pending] = useActionState(confirmDraftTransaction, undefined);
  const [discardPending, startDiscard] = useTransition();

  return (
    <form action={formAction} className="space-y-2 rounded-xl border bg-amber-50 p-3 dark:bg-amber-950/20">
      <input type="hidden" name="id" value={draft.id} />
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="text-lg">{draft.category?.icon ?? "🔁"}</span>
        {draft.category?.name ?? draft.note}
        <span className="ml-auto text-xs text-muted-foreground">
          Confirmar mes de {new Intl.DateTimeFormat("es-AR", { month: "long" }).format(draft.date)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor={`amount-${draft.id}`} className="mb-1 block text-xs">
            Monto real ({draft.currency})
          </Label>
          <Input
            id={`amount-${draft.id}`}
            name="amount"
            type="number"
            step="0.01"
            min="0"
            defaultValue={draft.amount}
            required
          />
        </div>
        <div>
          <Label htmlFor={`date-${draft.id}`} className="mb-1 block text-xs">
            Fecha
          </Label>
          <Input
            id={`date-${draft.id}`}
            name="date"
            type="date"
            defaultValue={draft.date.toISOString().slice(0, 10)}
          />
        </div>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending} className="flex-1">
          {pending ? "Confirmando..." : "Confirmar"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={discardPending}
          onClick={() => startDiscard(() => discardDraftTransaction(draft.id))}
        >
          Descartar
        </Button>
      </div>
    </form>
  );
}
