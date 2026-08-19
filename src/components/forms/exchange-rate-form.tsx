"use client";

import { useActionState } from "react";
import { updateExchangeRate } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ExchangeRateForm({
  currency,
  currentRate,
}: {
  currency: "USD" | "BRL";
  currentRate: number;
}) {
  const [state, formAction, pending] = useActionState(updateExchangeRate, undefined);

  return (
    <form action={formAction} className="flex items-end gap-2">
      <input type="hidden" name="currency" value={currency} />
      <div className="flex-1">
        <Label htmlFor={`rate-${currency}`} className="mb-1 block text-xs">
          1 {currency} = ? ARS
        </Label>
        <Input
          id={`rate-${currency}`}
          name="rateToARS"
          type="number"
          step="0.01"
          min="0"
          defaultValue={currentRate}
          required
        />
      </div>
      <Button type="submit" disabled={pending} size="sm">
        {pending ? "..." : "Guardar"}
      </Button>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
    </form>
  );
}
