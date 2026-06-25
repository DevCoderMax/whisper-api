import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, TriangleAlert } from "lucide-react";
import { FocusLayout } from "@/components/layout/focus-layout";
import { Dropzone } from "@/components/transcribe/dropzone";
import { FilePreview } from "@/components/transcribe/file-preview";
import { ParametersForm, type Parameters } from "@/components/transcribe/parameters-form";
import { TranscriptResult } from "@/components/transcribe/transcript-result";
import { Button } from "@/components/ui/button";
import { api, ApiError, type ModelsResponse, type TranscriptionResult, type WhisperModelName } from "@/lib/api";

export const Route = createFileRoute("/transcribe")({
  component: TranscribePage,
});

const ALLOWED_EXT = [".mp3", ".mp4", ".wav", ".m4a", ".ogg", ".flac", ".mkv", ".webm", ".mov"];

function TranscribePage() {
  const [modelsInfo, setModelsInfo] = useState<ModelsResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [params, setParams] = useState<Parameters | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<TranscriptionResult | null>(null);

  // Carrega /models uma vez para descobrir default + max_upload_size_mb
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
    setResult(null);
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

      const r = await api.transcribe(form);
      setResult(r);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Erro desconhecido na transcrição";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Erro fatal ao carregar modelos
  if (loadError) {
    return (
      <FocusLayout>
        <div className="mx-auto max-w-2xl px-6 py-10">
          <div className="flex items-start gap-3 border border-foreground bg-muted p-4">
            <TriangleAlert className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-mono text-xs uppercase tracking-widest">API indisponível</p>
              <p className="mt-1 text-sm">{loadError}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Verifique se a API está rodando em <code>VITE_API_URL</code>.
              </p>
            </div>
          </div>
        </div>
      </FocusLayout>
    );
  }

  // Carregando
  if (!modelsInfo || !params) {
    return (
      <FocusLayout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </FocusLayout>
    );
  }

  // Estado: resultado
  if (result) {
    return (
      <FocusLayout>
        <div className="mx-auto max-w-4xl px-6 py-8">
          <TranscriptResult result={result} onReset={reset} />
        </div>
      </FocusLayout>
    );
  }

  // Estado: submitting
  if (submitting) {
    return (
      <FocusLayout>
        <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <div>
            <p className="font-display text-lg font-bold uppercase">Transcrevendo…</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Modelo <strong className="text-foreground">{params.model}</strong>
              {" · "}
              {file ? file.name : ""}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Isso pode levar alguns minutos para arquivos longos.
            </p>
          </div>
        </div>
      </FocusLayout>
    );
  }

  // Estado: dropzone
  if (!file) {
    return (
      <FocusLayout>
        <Dropzone
          accept={ALLOWED_EXT}
          maxBytes={modelsInfo.max_upload_size_mb * 1024 * 1024}
          onFile={(f) => {
            setSubmitError(null);
            setFile(f);
          }}
        />
      </FocusLayout>
    );
  }

  // Estado: arquivo selecionado + parâmetros
  return (
    <FocusLayout>
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <header>
          <h1 className="font-display text-2xl font-bold uppercase">Configurar transcrição</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Escolha os parâmetros ou mantenha os padrões.
          </p>
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
            Transcrever
          </Button>
        </div>
      </div>
    </FocusLayout>
  );
}
