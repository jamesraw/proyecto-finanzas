import { prisma } from "./prisma";
import { getRatesMap, toARS } from "./money";

export function getMonthRange(reference: Date = new Date()) {
  const start = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 1);
  return { start, end };
}

export type PersonSummary = {
  id: string;
  name: string;
  color: string;
  personalSpentARS: number;
  sharedCostARS: number; // this person's fair share of shared expenses
  totalSpentARS: number; // personal + their share of shared
  incomeARS: number;
  netSavingsARS: number;
};

export type MonthSummary = {
  people: PersonSummary[];
  totalSharedExpenseARS: number;
  totalIncomeARS: number;
  totalSpentARS: number;
  combinedSavingsARS: number;
  settleUp: {
    fromPersonId: string;
    fromName: string;
    toPersonId: string;
    toName: string;
    amountARS: number;
  } | null;
};

export async function getMonthSummary(reference: Date = new Date()): Promise<MonthSummary> {
  const { start, end } = getMonthRange(reference);

  const [people, transactions, incomes, rates] = await Promise.all([
    prisma.person.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.transaction.findMany({
      where: { date: { gte: start, lt: end }, isDraft: false },
    }),
    prisma.income.findMany({ where: { date: { gte: start, lt: end } } }),
    getRatesMap(),
  ]);

  const summaries = new Map<string, PersonSummary>();
  for (const p of people) {
    summaries.set(p.id, {
      id: p.id,
      name: p.name,
      color: p.color,
      personalSpentARS: 0,
      sharedCostARS: 0,
      totalSpentARS: 0,
      incomeARS: 0,
      netSavingsARS: 0,
    });
  }

  // owedToPayer[payerId] = ARS amount the *other* person owes that payer
  const owedToPayer = new Map<string, number>();
  let totalSharedExpenseARS = 0;

  for (const tx of transactions) {
    const amountARS = toARS(tx.amount, tx.currency, rates);

    if (tx.scope === "personal") {
      const summary = summaries.get(tx.personId);
      if (summary) summary.personalSpentARS += amountARS;
      continue;
    }

    // shared
    totalSharedExpenseARS += amountARS;
    const payerShare = tx.payerShare ?? 0.5;
    const otherShare = tx.otherShare ?? 0.5;

    const payerSummary = summaries.get(tx.personId);
    if (payerSummary) payerSummary.sharedCostARS += amountARS * payerShare;

    const otherPerson = people.find((p) => p.id !== tx.personId);
    if (otherPerson) {
      const otherSummary = summaries.get(otherPerson.id);
      if (otherSummary) otherSummary.sharedCostARS += amountARS * otherShare;
    }

    owedToPayer.set(
      tx.personId,
      (owedToPayer.get(tx.personId) ?? 0) + amountARS * otherShare
    );
  }

  for (const inc of incomes) {
    const summary = summaries.get(inc.personId);
    if (summary) summary.incomeARS += toARS(inc.amount, inc.currency, rates);
  }

  let totalIncomeARS = 0;
  let totalSpentARS = 0;
  for (const summary of summaries.values()) {
    summary.totalSpentARS = summary.personalSpentARS + summary.sharedCostARS;
    summary.netSavingsARS = summary.incomeARS - summary.totalSpentARS;
    totalIncomeARS += summary.incomeARS;
    totalSpentARS += summary.totalSpentARS;
  }

  // Settle-up: only meaningful with exactly 2 people, but written to degrade
  // gracefully if that ever changes.
  let settleUp: MonthSummary["settleUp"] = null;
  if (people.length === 2) {
    const [a, b] = people;
    const aOwedByB = owedToPayer.get(a.id) ?? 0; // b owes a
    const bOwedByA = owedToPayer.get(b.id) ?? 0; // a owes b
    const net = aOwedByB - bOwedByA;
    if (Math.abs(net) > 1) {
      settleUp =
        net > 0
          ? {
              fromPersonId: b.id,
              fromName: b.name,
              toPersonId: a.id,
              toName: a.name,
              amountARS: net,
            }
          : {
              fromPersonId: a.id,
              fromName: a.name,
              toPersonId: b.id,
              toName: b.name,
              amountARS: -net,
            };
    }
  }

  return {
    people: [...summaries.values()],
    totalSharedExpenseARS,
    totalIncomeARS,
    totalSpentARS,
    combinedSavingsARS: totalIncomeARS - totalSpentARS,
    settleUp,
  };
}
