import { useEffect, useState } from "react";
import { Cpu, Loader2, PowerOff, RefreshCw } from "lucide-react";
import { api, ApiError, type ModelsStatus, type WhisperModelName } from "@/lib/api";
import { formatDuration } from "@/lib/format";
import { Button } from "@/components/ui/button";

const REFRESH_MS = 5_000;

export function ModelList() {
  const [status, setStatus] = useState<ModelsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unloading, setUnloading] = useState<string | null>(null);

  const fetchStatus = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const s = await api.modelsStatus();
      setStatus(s);
      setError(null);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Falha ao buscar status";
      setError(msg);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const t = window.setInterval(() => fetchStatus(true), REFRESH_MS);
    return () => window.clearInterval(t);
  }, []);

  const handleUnload = async (name: WhisperModelName) => {
    setUnloading(name);
    try {
      await api.unloadModel(name);
      await fetchStatus(true);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Falha ao descarregar";
      setError(msg);
    } finally {
      setUnloading(null);
    }
  };

  if (loading && !status) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className="border border-foreground bg-muted p-4 text-sm">
        <p className="font-mono text-xs uppercase tracking-widest">API indisponível</p>
        <p className="mt-1">{error}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => fetchStatus()}>
          <RefreshCw className="h-4 w-4" />
          Tentar de novo
        </Button>
      </div>
    );
  }

  if (!status) return null;

  const entries = Object.entries(status.loaded_models);
  const isAutoUnload = status.auto_unload;

  return (
    <div className="space-y-4">
      {/* Header com info de timeout */}
      <div className="flex flex-wrap items-center justify-between gap-3 border border-foreground/30 bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider">
          <Cpu className="h-4 w-4" />
          <span>
            Auto-unload:{" "}
            <strong className="text-foreground">
              {isAutoUnload ? `${formatDuration(status.timeout_seconds)} de inatividade` : "desativado"}
            </strong>
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => fetchStatus()}>
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Empty state */}
      {entries.length === 0 ? (
        <div className="border border-dashed border-foreground/40 bg-background p-10 text-center">
          <Cpu className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-display text-base font-bold uppercase">
            Nenhum modelo na VRAM
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Modelos são carregados sob demanda na primeira transcrição.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {entries.map(([name, info]) => (
            <li
              key={name}
              className="flex flex-wrap items-center justify-between gap-3 border border-foreground/30 bg-background px-4 py-3"
            >
              <div className="min-w-0">
                <p className="font-display text-base font-bold">{name}</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Ocioso há {formatDuration(info.idle_seconds)}
                  {info.unloads_in != null && (
                    <> · descarrega em {formatDuration(info.unloads_in)}</>
                  )}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUnload(name as WhisperModelName)}
                disabled={unloading === name}
              >
                {unloading === name ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PowerOff className="h-4 w-4" />
                )}
                Descarregar
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
