import MiniAudioPlayer from "./MiniAudioPlayer";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";

import { RecordingCardProps } from "@/types";

export default function RecordingCard({ recording, onClick }: RecordingCardProps) {
  return (
    <Card
      key={recording.id}
      className="group cursor-pointer transition-all duration-200 hover:shadow-md border border-border/50 hover:border-border"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Audio Player */}
          {recording.audiohqid && (
            <div className="flex-shrink-0" onPointerDown={(e) => e.preventDefault()}>
              <MiniAudioPlayer
                recording={recording}
                title={recording.species?.common_name}
                size={44}
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
                  {recording.species?.common_name}
                </h3>
                {recording.species && (
                  <p className="text-muted-foreground italic text-sm mt-1">
                    {recording.species.scientific_name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {recording.species && (
                <Badge variant="secondary" className="text-xs">
                  {recording.species.common_name}
                </Badge>
              )}
            </div>

            {recording.caption && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {recording.caption}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
