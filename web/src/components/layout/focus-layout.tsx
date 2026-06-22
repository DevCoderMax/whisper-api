import { ArrowLeft } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

/**
 * Layout "foco" — para páginas internas (transcrição, legendas, etc.).
 * Sem cabeçalho cheio, sem navegação, sem distrações.
 * Mostra apenas o conteúdo da rota e um único botão de voltar.
 * Borda inferior suave (foreground/10) em vez de sólida.
 */
export function FocusLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-foreground/10 bg-muted/40 px-6 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.navigate({ to: "/" })}
          aria-label="Voltar para a página inicial"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <span className="font-display text-xs uppercase tracking-widest text-muted-foreground">
          Modo Foco
        </span>
      </header>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
