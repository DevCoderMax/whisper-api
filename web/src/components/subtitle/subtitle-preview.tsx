import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SubtitlePreviewProps {
  content: string;
  filename: string;
  mimeType: string;
  label: string;
}

export function SubtitlePreview({
  content,
  filename,
  mimeType,
  label,
}: SubtitlePreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard bloqueado — silencioso
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {label} · {content.length.toLocaleString("pt-BR")} caracteres
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copiado" : "Copiar"}
          </Button>
          <Button variant="default" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            Baixar
          </Button>
        </div>
      </div>
      <pre className="max-h-[60vh] overflow-auto border border-foreground/20 bg-muted/30 p-4 font-mono text-xs leading-relaxed">
{content}
      </pre>
    </div>
  );
}
