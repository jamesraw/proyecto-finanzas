"use client";

import { useActionState, useState } from "react";
import { createIncome } from "@/app/actions/income";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type Category = { id: string; name: string; icon: string };
type Person = { id: string; name: string; color: string };

const today = () => new Date().toISOString().slice(0, 10);

export function AddIncomeForm({
  incomeSources,
  people,
  activePersonId,
}: {
  incomeSources: Category[];
  people: Person[];
  activePersonId: string;
}) {
  const [state, formAction, pending] = useActionState(createIncome, undefined);
  const [personId, setPersonId] = useState(activePersonId);
  const [source, setSource] = useState(incomeSources[0]?.name ?? "");
  const [currency, setCurrency] = useState("ARS");

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="personId" value={personId} />

      <div>
        <Label htmlFor="income-amount" className="sr-only">
          Monto
        </Label>
        <Input
          id="income-amount"
          name="amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          autoFocus
          required
          placeholder="0"
          className="h-16 text-center text-4xl font-bold tabular-nums"
        />
        <ToggleGroup
          value={[currency]}
          onValueChange={(v) => v[0] && setCurrency(v[0])}
          className="mt-2 justify-center"
        >
          <ToggleGroupItem value="ARS" className="px-4">
            ARS
          </ToggleGroupItem>
          <ToggleGroupItem value="USD" className="px-4">
            USD
          </ToggleGroupItem>
          <ToggleGroupItem value="BRL" className="px-4">
            BRL
          </ToggleGroupItem>
        </ToggleGroup>
        <input type="hidden" name="currency" value={currency} />
      </div>

      <div>
        <Label className="mb-2 block">Fuente</Label>
        <div className="grid grid-cols-3 gap-2">
          {incomeSources.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSource(s.name)}
              className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-xs ${
                source === s.name ? "border-primary bg-primary/10" : "border-border bg-card"
              }`}
            >
              <span className="text-2xl">{s.icon}</span>
              <span>{s.name}</span>
            </button>
          ))}
        </div>
        <Input
          name="source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Fuente del ingreso"
          className="mt-2"
          required
        />
      </div>

      <div>
        <Label className="mb-2 block">¿Quién lo recibió?</Label>
        <ToggleGroup
          value={[personId]}
          onValueChange={(v) => v[0] && setPersonId(v[0])}
          className="w-full"
        >
          {people.map((p) => (
            <ToggleGroupItem key={p.id} value={p.id} className="flex-1 gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
              {p.name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div>
        <Label htmlFor="income-date" className="mb-1 block text-xs text-muted-foreground">
          Fecha
        </Label>
        <Input id="income-date" name="date" type="date" defaultValue={today()} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="recurring" className="h-4 w-4" />
        Es un ingreso recurrente (ej: sueldo mensual)
      </label>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" className="h-12 w-full text-base" disabled={pending}>
        {pending ? "Guardando..." : "Guardar ingreso"}
      </Button>
    </form>
  );
}
