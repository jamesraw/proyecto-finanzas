import { prisma } from "@/lib/prisma";
import { formatAmount, formatARS, getRatesMap, toARS } from "@/lib/money";
import { TransactionFilters } from "@/components/forms/transaction-filters";
import { DeleteTransactionButton } from "@/components/forms/delete-transaction-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Paperclip } from "lucide-react";
import type { Prisma } from "@prisma/client";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ person?: string; scope?: string; category?: string; month?: string }>;
}) {
  const params = await searchParams;

  const where: Prisma.TransactionWhereInput = { isDraft: false };
  if (params.person) where.personId = params.person;
  if (params.scope === "personal" || params.scope === "shared") where.scope = params.scope;
  if (params.category) where.categoryId = params.category;
  if (params.month) {
    const [y, m] = params.month.split("-").map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 1);
    where.date = { gte: start, lt: end };
  }

  const [transactions, people, categories, rates] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      include: { category: true, person: true },
      take: 200,
    }),
    prisma.person.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.category.findMany({ where: { kind: "expense" }, orderBy: { createdAt: "asc" } }),
    getRatesMap(),
  ]);

  const groups = new Map<string, typeof transactions>();
  for (const tx of transactions) {
    const key = new Intl.DateTimeFormat("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(tx.date);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(tx);
  }

  const total = transactions.reduce(
    (sum, tx) => sum + toARS(tx.amount, tx.currency, rates),
    0
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Movimientos</h1>
      <TransactionFilters people={people} categories={categories} />

      <p className="text-sm text-muted-foreground">
        {transactions.length} movimientos · Total {formatARS(total)}
      </p>

      {transactions.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          🐾 No hay movimientos con estos filtros.
        </p>
      )}

      <div className="space-y-5">
        {[...groups.entries()].map(([day, txs]) => (
          <div key={day}>
            <h2 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
              {day}
            </h2>
            <div className="space-y-2">
              {txs.map((tx) => (
                <Card key={tx.id}>
                  <CardContent className="flex items-center gap-3 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-lg">
                      {tx.category?.icon ?? "💸"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {tx.category?.name ?? "Sin categoría"}
                        {tx.note ? ` · ${tx.note}` : ""}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: tx.person.color }}
                        />
                        {tx.person.name}
                        {tx.scope === "shared" && (
                          <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                            Compartido
                          </Badge>
                        )}
                        {tx.receiptUrl && (
                          <a
                            href={tx.receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-1 inline-flex items-center gap-0.5 text-primary"
                            aria-label="Ver comprobante"
                          >
                            <Paperclip className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-sm font-semibold">
                      <div>{formatAmount(tx.amount, tx.currency)}</div>
                      {tx.currency !== "ARS" && (
                        <div className="text-xs font-normal text-muted-foreground">
                          {formatARS(toARS(tx.amount, tx.currency, rates))}
                        </div>
                      )}
                    </div>
                    <DeleteTransactionButton id={tx.id} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
