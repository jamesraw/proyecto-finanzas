"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const incomeSchema = z.object({
  personId: z.string().min(1),
  source: z.string().min(1, "Poné una fuente (ej: Sueldo)"),
  amount: z.coerce.number().positive("El monto tiene que ser mayor a 0"),
  currency: z.enum(["ARS", "USD", "BRL"]),
  date: z.string().optional(),
  recurring: z.coerce.boolean().optional(),
});

export type IncomeFormState = { error?: string } | undefined;

export async function createIncome(
  _prevState: IncomeFormState,
  formData: FormData
): Promise<IncomeFormState> {
  const parsed = incomeSchema.safeParse({
    personId: formData.get("personId"),
    source: formData.get("source"),
    amount: formData.get("amount"),
    currency: formData.get("currency") || "ARS",
    date: formData.get("date") || undefined,
    recurring: formData.get("recurring") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const data = parsed.data;

  await prisma.income.create({
    data: {
      personId: data.personId,
      source: data.source,
      amount: data.amount,
      currency: data.currency,
      date: data.date ? new Date(data.date) : new Date(),
      recurring: data.recurring ?? false,
    },
  });

  revalidatePath("/");
  redirect("/?income=1");
}

export async function deleteIncome(id: string) {
  await prisma.income.delete({ where: { id } });
  revalidatePath("/");
}
