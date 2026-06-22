import { useMemo, useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import type { TranscriptionResult } from "@/lib/api";
import { formatDuration, formatTimestamp } from "@/lib/format";
import { Button } from "@/components/ui/button";

export interface TranscriptResultProps {
  result: TranscriptionResult;
  onReset: () => void;
}

export function TranscriptResult({ result, onReset }: TranscriptResultProps) {
  const [copied, setCopied] = useState(false);

  const fullText = useMemo(
    () => result.segments.map((s) => s.text).join(" ").trim(),
    [result.segments],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard bloqueado — silencioso
    }
  };

  const handleDownload = () => {
    const blob = new Blob(
      [JSON.stringify(result, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcricao-${result.model}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header com metadados */}
      <div className="flex flex-wrap items-center justify-between gap-3 border border-foreground/30 bg-muted/40 p-4">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-xs uppercase tracking-wider">
          <span>
            <span className="text-muted-foreground">Modelo</span>{" "}
            <strong className="text-foreground">{result.model}</strong>
          </span>
          <span>
            <span className="text-muted-foreground">Idioma</span>{" "}
            <strong className="text-foreground">
              {result.language}{" "}
              <span className="text-muted-foreground">
                ({Math.round(result.language_probability * 100)}%)
              </span>
            </strong>
          </span>
          <span>
            <span className="text-muted-foreground">Duração</span>{" "}
            <strong className="text-foreground">
              {formatDuration(result.duration)}
            </strong>
          </span>
          <span>
            <span className="text-muted-foreground">Segmentos</span>{" "}
            <strong className="text-foreground">{result.segments.length}</strong>
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copiado" : "Copiar"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            JSON
          </Button>
          <Button variant="ghost" size="sm" onClick={onReset}>
            Novo
          </Button>
        </div>
      </div>

      {/* Lista de segmentos */}
      <ol className="space-y-3">
        {result.segments.map((seg, i) => (
          <li
            key={i}
            className="border border-foreground/20 bg-background p-4"
          >
            <div className="mb-2 flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <span>#{i + 1}</span>
              <span>{formatTimestamp(seg.start)}</span>
              <span>→</span>
              <span>{formatTimestamp(seg.end)}</span>
            </div>
            <p className="text-sm leading-relaxed">{seg.text}</p>
            {seg.words && seg.words.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-foreground/10 pt-3 font-mono text-[11px] text-muted-foreground">
                {seg.words.map((w, j) => (
                  <span key={j} title={`prob ${w.probability.toFixed(2)}`}>
                    <span className="text-foreground/80">{w.word}</span>
                    <span className="ml-1 opacity-50">
                      {formatTimestamp(w.start)}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
