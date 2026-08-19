import { prisma } from "@/lib/prisma";
import { ExchangeRateForm } from "@/components/forms/exchange-rate-form";
import { CategoryForm } from "@/components/forms/category-form";
import { AccountForm } from "@/components/forms/account-form";
import { DeleteCategoryButton } from "@/components/forms/delete-category-button";
import { DeleteAccountButton } from "@/components/forms/delete-account-button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function SettingsPage() {
  const [rates, categories, accounts, people] = await Promise.all([
    prisma.exchangeRate.findMany(),
    prisma.category.findMany({ orderBy: [{ kind: "asc" }, { createdAt: "asc" }] }),
    prisma.account.findMany({ include: { person: true }, orderBy: { createdAt: "asc" } }),
    prisma.person.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const usd = rates.find((r) => r.currency === "USD")?.rateToARS ?? 1000;
  const brl = rates.find((r) => r.currency === "BRL")?.rateToARS ?? 180;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold">Ajustes</h1>
        <p className="text-sm text-muted-foreground">
          Cotizaciones, categorías y cajas.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Cotizaciones (base ARS)</h2>
        <p className="text-xs text-muted-foreground">
          Cargalas a mano cuando cambien — no se actualizan solas.
        </p>
        <ExchangeRateForm currency="USD" currentRate={usd} />
        <ExchangeRateForm currency="BRL" currentRate={brl} />
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Categorías</h2>
        <div className="space-y-2">
          {categories.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-center gap-3 py-2.5">
                <span className="text-xl">{c.icon}</span>
                <span className="flex-1 text-sm">{c.name}</span>
                <span className="text-xs text-muted-foreground">
                  {c.kind === "expense" ? "Gasto" : "Ingreso"}
                </span>
                <DeleteCategoryButton id={c.id} />
              </CardContent>
            </Card>
          ))}
        </div>
        <CategoryForm />
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Cajas / cuentas</h2>
        <div className="space-y-2">
          {accounts.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex items-center gap-3 py-2.5">
                <span className="flex-1 text-sm">{a.name}</span>
                <span className="text-xs text-muted-foreground">
                  {a.person?.name ?? "Compartida"}
                </span>
                <DeleteAccountButton id={a.id} />
              </CardContent>
            </Card>
          ))}
        </div>
        <AccountForm people={people} />
      </section>
    </div>
  );
}
