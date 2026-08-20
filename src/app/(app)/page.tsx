import { getMonthSummary } from "@/lib/dashboard";
import { formatARS, formatAmount, getRatesMap, toARS } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Paperclip, PiggyBank, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";

const monthLabel = new Intl.DateTimeFormat("es-AR", {
  month: "long",
  year: "numeric",
}).format(new Date());

export default async function DashboardPage() {
  const summary = await getMonthSummary();
  const [recentTransactions, rates] = await Promise.all([
    prisma.transaction.findMany({
      where: { isDraft: false },
      orderBy: { date: "desc" },
      take: 5,
      include: { category: true, person: true },
    }),
    getRatesMap(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold capitalize">{monthLabel}</h1>
        <p className="text-sm text-muted-foreground">Resumen del mes</p>
      </div>

      {/* Combined savings */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Ahorro combinado del mes
          </CardTitle>
          <PiggyBank className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              summary.combinedSavingsARS >= 0 ? "text-emerald-600" : "text-destructive"
            }`}
          >
            {formatARS(summary.combinedSavingsARS)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Ingresos {formatARS(summary.totalIncomeARS)} · Gastos{" "}
            {formatARS(summary.totalSpentARS)}
          </p>
        </CardContent>
      </Card>

      {/* Per-person cards */}
      <div className="grid grid-cols-2 gap-3">
        {summary.people.map((p) => (
          <Card key={p.id}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
                {p.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div
                className={`text-lg font-semibold ${
                  p.netSavingsARS >= 0 ? "text-emerald-600" : "text-destructive"
                }`}
              >
                {formatARS(p.netSavingsARS)}
              </div>
              <p className="text-xs text-muted-foreground">ahorro neto</p>
              <div className="pt-1 text-xs text-muted-foreground">
                <div>Ingresos: {formatARS(p.incomeARS)}</div>
                <div>Gastos propios: {formatARS(p.personalSpentARS)}</div>
                <div>Parte compartida: {formatARS(p.sharedCostARS)}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Caja compartida */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Caja compartida
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-xl font-bold">
              {formatARS(summary.totalSharedExpenseARS)}
            </div>
            <p className="text-xs text-muted-foreground">gastado en compartidos este mes</p>
          </div>

          {summary.settleUp ? (
            <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm">
              <span className="font-medium">{summary.settleUp.fromName}</span>
              <span className="text-muted-foreground">le debe a</span>
              <span className="font-medium">{summary.settleUp.toName}</span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              <Badge variant="secondary" className="ml-auto">
                {formatARS(summary.settleUp.amountARS)}
              </Badge>
            </div>
          ) : (
            <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              Están a mano — nadie le debe nada al otro. 🎉
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent transactions */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Últimos movimientos</h2>
          <a href="/transactions" className="text-xs text-primary">
            Ver todos
          </a>
        </div>
        <div className="space-y-2">
          {recentTransactions.length === 0 && (
            <p className="text-sm text-muted-foreground">
              🐾 Todavía no hay movimientos este mes.
            </p>
          )}
          {recentTransactions.map((tx) => (
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
                  <div className="text-xs text-muted-foreground">
                    {tx.person.name} ·{" "}
                    {new Intl.DateTimeFormat("es-AR", {
                      day: "2-digit",
                      month: "2-digit",
                    }).format(tx.date)}
                    {tx.scope === "shared" ? " · Compartido" : ""}
                    {tx.receiptUrl && (
                      <a
                        href={tx.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-1 inline-flex items-center text-primary"
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
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
