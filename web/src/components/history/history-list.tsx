import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Download,
  History as HistoryIcon,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { api, ApiError, type HistoryDetail, type HistoryEntry } from "@/lib/api";
import { formatBytes, formatDuration } from "@/lib/format";
import { Button } from "@/components/ui/button";

const REFRESH_MS = 8_000;

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatLabel(fmt: HistoryEntry["format"]): string {
  switch (fmt) {
    case "transcribe": return "Transcrição";
    case "srt": return "SRT";
    case "vtt": return "VTT";
    case "both": return "SRT + VTT";
  }
}

export function HistoryList() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, HistoryDetail>>({});
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchList = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const list = await api.listHistory();
      setEntries(list);
      setError(null);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Falha ao listar histórico";
      setError(msg);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    const t = window.setInterval(() => fetchList(true), REFRESH_MS);
    return () => window.clearInterval(t);
  }, []);

  const toggleExpand = async (id: string) => {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    if (!details[id]) {
      try {
        const d = await api.getHistory(id);
        setDetails((prev) => ({ ...prev, [id]: d }));
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : "Falha ao carregar detalhes";
        setError(msg);
      }
    }
  };

  const handleDelete = async (id: string, filename: string) => {
    if (!window.confirm(`Apagar "${filename}" do histórico? Esta ação não pode ser desfeita.`)) {
      return;
    }
    setDeleting(id);
    try {
      await api.deleteHistory(id);
      await fetchList(true);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Falha ao apagar";
      setError(msg);
    } finally {
      setDeleting(null);
    }
  };

  const downloadBlob = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && entries.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
      </div>
    );
  }

  if (error && entries.length === 0) {
    return (
      <div className="border border-foreground bg-muted p-4 text-sm">
        <p className="font-mono text-xs uppercase tracking-widest">Erro</p>
        <p className="mt-1">{error}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => fetchList()}>
          <RefreshCw className="h-4 w-4" />
          Tentar de novo
        </Button>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="border border-dashed border-foreground/40 bg-background p-10 text-center">
        <HistoryIcon className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-3 font-display text-base font-bold uppercase">
          Histórico vazio
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          As transcrições e legendas que você gerar aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {entries.map((e) => {
        const isOpen = expanded === e.id;
        const detail = details[e.id];
        const baseFilename = e.original_filename.replace(/\.[^.]+$/, "");

        return (
          <li
            key={e.id}
            className="border border-foreground/30 bg-background"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-display text-base font-bold">
                    {e.original_filename}
                  </p>
                  <span className="border border-foreground/40 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                    {formatLabel(e.format)}
                  </span>
                </div>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {e.model} · {e.language} · {formatBytes(e.size_bytes)}
                  {" · "}
                  {formatDuration(e.duration)}
                  {" · "}
                  {formatDate(e.created_at)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleExpand(e.id)}
                >
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  Detalhes
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(e.id, e.original_filename)}
                  disabled={deleting === e.id}
                  aria-label="Apagar entrada"
                >
                  {deleting === e.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Apagar
                </Button>
              </div>
            </div>

            {/* Player de áudio + botões de download */}
            <div className="border-t border-foreground/20 bg-muted/30 p-4">
              <audio
                controls
                preload="metadata"
                src={api.audioUrl(e.id)}
                className="w-full"
              >
                Seu navegador não suporta o player de áudio.
              </audio>
              <div className="mt-3 flex flex-wrap gap-2">
                {e.has_srt && detail?.payload?.srt != null && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadBlob(String(detail.payload.srt), `${baseFilename}.srt`, "text/plain")
                    }
                  >
                    <Download className="h-4 w-4" />
                    Baixar SRT
                  </Button>
                )}
                {e.has_vtt && detail?.payload?.vtt != null && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadBlob(String(detail.payload.vtt), `${baseFilename}.vtt`, "text/vtt")
                    }
                  >
                    <Download className="h-4 w-4" />
                    Baixar VTT
                  </Button>
                )}
                {e.has_transcript && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (!detail) {
                        const d = await api.getHistory(e.id);
                        setDetails((prev) => ({ ...prev, [e.id]: d }));
                        downloadBlob(
                          JSON.stringify(d.payload, null, 2),
                          `${baseFilename}.json`,
                          "application/json",
                        );
                      } else {
                        downloadBlob(
                          JSON.stringify(detail.payload, null, 2),
                          `${baseFilename}.json`,
                          "application/json",
                        );
                      }
                    }}
                  >
                    <Download className="h-4 w-4" />
                    Baixar JSON
                  </Button>
                )}
              </div>
            </div>

            {/* Detalhes expandidos */}
            {isOpen && (
              <div className="border-t border-foreground/20 bg-background p-4">
                {!detail ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Carregando detalhes…
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      ID: {detail.id}
                    </div>
                    {Array.isArray((detail.payload as { segments?: unknown[] }).segments) ? (
                      <details>
                        <summary className="cursor-pointer font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground">
                          Ver transcrição completa (
                          {(detail.payload as { segments: unknown[] }).segments.length} segmentos)
                        </summary>
                        <pre className="mt-3 max-h-96 overflow-auto border border-foreground/20 bg-muted/30 p-3 font-mono text-xs">
                          {JSON.stringify(detail.payload, null, 2)}
                        </pre>
                      </details>
                    ) : (
                      <details>
                        <summary className="cursor-pointer font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground">
                          Ver payload bruto
                        </summary>
                        <pre className="mt-3 max-h-96 overflow-auto border border-foreground/20 bg-muted/30 p-3 font-mono text-xs">
                          {JSON.stringify(detail.payload, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
