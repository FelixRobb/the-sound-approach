"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { ENV } from "@/env";

export default function RecordingPage() {
  const params = useParams();
  const router = useRouter();
  const [recording, setRecording] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/signin");
        return;
      }
      try {
        const { data, error } = await supabase
          .from("recordings")
          .select("*")
          .eq("id", params.id)
          .single();
        if (error || !data) {
          setError("Recording not found.");
        } else {
          setRecording(data);
        }
      } catch (err: any) {
        setError("Failed to fetch recording.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id, router]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!recording) return <div className="text-center text-red-500">Recording not found.</div>;

  const audioUrl = recording.audiohqid
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${ENV.AUDIO_HQ_BUCKET}/${recording.audiohqid}.wav`
    : null;
  const videoUrl = recording.sonogramvideoid
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${ENV.SONOGRAMS_BUCKET}/${recording.sonogramvideoid}.mp4`
    : null;

  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Card className="w-full max-w-2xl p-8 space-y-6 bg-white/90 border border-gray-100 shadow-xl rounded-xl">
        <h2 className="text-2xl font-bold mb-2 text-blue-900">{recording.title}</h2>
        <div className="text-gray-500 mb-2">Page {recording.book_page_number}</div>
        <div className="mb-4 text-gray-700 text-base leading-relaxed">{recording.caption}</div>
        {audioUrl && (
          <div>
            <div className="font-semibold mb-1">Audio</div>
            <audio controls src={audioUrl} className="w-full rounded" />
          </div>
        )}
        {videoUrl && (
          <div>
            <div className="font-semibold mb-1 mt-4">Sonogram Video</div>
            <video controls src={videoUrl} className="w-full max-h-96 rounded-lg border" />
          </div>
        )}
      </Card>
    </div>
  );
}
