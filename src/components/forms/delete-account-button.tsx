"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteAccount } from "@/app/actions/settings";

export function DeleteAccountButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-7 w-7 shrink-0 text-muted-foreground"
      disabled={pending}
      onClick={() => {
        if (confirm("¿Borrar esta caja/cuenta?")) {
          startTransition(() => deleteAccount(id));
        }
      }}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
