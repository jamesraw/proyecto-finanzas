import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddExpenseForm } from "@/components/forms/add-expense-form";
import { AddIncomeForm } from "@/components/forms/add-income-form";
import { prisma } from "@/lib/prisma";
import { getActivePerson } from "@/lib/person";

export default async function AddPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const [expenseCategories, incomeSources, { active, people }] = await Promise.all([
    prisma.category.findMany({ where: { kind: "expense" }, orderBy: { createdAt: "asc" } }),
    prisma.category.findMany({ where: { kind: "income" }, orderBy: { createdAt: "asc" } }),
    getActivePerson(),
  ]);

  if (!active) {
    return (
      <p className="text-sm text-muted-foreground">
        Primero necesitás crear personas (correlo el seed: <code>npm run db:seed</code>).
      </p>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Agregar</h1>
      <Tabs defaultValue={tab === "ingreso" ? "ingreso" : "gasto"}>
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="gasto" className="flex-1">
            Gasto
          </TabsTrigger>
          <TabsTrigger value="ingreso" className="flex-1">
            Ingreso
          </TabsTrigger>
        </TabsList>
        <TabsContent value="gasto">
          <AddExpenseForm
            categories={expenseCategories}
            people={people}
            activePersonId={active.id}
          />
        </TabsContent>
        <TabsContent value="ingreso">
          <AddIncomeForm
            incomeSources={incomeSources}
            people={people}
            activePersonId={active.id}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
