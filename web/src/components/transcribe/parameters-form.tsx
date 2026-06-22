import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { WhisperModelName } from "@/lib/api";

export interface Parameters {
  language: string;
  model: WhisperModelName;
  word_timestamps: boolean;
  vad_filter: boolean;
  ffmpeg_convert: boolean;
}

export interface ParametersFormProps {
  value: Parameters;
  onChange: (next: Parameters) => void;
  availableModels: readonly WhisperModelName[];
  disabled?: boolean;
}

export function ParametersForm({
  value,
  onChange,
  availableModels,
  disabled,
}: ParametersFormProps) {
  const set = <K extends keyof Parameters>(k: K, v: Parameters[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {/* Idioma */}
      <div className="space-y-2">
        <Label htmlFor="lang">Idioma</Label>
        <Input
          id="lang"
          value={value.language}
          onChange={(e) => set("language", e.target.value.toLowerCase())}
          placeholder="pt"
          maxLength={8}
          disabled={disabled}
        />
      </div>

      {/* Modelo */}
      <div className="space-y-2">
        <Label htmlFor="model">Modelo</Label>
        <Select
          id="model"
          value={value.model}
          onChange={(e) => set("model", e.target.value as WhisperModelName)}
          disabled={disabled}
        >
          {availableModels.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>
      </div>

      {/* Word timestamps */}
      <div className="flex items-center justify-between border border-foreground/30 bg-muted/40 px-4 py-3">
        <div>
          <Label htmlFor="word-ts" className="text-foreground">
            Timestamps por palavra
          </Label>
          <p className="text-[11px] text-muted-foreground">
            Mostra o tempo de cada palavra
          </p>
        </div>
        <Switch
          id="word-ts"
          checked={value.word_timestamps}
          onCheckedChange={(v) => set("word_timestamps", v)}
          disabled={disabled}
        />
      </div>

      {/* VAD filter */}
      <div className="flex items-center justify-between border border-foreground/30 bg-muted/40 px-4 py-3">
        <div>
          <Label htmlFor="vad" className="text-foreground">
            Filtro VAD
          </Label>
          <p className="text-[11px] text-muted-foreground">
            Remove silêncios automaticamente
          </p>
        </div>
        <Switch
          id="vad"
          checked={value.vad_filter}
          onCheckedChange={(v) => set("vad_filter", v)}
          disabled={disabled}
        />
      </div>

      {/* FFmpeg convert */}
      <div className="flex items-center justify-between border border-foreground/30 bg-muted/40 px-4 py-3 sm:col-span-2">
        <div>
          <Label htmlFor="ffmpeg" className="text-foreground">
            Converter para WAV antes
          </Label>
          <p className="text-[11px] text-muted-foreground">
            Mais rápido em arquivos "sujos"; pode perder a trilha original
          </p>
        </div>
        <Switch
          id="ffmpeg"
          checked={value.ffmpeg_convert}
          onCheckedChange={(v) => set("ffmpeg_convert", v)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
