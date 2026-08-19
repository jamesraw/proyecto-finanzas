"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteTransaction } from "@/app/actions/transactions";

export function DeleteTransactionButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-7 w-7 shrink-0 text-muted-foreground"
      disabled={pending}
      onClick={() => {
        if (confirm("¿Borrar este movimiento?")) {
          startTransition(() => deleteTransaction(id));
        }
      }}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
