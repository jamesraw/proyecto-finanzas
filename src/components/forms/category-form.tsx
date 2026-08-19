"use client";

import { useActionState, useState } from "react";
import { createCategory } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function CategoryForm() {
  const [state, formAction, pending] = useActionState(createCategory, undefined);
  const [kind, setKind] = useState("expense");

  return (
    <form action={formAction} className="space-y-2 rounded-xl border p-3">
      <input type="hidden" name="kind" value={kind} />
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-1">
          <Label htmlFor="cat-icon" className="mb-1 block text-xs">
            Ícono
          </Label>
          <Input id="cat-icon" name="icon" placeholder="🎉" maxLength={4} required />
        </div>
        <div className="col-span-2">
          <Label htmlFor="cat-name" className="mb-1 block text-xs">
            Nombre
          </Label>
          <Input id="cat-name" name="name" placeholder="Nombre" required />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Input type="color" name="color" defaultValue="#64748b" className="h-9 w-14 p-1" />
        <ToggleGroup value={[kind]} onValueChange={(v) => v[0] && setKind(v[0])}>
          <ToggleGroupItem value="expense" className="flex-1">
            Gasto
          </ToggleGroupItem>
          <ToggleGroupItem value="income" className="flex-1">
            Ingreso
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
      <Button type="submit" size="sm" disabled={pending} className="w-full">
        {pending ? "Agregando..." : "Agregar categoría"}
      </Button>
    </form>
  );
}
