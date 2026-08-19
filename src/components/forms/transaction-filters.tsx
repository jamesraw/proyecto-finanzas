"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Person = { id: string; name: string };
type Category = { id: string; name: string; icon: string };

export function TransactionFilters({
  people,
  categories,
}: {
  people: Person[];
  categories: Category[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/transactions?${params.toString()}`);
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      <Select
        defaultValue={searchParams.get("person") ?? "all"}
        onValueChange={(v) => setParam("person", v ?? "all")}
      >
        <SelectTrigger>
          <SelectValue placeholder="Persona" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {people.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        defaultValue={searchParams.get("scope") ?? "all"}
        onValueChange={(v) => setParam("scope", v ?? "all")}
      >
        <SelectTrigger>
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todo</SelectItem>
          <SelectItem value="personal">Personal</SelectItem>
          <SelectItem value="shared">Compartido</SelectItem>
        </SelectContent>
      </Select>

      <Select
        defaultValue={searchParams.get("category") ?? "all"}
        onValueChange={(v) => setParam("category", v ?? "all")}
      >
        <SelectTrigger>
          <SelectValue placeholder="Categoría" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.icon} {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
