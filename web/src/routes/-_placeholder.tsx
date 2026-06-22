import { FocusLayout } from "@/components/layout/focus-layout";
import { Construction } from "lucide-react";

/**
 * Layout compartilhado para placeholders "Em breve" da Parte 1.
 * Usado por todas as rotas internas até a Parte 2+.
 */
export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <FocusLayout>
      <div className="flex h-full flex-col items-center justify-center gap-6 px-6 py-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center border border-foreground">
          <Construction className="h-7 w-7" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold uppercase">{title}</h1>
          <p className="mt-2 max-w-md text-sm opacity-70">{description}</p>
        </div>
        <p className="font-mono text-xs uppercase tracking-widest opacity-50">
          Disponível nas próximas partes
        </p>
      </div>
    </FocusLayout>
  );
}
