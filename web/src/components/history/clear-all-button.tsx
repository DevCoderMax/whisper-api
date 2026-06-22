import { Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";

export interface ClearAllButtonProps {
  count: number;
  onCleared: () => void;
}

export function ClearAllButton({ count, onCleared }: ClearAllButtonProps) {
  if (count < 2) return null;

  const handleClear = async () => {
    if (!window.confirm(`Apagar TODAS as ${count} entradas do histórico? Esta ação não pode ser desfeita.`)) {
      return;
    }
    if (!window.confirm(`Tem certeza? Os ${count} arquivos de áudio também serão apagados do disco.`)) {
      return;
    }
    try {
      await api.clearHistory();
      onCleared();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Falha ao limpar histórico";
      window.alert(msg);
    }
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleClear}>
      <Trash2 className="h-4 w-4" />
      Limpar histórico ({count})
    </Button>
  );
}
