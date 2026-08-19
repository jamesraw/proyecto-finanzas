"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const rateSchema = z.object({
  currency: z.enum(["USD", "BRL"]),
  rateToARS: z.coerce.number().positive("La cotización tiene que ser mayor a 0"),
});

export type SettingsFormState = { error?: string; success?: boolean } | undefined;

export async function updateExchangeRate(
  _prevState: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const parsed = rateSchema.safeParse({
    currency: formData.get("currency"),
    rateToARS: formData.get("rateToARS"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  await prisma.exchangeRate.upsert({
    where: { currency: parsed.data.currency },
    update: { rateToARS: parsed.data.rateToARS },
    create: { currency: parsed.data.currency, rateToARS: parsed.data.rateToARS },
  });

  revalidatePath("/settings");
  revalidatePath("/");
  return { success: true };
}

const categorySchema = z.object({
  name: z.string().min(1, "Poné un nombre"),
  icon: z.string().min(1, "Elegí un ícono/emoji"),
  color: z.string().min(1),
  kind: z.enum(["expense", "income"]),
});

export type CategoryFormState = { error?: string } | undefined;

export async function createCategory(
  _prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    icon: formData.get("icon"),
    color: formData.get("color") || "#64748b",
    kind: formData.get("kind") || "expense",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  try {
    await prisma.category.create({ data: parsed.data });
  } catch {
    return { error: "Ya existe una categoría con ese nombre" };
  }

  revalidatePath("/settings");
  revalidatePath("/add");
  return undefined;
}

export async function deleteCategory(id: string) {
  await prisma.category.delete({ where: { id } });
  revalidatePath("/settings");
  revalidatePath("/add");
}

const accountSchema = z.object({
  name: z.string().min(1, "Poné un nombre"),
  personId: z.string().optional(),
});

export type AccountFormState = { error?: string } | undefined;

export async function createAccount(
  _prevState: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  const parsed = accountSchema.safeParse({
    name: formData.get("name"),
    personId: formData.get("personId") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  await prisma.account.create({
    data: { name: parsed.data.name, personId: parsed.data.personId || null },
  });

  revalidatePath("/settings");
  return undefined;
}

export async function deleteAccount(id: string) {
  await prisma.account.delete({ where: { id } });
  revalidatePath("/settings");
}
