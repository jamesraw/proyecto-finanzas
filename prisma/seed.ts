import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // --- People -------------------------------------------------------------
  const chino = await prisma.person.upsert({
    where: { name: "Chino" },
    update: {},
    create: { name: "Chino", color: "#2563eb" }, // blue
  });

  const rosario = await prisma.person.upsert({
    where: { name: "Rosario" },
    update: {},
    create: { name: "Rosario", color: "#db2777" }, // pink
  });

  // --- Exchange rates (PLACEHOLDERS — update these in Settings!) ----------
  // Base display currency is ARS. rateToARS = how many ARS is 1 unit of currency.
  await prisma.exchangeRate.upsert({
    where: { currency: "USD" },
    update: {},
    create: { currency: "USD", rateToARS: 1000 }, // placeholder, update in Settings
  });

  await prisma.exchangeRate.upsert({
    where: { currency: "BRL" },
    update: {},
    create: { currency: "BRL", rateToARS: 180 }, // placeholder, update in Settings
  });

  // --- Expense categories ---------------------------------------------------
  const expenseCategories = [
    { name: "Alquiler", icon: "🏠", color: "#f97316" },
    { name: "Supermercado", icon: "🛒", color: "#22c55e" },
    { name: "Servicios", icon: "💡", color: "#eab308" },
    { name: "Salidas", icon: "🍻", color: "#a855f7" },
    { name: "Transporte", icon: "🚌", color: "#0ea5e9" },
    { name: "Salud", icon: "💊", color: "#ef4444" },
    { name: "Mascotas", icon: "🐾", color: "#c1602f" },
    { name: "Ahorro", icon: "🐷", color: "#14b8a6" },
    { name: "Otros", icon: "📦", color: "#64748b" },
  ];

  for (const cat of expenseCategories) {
    await prisma.category.upsert({
      where: { name_kind: { name: cat.name, kind: "expense" } },
      update: {},
      create: { ...cat, kind: "expense" },
    });
  }

  // --- Income categories ------------------------------------------------
  const incomeCategories = [
    { name: "Sueldo", icon: "💼", color: "#2563eb" },
    { name: "Freelance", icon: "💻", color: "#7c3aed" },
    { name: "Otro", icon: "✨", color: "#64748b" },
  ];

  for (const cat of incomeCategories) {
    await prisma.category.upsert({
      where: { name_kind: { name: cat.name, kind: "income" } },
      update: {},
      create: { ...cat, kind: "income" },
    });
  }

  // --- Default accounts ("cajas") ----------------------------------------
  await prisma.account.upsert({
    where: { id: "seed-caja-compartida" },
    update: {},
    create: {
      id: "seed-caja-compartida",
      name: "Caja compartida casa",
      personId: null,
    },
  });

  await prisma.account.upsert({
    where: { id: "seed-efectivo-chino" },
    update: {},
    create: { id: "seed-efectivo-chino", name: "Efectivo Chino", personId: chino.id },
  });

  await prisma.account.upsert({
    where: { id: "seed-efectivo-rosario" },
    update: {},
    create: {
      id: "seed-efectivo-rosario",
      name: "Efectivo Rosario",
      personId: rosario.id,
    },
  });

  console.log("Seed completado: personas, categorías, cotizaciones y cajas creadas.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
