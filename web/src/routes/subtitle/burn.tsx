import { createFileRoute } from "@tanstack/react-router";
import { BurnSubtitleFlow } from "@/components/subtitle/burn-subtitle-flow";

export const Route = createFileRoute("/subtitle/burn")({
  component: BurnSubtitleFlow,
});
