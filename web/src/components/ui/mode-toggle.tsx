import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/stores/theme";
import { Button } from "@/components/ui/button";

export function ModeToggle() {
  const { theme, toggle } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggle}
      aria-label={isDark ? "Trocar para tema claro" : "Trocar para tema escuro"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
