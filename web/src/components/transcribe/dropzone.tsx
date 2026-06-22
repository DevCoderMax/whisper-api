import { useCallback, useRef, useState } from "react";
import { UploadCloud, FileAudio, FileVideo } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/format";

const VIDEO_EXT = new Set([".mp4", ".mkv", ".webm", ".mov"]);

function isVideo(name: string): boolean {
  const ext = name.toLowerCase().match(/\.[^.]+$/)?.[0] ?? "";
  return VIDEO_EXT.has(ext);
}

function isAllowed(name: string, allowed: string[]): boolean {
  const ext = name.toLowerCase().match(/\.[^.]+$/)?.[0] ?? "";
  return allowed.includes(ext);
}

export interface DropzoneProps {
  accept: string[];
  maxBytes: number;
  onFile: (file: File) => void;
}

export function Dropzone({ accept, maxBytes, onFile }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = useCallback(
    (file: File): string | null => {
      if (!isAllowed(file.name, accept)) {
        return `Formato não suportado. Use: ${accept.join(", ")}`;
      }
      if (file.size > maxBytes) {
        return `Arquivo muito grande: ${formatBytes(file.size)} (máx ${formatBytes(maxBytes)})`;
      }
      return null;
    },
    [accept, maxBytes],
  );

  const handleFile = useCallback(
    (file: File) => {
      const err = validate(file);
      if (err) {
        setError(err);
        return;
      }
      setError(null);
      onFile(file);
    },
    [validate, onFile],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    // Permite re-selecionar o mesmo arquivo
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-6">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={cn(
          "group flex h-[60vh] w-full max-w-3xl flex-col items-center justify-center gap-6 border-2 border-dashed p-10 text-center transition-colors",
          isDragging
            ? "border-foreground bg-muted"
            : "border-foreground/40 bg-background hover:border-foreground hover:bg-muted/40",
        )}
        aria-label="Selecionar arquivo de áudio ou vídeo"
      >
        <div className="flex h-16 w-16 items-center justify-center border border-foreground/60 transition-colors group-hover:border-foreground">
          <UploadCloud className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <h2 className="font-display text-2xl font-bold uppercase">
            Solte o arquivo aqui
          </h2>
          <p className="text-sm text-muted-foreground">
            ou <span className="underline">clique para selecionar</span>
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <FileAudio className="h-3 w-3" />
            Áudio
          </span>
          <span>·</span>
          <span className="inline-flex items-center gap-1">
            <FileVideo className="h-3 w-3" />
            Vídeo
          </span>
          <span>·</span>
          <span>máx {formatBytes(maxBytes)}</span>
        </div>
      </button>

      {error && (
        <p
          role="alert"
          className="mt-4 max-w-3xl border border-foreground bg-muted px-4 py-3 text-sm"
        >
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept.join(",")}
        onChange={onInputChange}
        className="sr-only"
        tabIndex={-1}
      />
    </div>
  );
}

// Re-exportado para outros componentes
export { isVideo };
