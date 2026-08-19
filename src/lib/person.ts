import { cookies } from "next/headers";
import { PERSON_COOKIE } from "./session";
import { prisma } from "./prisma";

/** Reads the "active person" cookie (who is currently using the app / logging entries). */
export async function getActivePersonName(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(PERSON_COOKIE)?.value ?? null;
}

/** Resolves the active person cookie to a real Person row, falling back to the first person. */
export async function getActivePerson() {
  const name = await getActivePersonName();
  const people = await prisma.person.findMany({ orderBy: { createdAt: "asc" } });
  const active = people.find((p) => p.name === name) ?? people[0] ?? null;
  return { active, people };
}
