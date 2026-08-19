"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const templateSchema = z.object({
  kind: z.enum(["expense", "income"]),
  name: z.string().min(1, "Poné un nombre"),
  amount: z.coerce.number().positive("El monto tiene que ser mayor a 0"),
  currency: z.enum(["ARS", "USD", "BRL"]),
  dayOfMonth: z.coerce.number().int().min(1).max(28),
  categoryId: z.string().optional(),
  personId: z.string().optional(),
  scope: z.enum(["personal", "shared"]).optional(),
  splitType: z.enum(["equal", "custom", "byIncome"]).optional(),
});

export type TemplateFormState = { error?: string } | undefined;

export async function createRecurringTemplate(
  _prevState: TemplateFormState,
  formData: FormData
): Promise<TemplateFormState> {
  const parsed = templateSchema.safeParse({
    kind: formData.get("kind") || "expense",
    name: formData.get("name"),
    amount: formData.get("amount"),
    currency: formData.get("currency") || "ARS",
    dayOfMonth: formData.get("dayOfMonth") || 1,
    categoryId: formData.get("categoryId") || undefined,
    personId: formData.get("personId") || undefined,
    scope: formData.get("scope") || "shared",
    splitType: formData.get("splitType") || "equal",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const data = parsed.data;
  const isShared = data.scope === "shared";

  await prisma.recurringTransaction.create({
    data: {
      kind: data.kind,
      name: data.name,
      amount: data.amount,
      currency: data.currency,
      dayOfMonth: data.dayOfMonth,
      categoryId: data.categoryId || null,
      personId: data.personId || null,
      scope: data.scope ?? "shared",
      splitType: isShared ? data.splitType ?? "equal" : null,
      payerShare: isShared ? 0.5 : null,
      otherShare: isShared ? 0.5 : null,
    },
  });

  revalidatePath("/recurring");
  redirect("/recurring");
}

export async function toggleRecurringActive(id: string, active: boolean) {
  await prisma.recurringTransaction.update({
    where: { id },
    data: { active },
  });
  revalidatePath("/recurring");
}

export async function deleteRecurringTemplate(id: string) {
  await prisma.recurringTransaction.delete({ where: { id } });
  revalidatePath("/recurring");
}

/**
 * Generates draft transactions for all active recurring expense templates for the
 * current month, skipping ones that already have a transaction this month. Bills
 * like utilities vary, so these are created as drafts the user must confirm/edit.
 */
export async function generateMonthlyDrafts() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const templates = await prisma.recurringTransaction.findMany({
    where: { active: true, kind: "expense" },
  });

  let created = 0;
  for (const template of templates) {
    const existing = await prisma.transaction.findFirst({
      where: {
        recurringTemplateId: template.id,
        date: { gte: startOfMonth, lt: startOfNextMonth },
      },
    });
    if (existing) continue;

    const personId =
      template.personId ??
      (await prisma.person.findFirst({ orderBy: { createdAt: "asc" } }))?.id;
    if (!personId) continue;

    const day = Math.min(template.dayOfMonth, 28);
    await prisma.transaction.create({
      data: {
        amount: template.amount,
        currency: template.currency,
        categoryId: template.categoryId,
        personId,
        scope: template.scope,
        date: new Date(now.getFullYear(), now.getMonth(), day),
        note: `Generado automáticamente: ${template.name}`,
        splitType: template.splitType,
        payerShare: template.payerShare,
        otherShare: template.otherShare,
        recurringTemplateId: template.id,
        isDraft: true,
      },
    });
    created += 1;
  }

  revalidatePath("/recurring");
  revalidatePath("/");
  return { created };
}

const confirmSchema = z.object({
  id: z.string().min(1),
  amount: z.coerce.number().positive(),
  date: z.string().optional(),
  note: z.string().optional(),
});

export type ConfirmDraftState = { error?: string } | undefined;

export async function confirmDraftTransaction(
  _prevState: ConfirmDraftState,
  formData: FormData
): Promise<ConfirmDraftState> {
  const parsed = confirmSchema.safeParse({
    id: formData.get("id"),
    amount: formData.get("amount"),
    date: formData.get("date") || undefined,
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const data = parsed.data;
  await prisma.transaction.update({
    where: { id: data.id },
    data: {
      amount: data.amount,
      date: data.date ? new Date(data.date) : undefined,
      note: data.note || null,
      isDraft: false,
    },
  });

  revalidatePath("/recurring");
  revalidatePath("/");
  revalidatePath("/transactions");
  redirect("/recurring");
}

export async function discardDraftTransaction(id: string) {
  await prisma.transaction.delete({ where: { id } });
  revalidatePath("/recurring");
}
