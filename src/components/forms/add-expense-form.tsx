"use client";

import { useActionState, useMemo, useState } from "react";
import { createTransaction } from "@/app/actions/transactions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string; icon: string; color: string };
type Person = { id: string; name: string; color: string };

const today = () => new Date().toISOString().slice(0, 10);

export function AddExpenseForm({
  categories,
  people,
  activePersonId,
}: {
  categories: Category[];
  people: Person[];
  activePersonId: string;
}) {
  const [state, formAction, pending] = useActionState(createTransaction, undefined);
  const [categoryId, setCategoryId] = useState<string>("");
  const [currency, setCurrency] = useState("ARS");
  const [scope, setScope] = useState<"personal" | "shared">("personal");
  const [splitType, setSplitType] = useState("equal");
  const [personId, setPersonId] = useState(activePersonId);
  const [customPercent, setCustomPercent] = useState(50);

  const otherPerson = useMemo(
    () => people.find((p) => p.id !== personId),
    [people, personId]
  );
  const payer = useMemo(() => people.find((p) => p.id === personId), [people, personId]);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="categoryId" value={categoryId} />
      <input type="hidden" name="personId" value={personId} />
      <input type="hidden" name="scope" value={scope} />
      {scope === "shared" && <input type="hidden" name="splitType" value={splitType} />}
      {scope === "shared" && splitType === "custom" && (
        <input type="hidden" name="customSharePercent" value={customPercent} />
      )}

      {/* Amount — the very first thing, autofocused, huge */}
      <div>
        <Label htmlFor="amount" className="sr-only">
          Monto
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="amount"
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
        </div>
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

      {/* Category grid — one tap */}
      <div>
        <Label className="mb-2 block">Categoría</Label>
        <div className="grid grid-cols-4 gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryId(cat.id)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border p-2 text-xs transition-colors",
                categoryId === cat.id
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card"
              )}
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="line-clamp-1">{cat.name}</span>
            </button>
          ))}
        </div>
        {!categoryId && state === undefined && (
          <p className="mt-1 text-xs text-muted-foreground">Elegí una categoría</p>
        )}
      </div>

      {/* Personal vs Compartido */}
      <div>
        <Label className="mb-2 block">Tipo</Label>
        <ToggleGroup
          value={[scope]}
          onValueChange={(v) => v[0] && setScope(v[0] as "personal" | "shared")}
          className="w-full"
        >
          <ToggleGroupItem value="personal" className="flex-1">
            Personal
          </ToggleGroupItem>
          <ToggleGroupItem value="shared" className="flex-1">
            Compartido
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {scope === "shared" && (
        <div className="space-y-3 rounded-xl border bg-muted/40 p-3">
          <div>
            <Label className="mb-1 block text-xs text-muted-foreground">
              ¿Cómo se divide?
            </Label>
            <Select value={splitType} onValueChange={(v) => v && setSplitType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equal">Por igual (50/50)</SelectItem>
                <SelectItem value="byIncome">Según ingresos del mes</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {splitType === "custom" && payer && (
            <div>
              <Label className="mb-1 block text-xs text-muted-foreground">
                Parte de {payer.name}: {customPercent}%
              </Label>
              <input
                type="range"
                min={0}
                max={100}
                value={customPercent}
                onChange={(e) => setCustomPercent(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                {otherPerson?.name}: {100 - customPercent}%
              </p>
            </div>
          )}
        </div>
      )}

      {/* Who paid */}
      <div>
        <Label className="mb-2 block">¿Quién pagó?</Label>
        <ToggleGroup
          value={[personId]}
          onValueChange={(v) => v[0] && setPersonId(v[0])}
          className="w-full"
        >
          {people.map((p) => (
            <ToggleGroupItem key={p.id} value={p.id} className="flex-1 gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: p.color }}
              />
              {p.name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Date + note, low priority, collapsed visually but present */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="date" className="mb-1 block text-xs text-muted-foreground">
            Fecha
          </Label>
          <Input id="date" name="date" type="date" defaultValue={today()} />
        </div>
      </div>
      <div>
        <Label htmlFor="note" className="mb-1 block text-xs text-muted-foreground">
          Nota (opcional)
        </Label>
        <Textarea id="note" name="note" rows={1} placeholder="Ej: verdulería" />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button
        type="submit"
        className="h-12 w-full text-base"
        disabled={pending || !categoryId}
      >
        {pending ? "Guardando..." : "Guardar gasto"}
      </Button>
    </form>
  );
}
