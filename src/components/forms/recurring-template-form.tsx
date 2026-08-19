"use client";

import { useActionState, useState } from "react";
import { createRecurringTemplate } from "@/app/actions/recurring";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Category = { id: string; name: string; icon: string };
type Person = { id: string; name: string };

export function RecurringTemplateForm({
  categories,
  people,
}: {
  categories: Category[];
  people: Person[];
}) {
  const [state, formAction, pending] = useActionState(createRecurringTemplate, undefined);
  const [scope, setScope] = useState("shared");

  return (
    <form action={formAction} className="space-y-3 rounded-xl border p-4">
      <h3 className="text-sm font-semibold">Nuevo gasto/ingreso fijo</h3>

      <div>
        <Label htmlFor="rec-name" className="mb-1 block text-xs">
          Nombre
        </Label>
        <Input id="rec-name" name="name" placeholder="Ej: Alquiler" required />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="rec-amount" className="mb-1 block text-xs">
            Monto estimado
          </Label>
          <Input id="rec-amount" name="amount" type="number" step="0.01" min="0" required />
        </div>
        <div>
          <Label htmlFor="rec-day" className="mb-1 block text-xs">
            Día del mes
          </Label>
          <Input
            id="rec-day"
            name="dayOfMonth"
            type="number"
            min="1"
            max="28"
            defaultValue={1}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="mb-1 block text-xs">Moneda</Label>
          <Select name="currency" defaultValue="ARS">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ARS">ARS</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="BRL">BRL</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1 block text-xs">Tipo</Label>
          <input type="hidden" name="kind" value="expense" />
          <Select value={scope} onValueChange={(v) => v && setScope(v)} name="scope">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="shared">Compartido</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="mb-1 block text-xs">Categoría</Label>
        <Select name="categoryId">
          <SelectTrigger>
            <SelectValue placeholder="Sin categoría" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.icon} {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {scope === "personal" && (
        <div>
          <Label className="mb-1 block text-xs">Persona</Label>
          <Select name="personId">
            <SelectTrigger>
              <SelectValue placeholder="Elegir" />
            </SelectTrigger>
            <SelectContent>
              {people.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Guardando..." : "Crear fijo"}
      </Button>
    </form>
  );
}
