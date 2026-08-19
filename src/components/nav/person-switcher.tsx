"use client";

import { useTransition } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { setActivePerson } from "@/app/actions/person";
import { useRouter } from "next/navigation";

type Person = { id: string; name: string; color: string };

export function PersonSwitcher({
  people,
  activeName,
}: {
  people: Person[];
  activeName: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const active = people.find((p) => p.name === activeName) ?? people[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className="gap-2" disabled={pending}>
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: active?.color ?? "#64748b" }}
            />
            Soy {active?.name ?? "..."}
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {people.map((p) => (
          <DropdownMenuItem
            key={p.id}
            onClick={() =>
              startTransition(async () => {
                await setActivePerson(p.name);
                router.refresh();
              })
            }
          >
            <span
              className="mr-2 h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            Soy {p.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
