import { PawPrint, LogOut } from "lucide-react";
import { PersonSwitcher } from "./person-switcher";
import { getActivePerson } from "@/lib/person";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export async function Header() {
  const { active, people } = await getActivePerson();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center gap-2 font-semibold">
        <PawPrint className="h-5 w-5 text-primary" />
        <span className="hidden sm:inline">Casa &amp; Caja</span>
      </div>
      <div className="flex items-center gap-2">
        <PersonSwitcher people={people} activeName={active?.name ?? null} />
        <form action={logout}>
          <Button variant="ghost" size="icon" type="submit" title="Salir">
            <LogOut className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}
