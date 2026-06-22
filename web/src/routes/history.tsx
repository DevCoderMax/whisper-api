import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FocusLayout } from "@/components/layout/focus-layout";
import { HistoryList } from "@/components/history/history-list";
import { ClearAllButton } from "@/components/history/clear-all-button";
import { api } from "@/lib/api";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [count, setCount] = useState<number | null>(null);

  // Atualiza a contagem (p/ botão "Limpar tudo") e refaz o fetch quando muda refreshKey.
  useEffect(() => {
    let alive = true;
    api
      .listHistory()
      .then((list) => {
        if (alive) setCount(list.length);
      })
      .catch(() => {
        if (alive) setCount(0);
      });
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  return (
    <FocusLayout>
      <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold uppercase">Histórico</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Suas transcrições e legendas anteriores, com player e downloads.
            </p>
          </div>
          {count !== null && count >= 2 && (
            <ClearAllButton
              count={count}
              onCleared={() => setRefreshKey((k) => k + 1)}
            />
          )}
        </header>
        <HistoryList key={refreshKey} />
      </div>
    </FocusLayout>
  );
}
