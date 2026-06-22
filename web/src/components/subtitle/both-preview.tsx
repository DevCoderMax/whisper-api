import { SubtitlePreview } from "./subtitle-preview";

export interface BothPreviewProps {
  srt: string;
  vtt: string;
  baseFilename: string;
}

export function BothPreview({ srt, vtt, baseFilename }: BothPreviewProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <SubtitlePreview
        content={srt}
        filename={`${baseFilename}.srt`}
        mimeType="text/plain"
        label="SRT"
      />
      <SubtitlePreview
        content={vtt}
        filename={`${baseFilename}.vtt`}
        mimeType="text/vtt"
        label="VTT"
      />
    </div>
  );
}
