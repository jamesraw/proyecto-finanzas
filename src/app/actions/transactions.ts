"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const transactionSchema = z.object({
  amount: z.coerce.number().positive("El monto tiene que ser mayor a 0"),
  currency: z.enum(["ARS", "USD", "BRL"]),
  categoryId: z.string().min(1, "Elegí una categoría"),
  personId: z.string().min(1),
  scope: z.enum(["personal", "shared"]),
  splitType: z.enum(["equal", "custom", "byIncome"]).optional(),
  customSharePercent: z.coerce.number().min(0).max(100).optional(),
  date: z.string().optional(),
  note: z.string().optional(),
});

export type TransactionFormState = { error?: string } | undefined;

async function computeShares(
  scope: "personal" | "shared",
  splitType: "equal" | "custom" | "byIncome" | undefined,
  personId: string,
  customSharePercent: number | undefined
): Promise<{ payerShare: number | null; otherShare: number | null; splitType: string | null }> {
  if (scope !== "shared") {
    return { payerShare: null, otherShare: null, splitType: null };
  }

  const type = splitType ?? "equal";

  if (type === "custom") {
    const payerShare = (customSharePercent ?? 50) / 100;
    return { payerShare, otherShare: 1 - payerShare, splitType: type };
  }

  if (type === "byIncome") {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const incomes = await prisma.income.findMany({
      where: { date: { gte: startOfMonth } },
    });
    const rates = await import("@/lib/money").then((m) => m.getRatesMap());
    const { toARS } = await import("@/lib/money");

    const byPerson = new Map<string, number>();
    for (const inc of incomes) {
      const ars = toARS(inc.amount, inc.currency, rates);
      byPerson.set(inc.personId, (byPerson.get(inc.personId) ?? 0) + ars);
    }
    const total = [...byPerson.values()].reduce((a, b) => a + b, 0);
    if (total <= 0) {
      return { payerShare: 0.5, otherShare: 0.5, splitType: type };
    }
    const payerIncome = byPerson.get(personId) ?? 0;
    const payerShare = payerIncome / total;
    return { payerShare, otherShare: 1 - payerShare, splitType: type };
  }

  // equal
  return { payerShare: 0.5, otherShare: 0.5, splitType: "equal" };
}

export async function createTransaction(
  _prevState: TransactionFormState,
  formData: FormData
): Promise<TransactionFormState> {
  const parsed = transactionSchema.safeParse({
    amount: formData.get("amount"),
    currency: formData.get("currency") || "ARS",
    categoryId: formData.get("categoryId"),
    personId: formData.get("personId"),
    scope: formData.get("scope") || "personal",
    splitType: formData.get("splitType") || undefined,
    customSharePercent: formData.get("customSharePercent") || undefined,
    date: formData.get("date") || undefined,
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const data = parsed.data;
  const shares = await computeShares(
    data.scope,
    data.splitType,
    data.personId,
    data.customSharePercent
  );

  await prisma.transaction.create({
    data: {
      amount: data.amount,
      currency: data.currency,
      categoryId: data.categoryId,
      personId: data.personId,
      scope: data.scope,
      date: data.date ? new Date(data.date) : new Date(),
      note: data.note || null,
      splitType: shares.splitType as "equal" | "custom" | "byIncome" | null,
      payerShare: shares.payerShare,
      otherShare: shares.otherShare,
    },
  });

  revalidatePath("/");
  revalidatePath("/transactions");
  redirect("/?added=1");
}

export async function deleteTransaction(id: string) {
  await prisma.transaction.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/transactions");
}
