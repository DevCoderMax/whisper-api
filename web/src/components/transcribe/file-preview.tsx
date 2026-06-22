import { FileAudio, FileVideo, X } from "lucide-react";
import { formatBytes } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { isVideo } from "./dropzone";

export interface FilePreviewProps {
  file: File;
  onChange: () => void;
}

export function FilePreview({ file, onChange }: FilePreviewProps) {
  const Icon = isVideo(file.name) ? FileVideo : FileAudio;

  return (
    <div className="flex items-center gap-4 border border-foreground/30 bg-muted p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-foreground/60">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-sm">{file.name}</p>
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {formatBytes(file.size)}
        </p>
      </div>
      <Button variant="ghost" size="sm" onClick={onChange}>
        <X className="h-4 w-4" />
        Trocar
      </Button>
    </div>
  );
}
