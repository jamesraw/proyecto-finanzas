"use client";

import { useActionState } from "react";
import { createAccount } from "@/app/actions/settings";
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

type Person = { id: string; name: string };

export function AccountForm({ people }: { people: Person[] }) {
  const [state, formAction, pending] = useActionState(createAccount, undefined);

  return (
    <form action={formAction} className="space-y-2 rounded-xl border p-3">
      <div>
        <Label htmlFor="acc-name" className="mb-1 block text-xs">
          Nombre de la caja/cuenta
        </Label>
        <Input id="acc-name" name="name" placeholder="Ej: Efectivo Chino" required />
      </div>
      <div>
        <Label className="mb-1 block text-xs">Dueño (vacío = compartida)</Label>
        <Select name="personId">
          <SelectTrigger>
            <SelectValue placeholder="Compartida" />
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
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
      <Button type="submit" size="sm" disabled={pending} className="w-full">
        {pending ? "Agregando..." : "Agregar caja"}
      </Button>
    </form>
  );
}
