"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { PERSON_COOKIE } from "@/lib/session";

export async function setActivePerson(name: string) {
  const cookieStore = await cookies();
  cookieStore.set(PERSON_COOKIE, name, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/");
}
