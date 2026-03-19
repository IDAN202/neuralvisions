"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface QueueItem {
  id: string;
  platform: string;
  title: string;
  scheduled_at: string;
  status: string;
}

interface Props {
  userId: string;
}

const statusColor: Record<string, string> = {
  scheduled: "bg-yellow-500/20 text-yellow-400",
  published: "bg-green-500/20 text-green-400",
  failed: "bg-red-500/20 text-red-400",
};

const platformColor: Record<string, string> = {
  YouTube: "bg-red-500/20 text-red-400",
  TikTok: "bg-pink-500/20 text-pink-400",
  Instagram: "bg-purple-500/20 text-purple-400",
  Twitter: "bg-sky-500/20 text-sky-400",
};

export default function PublishQueue({ userId }: Props) {
  const supabase = createClient();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [publishing, setPublishing] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    const { data } = await supabase
      .from("publish_queue")
      .select("id, platform, title, scheduled_at, status")
      .eq("user_id", userId)
      .order("scheduled_at", { ascending: true });

    setItems(data ?? []);
  }, [supabase, userId]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  async function handlePublish(id: string) {
    setPublishing(id);
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publishQueueId: id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Publish failed");
      toast.success("Published successfully.");
      await loadQueue();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setPublishing(null);
    }
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No scheduled posts yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center justify-between rounded-lg border border-border bg-card p-4 gap-4"
        >
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={platformColor[item.platform] ?? "bg-muted text-muted-foreground"}>
                {item.platform}
              </Badge>
              <Badge className={statusColor[item.status] ?? "bg-muted text-muted-foreground"}>
                {item.status}
              </Badge>
            </div>
            <span className="font-medium truncate">{item.title}</span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(item.scheduled_at), "MMM d, yyyy 'at' h:mm a")}
            </span>
          </div>

          {item.status !== "published" && (
            <Button
              size="sm"
              variant="outline"
              disabled={publishing === item.id}
              onClick={() => handlePublish(item.id)}
            >
              {publishing === item.id ? "Publishing..." : "Publish Now"}
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
