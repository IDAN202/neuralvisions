"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Props {
  projects: Array<{ id: string; title: string }>;
  clips: Array<{ id: string; hook_text: string }>;
}

const PLATFORMS = ["YouTube", "TikTok", "Instagram", "Twitter"];

export default function ScheduleForm({ projects, clips }: Props) {
  const supabase = createClient();

  const [contentType, setContentType] = useState<"project" | "clip">("project");
  const [contentId, setContentId] = useState("");
  const [platform, setPlatform] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contentId || !platform || !title || !scheduledAt) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Not authenticated.");
      setLoading(false);
      return;
    }

    const payload: Record<string, string> = {
      user_id: user.id,
      platform,
      title,
      description,
      scheduled_at: new Date(scheduledAt).toISOString(),
      status: "scheduled",
    };

    if (contentType === "project") {
      payload.project_id = contentId;
    } else {
      payload.clip_id = contentId;
    }

    const { error } = await supabase.from("publish_queue").insert(payload);

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Scheduled successfully.");
      setContentId("");
      setPlatform("");
      setTitle("");
      setDescription("");
      setScheduledAt("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Content Type</label>
        <Select value={contentType} onValueChange={(v) => { setContentType(v as "project" | "clip"); setContentId(""); }}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="project">Project</SelectItem>
            <SelectItem value="clip">Clip</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {contentType === "project" ? "Project" : "Clip"}
        </label>
        <Select value={contentId} onValueChange={(v) => setContentId(v ?? '')}>
          <SelectTrigger>
            <SelectValue placeholder={`Select a ${contentType}`} />
          </SelectTrigger>
          <SelectContent>
            {contentType === "project"
              ? projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))
              : clips.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.hook_text}
                  </SelectItem>
                ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Platform</label>
        <Select value={platform} onValueChange={(v) => setPlatform(v ?? '')}>
          <SelectTrigger>
            <SelectValue placeholder="Select platform" />
          </SelectTrigger>
          <SelectContent>
            {PLATFORMS.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Post title" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Scheduled At</label>
        <Input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Scheduling..." : "Schedule Post"}
      </Button>
    </form>
  );
}
