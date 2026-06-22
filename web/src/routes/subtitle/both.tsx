import { createFileRoute } from "@tanstack/react-router";
import { SubtitleFlow } from "@/components/subtitle/subtitle-flow";

export const Route = createFileRoute("/subtitle/both")({
  component: () => (
    <SubtitleFlow
      format="both"
      title="Legenda SRT + VTT"
      subtitle="Gera os dois formatos em uma única requisição."
    />
  ),
});
