import { useEffect, useState } from "react";
import { Loader2, TriangleAlert } from "lucide-react";
import { Dropzone } from "@/components/transcribe/dropzone";
import { FilePreview } from "@/components/transcribe/file-preview";
import {
  ParametersForm,
  type Parameters,
} from "@/components/transcribe/parameters-form";
import { Button } from "@/components/ui/button";
import { FocusLayout } from "@/components/layout/focus-layout";
import {
  api,
  ApiError,
  type ModelsResponse,
  type WhisperModelName,
} from "@/lib/api";

const VIDEO_EXT = [".mp4", ".mkv", ".webm", ".mov"];
const SRT_EXT = [".srt"];
const DEFAULT_MAX_MB = 500;

type BurnMode = "srt" | "transcribe";

export function BurnSubtitleFlow() {
  const [modelsInfo, setModelsInfo] = useState<ModelsResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [mode, setMode] = useState<BurnMode | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [srtFile, setSrtFile] = useState<File | null>(null);
  const [params, setParams] = useState<Parameters | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

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
    setMode(null);
    setVideoFile(null);
    setSrtFile(null);
    setResult(null);
    setSubmitError(null);
  };

  const handleSubmit = async () => {
    if (!videoFile || !params) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      throw new ApiError("Funcionalidade ainda não implementada", 501, null);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Erro desconhecido";
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
            <p className="font-display text-lg font-bold uppercase">Incorporando legenda ao vídeo…</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {videoFile && <>{videoFile.name}</>}
            </p>
          </div>
        </div>
      </FocusLayout>
    );
  }

  if (result !== null) {
    return (
      <FocusLayout>
        <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
          <header>
            <h1 className="font-display text-2xl font-bold uppercase">Adicionar legenda ao vídeo</h1>
            <p className="mt-1 text-sm text-muted-foreground">Legenda incorporada com sucesso.</p>
          </header>
          <div className="border border-foreground bg-muted p-4">
            <p className="font-mono text-sm">Funcionalidade ainda não implementada no backend.</p>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={reset}>
              Nova legenda
            </Button>
          </div>
        </div>
      </FocusLayout>
    );
  }

  // Modo não selecionado
  if (!mode) {
    return (
      <FocusLayout>
        <div className="mx-auto max-w-2xl space-y-6 px-6 py-10">
          <header>
            <h1 className="font-display text-2xl font-bold uppercase">Adicionar legenda ao vídeo</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Escolha como deseja adicionar a legenda ao vídeo.
            </p>
          </header>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode("srt")}
              className="flex flex-col items-start gap-2 border border-foreground/40 bg-background p-6 text-left transition-colors hover:border-foreground hover:bg-muted"
            >
              <span className="font-display text-lg font-bold uppercase">Adicionar arquivo SRT</span>
              <span className="text-sm text-muted-foreground">
                Já tenho um arquivo .srt pronto para incorporar ao vídeo.
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMode("transcribe")}
              className="flex flex-col items-start gap-2 border border-foreground/40 bg-background p-6 text-left transition-colors hover:border-foreground hover:bg-muted"
            >
              <span className="font-display text-lg font-bold uppercase">Transcrever</span>
              <span className="text-sm text-muted-foreground">
                Transcrever o áudio do vídeo e gerar a legenda automaticamente.
              </span>
            </button>
          </div>
        </div>
      </FocusLayout>
    );
  }

  // Modo SRT: upload vídeo + SRT
  if (mode === "srt") {
    if (!videoFile) {
      return (
        <FocusLayout>
          <div className="mx-auto max-w-2xl px-6 py-10">
            <header className="mb-6">
              <h1 className="font-display text-2xl font-bold uppercase">Selecionar vídeo</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Passo 1 de 2 — selecione o arquivo de vídeo.
              </p>
            </header>
            <Dropzone
              accept={VIDEO_EXT}
              maxBytes={(modelsInfo.max_upload_size_mb ?? DEFAULT_MAX_MB) * 1024 * 1024}
              onFile={(f) => {
                setSubmitError(null);
                setVideoFile(f);
              }}
            />
          </div>
        </FocusLayout>
      );
    }

    if (!srtFile) {
      return (
        <FocusLayout>
          <div className="mx-auto max-w-2xl space-y-6 px-6 py-10">
            <header>
              <h1 className="font-display text-2xl font-bold uppercase">Selecionar legenda SRT</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Passo 2 de 2 — selecione o arquivo .srt.
              </p>
            </header>
            <FilePreview file={videoFile} onChange={() => setVideoFile(null)} />
            <Dropzone
              accept={SRT_EXT}
              maxBytes={10 * 1024 * 1024}
              onFile={(f) => {
                setSubmitError(null);
                setSrtFile(f);
              }}
            />
          </div>
        </FocusLayout>
      );
    }

    // Ambos selecionados
    return (
      <FocusLayout>
        <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
          <header>
            <h1 className="font-display text-2xl font-bold uppercase">Confirmar</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Revise os arquivos antes de incorporar a legenda.
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

          <FilePreview file={videoFile} onChange={() => { setVideoFile(null); setSrtFile(null); }} />
          <FilePreview file={srtFile} onChange={() => setSrtFile(null)} />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={reset}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              Incorporar legenda
            </Button>
          </div>
        </div>
      </FocusLayout>
    );
  }

  // Modo Transcrever: upload vídeo + parâmetros
  if (!videoFile) {
    return (
      <FocusLayout>
        <Dropzone
          accept={VIDEO_EXT}
          maxBytes={(modelsInfo.max_upload_size_mb ?? DEFAULT_MAX_MB) * 1024 * 1024}
          onFile={(f) => {
            setSubmitError(null);
            setVideoFile(f);
          }}
        />
      </FocusLayout>
    );
  }

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

        <FilePreview file={videoFile} onChange={() => setVideoFile(null)} />
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
            Transcrever e incorporar
          </Button>
        </div>
      </div>
    </FocusLayout>
  );
}
