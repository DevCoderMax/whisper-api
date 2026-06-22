import { createFileRoute } from "@tanstack/react-router";
import { SubtitleFlow } from "@/components/subtitle/subtitle-flow";

export const Route = createFileRoute("/subtitle/srt")({
  component: () => (
    <SubtitleFlow
      format="srt"
      title="Legenda SRT"
      subtitle="Gera um arquivo .srt pronto para qualquer player."
    />
  ),
});
