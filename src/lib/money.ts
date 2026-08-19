import type { Currency } from "@prisma/client";
import { prisma } from "./prisma";

/** Map of currency -> "1 unit of currency in ARS". ARS is always 1. */
export type RatesMap = Record<Currency, number>;

export async function getRatesMap(): Promise<RatesMap> {
  const rows = await prisma.exchangeRate.findMany();
  const map: RatesMap = { ARS: 1, USD: 0, BRL: 0 };
  for (const row of rows) {
    map[row.currency] = row.rateToARS;
  }
  // Safety fallback in case rates haven't been seeded yet.
  if (!map.USD) map.USD = 1000;
  if (!map.BRL) map.BRL = 180;
  map.ARS = 1;
  return map;
}

export function toARS(amount: number, currency: Currency, rates: RatesMap): number {
  return amount * (rates[currency] ?? 1);
}

export function formatARS(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatAmount(amount: number, currency: Currency): string {
  const currencyCode = currency === "ARS" ? "ARS" : currency === "USD" ? "USD" : "BRL";
  const locale = currency === "ARS" ? "es-AR" : currency === "USD" ? "en-US" : "pt-BR";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(amount);
}
