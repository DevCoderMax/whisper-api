import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Mic,
  Captions,
  Subtitles,
  FileText,
  Cpu,
  History as HistoryIcon,
  ArrowUpRight,
} from "lucide-react";
import { ModeToggle } from "@/components/ui/mode-toggle";
import {
  Card,
  CardTitle,
  CardDescription,
  CardIcon,
} from "@/components/ui/card";
import { api, ApiError } from "@/lib/api";

export const Route = createFileRoute("/")({ component: HomePage });

interface Feature {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  available: boolean;
  badge?: number;
}

function HomePage() {
  const [historyCount, setHistoryCount] = useState<number | null>(null);

  // Tenta pegar a contagem do histórico; em caso de erro, mostra sem badge.
  useEffect(() => {
    let alive = true;
    api
      .listHistory()
      .then((list) => {
        if (alive) setHistoryCount(list.length);
      })
      .catch((e) => {
        if (!alive) return;
        if (!(e instanceof ApiError)) return;
        // silencioso — a home funciona mesmo sem a API
        setHistoryCount(null);
      });
    return () => {
      alive = false;
    };
  }, []);

  const features: Feature[] = [
    {
      title: "Transcrever",
      description: "Converte áudio ou vídeo em texto com timestamps por palavra.",
      icon: Mic,
      to: "/transcribe",
      available: true,
    },
    {
      title: "Legenda SRT",
      description: "Gera um arquivo .srt pronto para subir em qualquer player.",
      icon: Captions,
      to: "/subtitle/srt",
      available: true,
    },
    {
      title: "Legenda VTT",
      description: "Gera um arquivo .vtt para web players e HTML5 <track>.",
      icon: Subtitles,
      to: "/subtitle/vtt",
      available: true,
    },
    {
      title: "SRT + VTT",
      description: "Baixa os dois formatos em uma única requisição.",
      icon: FileText,
      to: "/subtitle/both",
      available: true,
    },
    {
      title: "Gerenciar modelos",
      description: "Vê o que está na VRAM e descarrega para liberar memória.",
      icon: Cpu,
      to: "/models",
      available: true,
    },
    {
      title: "Histórico",
      description: "Suas transcrições e legendas anteriores, com player e downloads.",
      icon: HistoryIcon,
      to: "/history",
      available: true,
      badge: historyCount ?? undefined,
    },
  ];

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-foreground/10 bg-muted/40 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center border border-foreground/80">
            <Mic className="h-4 w-4" />
          </div>
          <div>
            <h1 className="font-display text-sm font-bold uppercase tracking-widest">
              Whisper
            </h1>
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              faster-whisper
            </p>
          </div>
        </div>
        <ModeToggle />
      </header>

      {/* Main */}
      <main className="flex-1 overflow-auto px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10">
            <h2 className="font-display text-3xl font-bold uppercase">
              O que você quer fazer?
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Escolha uma das funcionalidades abaixo. Ao entrar em uma tarefa,
              o app entra em modo foco — sem distrações, só um botão de voltar.
            </p>
          </div>

          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <li key={f.to}>
                <FeatureCard feature={f} />
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon;
  return (
    <Link to={feature.to} className="block h-full">
      <Card className="relative h-full cursor-pointer">
        <div className="flex items-start justify-between">
          <CardIcon>
            <Icon className="h-5 w-5" />
          </CardIcon>
          <div className="flex items-center gap-2">
            {typeof feature.badge === "number" && feature.badge > 0 && (
              <span
                className="border border-foreground bg-foreground px-1.5 py-0.5 font-mono text-[10px] font-bold text-background"
                aria-label={`${feature.badge} entradas`}
              >
                {feature.badge}
              </span>
            )}
            <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-opacity group-hover:text-foreground" />
          </div>
        </div>
        <div className="mt-2 flex flex-col gap-1">
          <CardTitle>{feature.title}</CardTitle>
          <CardDescription>{feature.description}</CardDescription>
        </div>
      </Card>
    </Link>
  );
}
