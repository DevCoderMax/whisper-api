import { useEffect, useState } from "react";
import { Loader2, TriangleAlert } from "lucide-react";
import { Dropzone } from "@/components/transcribe/dropzone";
import { FilePreview } from "@/components/transcribe/file-preview";
import {
  ParametersForm,
  type Parameters,
} from "@/components/transcribe/parameters-form";
import { SubtitlePreview } from "./subtitle-preview";
import { BothPreview } from "./both-preview";
import { Button } from "@/components/ui/button";
import { FocusLayout } from "@/components/layout/focus-layout";
import {
  api,
  ApiError,
  type ModelsResponse,
  type WhisperModelName,
} from "@/lib/api";

const ALLOWED_EXT = [
  ".mp3", ".mp4", ".wav", ".m4a", ".ogg", ".flac", ".mkv", ".webm", ".mov",
];
const DEFAULT_MAX_MB = 500;

export type SubtitleFormat = "srt" | "vtt" | "both";

export interface SubtitleFlowProps {
  format: SubtitleFormat;
  title: string;
  subtitle: string;
}

export function SubtitleFlow({ format, title, subtitle }: SubtitleFlowProps) {
  const [modelsInfo, setModelsInfo] = useState<ModelsResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [params, setParams] = useState<Parameters | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [single, setSingle] = useState<string | null>(null);
  const [both, setBoth] = useState<{ srt: string; vtt: string } | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .listModels()
      .then((info) => {
        if (!alive) return;
        setModelsInfo(info);
        setParams({
          language: "pt",
          model: info.default,
          word_timestamps: true,
          vad_filter: true,
          ffmpeg_convert: false,
        });
      })
      .catch((e) => {
        if (!alive) return;
        const msg = e instanceof ApiError ? e.message : "Falha ao carregar modelos";
        setLoadError(msg);
      });
    return () => {
      alive = false;
    };
  }, []);

  const reset = () => {
    setFile(null);
    setSingle(null);
    setBoth(null);
    setSubmitError(null);
  };

  const handleSubmit = async () => {
    if (!file || !params) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("language", params.language);
      form.append("model", params.model);
      form.append("word_timestamps", String(params.word_timestamps));
      form.append("vad_filter", String(params.vad_filter));
      form.append("ffmpeg_convert", String(params.ffmpeg_convert));

      if (format === "srt") {
        setSingle(await api.subtitleSrt(form));
      } else if (format === "vtt") {
        setSingle(await api.subtitleVtt(form));
      } else {
        const r = await api.subtitleBoth(form);
        setBoth({ srt: r.srt, vtt: r.vtt });
      }
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Erro desconhecido ao gerar legenda";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) {
    return (
      <FocusLayout>
        <div className="mx-auto max-w-2xl px-6 py-10">
          <div className="flex items-start gap-3 border border-foreground bg-muted p-4">
            <TriangleAlert className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-mono text-xs uppercase tracking-widest">API indisponível</p>
              <p className="mt-1 text-sm">{loadError}</p>
            </div>
          </div>
        </div>
      </FocusLayout>
    );
  }

  if (!modelsInfo || !params) {
    return (
      <FocusLayout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </FocusLayout>
    );
  }

  if (submitting) {
    return (
      <FocusLayout>
        <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <div>
            <p className="font-display text-lg font-bold uppercase">Gerando {format.toUpperCase()}…</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Modelo <strong className="text-foreground">{params.model}</strong>
              {file && <> · {file.name}</>}
            </p>
          </div>
        </div>
      </FocusLayout>
    );
  }

  // Resultado
  if (single !== null || both !== null) {
    const baseFilename = file
      ? file.name.replace(/\.[^.]+$/, "")
      : "legenda";
    return (
      <FocusLayout>
        <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
          <header>
            <h1 className="font-display text-2xl font-bold uppercase">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </header>
          {single !== null && (
            <SubtitlePreview
              content={single}
              filename={`${baseFilename}.${format}`}
              mimeType={format === "vtt" ? "text/vtt" : "text/plain"}
              label={format.toUpperCase()}
            />
          )}
          {both !== null && (
            <BothPreview srt={both.srt} vtt={both.vtt} baseFilename={baseFilename} />
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={reset}>
              Nova legenda
            </Button>
          </div>
        </div>
      </FocusLayout>
    );
  }

  // Dropzone
  if (!file) {
    return (
      <FocusLayout>
        <Dropzone
          accept={ALLOWED_EXT}
          maxBytes={(modelsInfo.max_upload_size_mb ?? DEFAULT_MAX_MB) * 1024 * 1024}
          onFile={(f) => {
            setSubmitError(null);
            setFile(f);
          }}
        />
      </FocusLayout>
    );
  }

  // Config
  return (
    <FocusLayout>
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <header>
          <h1 className="font-display text-2xl font-bold uppercase">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </header>

        {submitError && (
          <div className="flex items-start gap-3 border border-foreground bg-muted p-4">
            <TriangleAlert className="h-5 w-5 shrink-0" />
            <div className="flex-1">
              <p className="font-mono text-xs uppercase tracking-widest">Erro</p>
              <p className="mt-1 text-sm">{submitError}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSubmit}>
              Tentar de novo
            </Button>
          </div>
        )}

        <FilePreview file={file} onChange={reset} />
        <ParametersForm
          value={params}
          onChange={setParams}
          availableModels={modelsInfo.available as readonly WhisperModelName[]}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={reset}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            Gerar {format.toUpperCase()}
          </Button>
        </div>
      </div>
    </FocusLayout>
  );
}
