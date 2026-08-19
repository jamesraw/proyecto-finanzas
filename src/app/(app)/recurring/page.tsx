import { prisma } from "@/lib/prisma";
import { formatAmount } from "@/lib/money";
import { RecurringTemplateForm } from "@/components/forms/recurring-template-form";
import { ConfirmDraftForm } from "@/components/forms/confirm-draft-form";
import { GenerateDraftsButton } from "@/components/forms/generate-drafts-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RecurringToggle } from "@/components/forms/recurring-toggle";

export default async function RecurringPage() {
  const [templates, categories, people, drafts] = await Promise.all([
    prisma.recurringTransaction.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.category.findMany({ where: { kind: "expense" }, orderBy: { createdAt: "asc" } }),
    prisma.person.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.transaction.findMany({
      where: { isDraft: true },
      include: { category: true },
      orderBy: { date: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Gastos fijos</h1>

      <GenerateDraftsButton />

      {drafts.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold">Para confirmar este mes</h2>
          <div className="space-y-2">
            {drafts.map((d) => (
              <ConfirmDraftForm key={d.id} draft={d} />
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-2 text-sm font-semibold">Plantillas activas</h2>
        <div className="space-y-2">
          {templates.length === 0 && (
            <p className="text-sm text-muted-foreground">Todavía no creaste ningún fijo.</p>
          )}
          {templates.map((t) => (
            <Card key={t.id}>
              <CardContent className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {t.name}
                    {!t.active && (
                      <Badge variant="outline" className="text-[10px]">
                        Pausado
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatAmount(t.amount, t.currency)} · día {t.dayOfMonth} ·{" "}
                    {t.scope === "shared" ? "Compartido" : "Personal"}
                  </div>
                </div>
                <RecurringToggle id={t.id} active={t.active} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <RecurringTemplateForm categories={categories} people={people} />
    </div>
  );
}
