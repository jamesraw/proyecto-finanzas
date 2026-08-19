"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { generateMonthlyDrafts } from "@/app/actions/recurring";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function GenerateDraftsButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full gap-2"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const { created } = await generateMonthlyDrafts();
          toast(
            created > 0
              ? `Se generaron ${created} borrador(es) para confirmar.`
              : "Ya estaban generados los fijos de este mes."
          );
        })
      }
    >
      <RefreshCw className="h-4 w-4" />
      {pending ? "Generando..." : "Generar fijos del mes"}
    </Button>
  );
}
