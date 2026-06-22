import { createFileRoute } from "@tanstack/react-router";
import { FocusLayout } from "@/components/layout/focus-layout";
import { ModelList } from "@/components/models/model-list";

export const Route = createFileRoute("/models")({
  component: ModelsPage,
});

function ModelsPage() {
  return (
    <FocusLayout>
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <header>
          <h1 className="font-display text-2xl font-bold uppercase">Gerenciar modelos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Modelos carregados na VRAM. Descarregue manualmente para liberar memória.
          </p>
        </header>
        <ModelList />
      </div>
    </FocusLayout>
  );
}
