import { createFileRoute } from "@tanstack/react-router";
import { SubtitleFlow } from "@/components/subtitle/subtitle-flow";

export const Route = createFileRoute("/subtitle/vtt")({
  component: () => (
    <SubtitleFlow
      format="vtt"
      title="Legenda VTT"
      subtitle="Gera um arquivo .vtt para web players e HTML5 <track>."
    />
  ),
});
