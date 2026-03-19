import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import ScheduleForm from "@/components/publish/ScheduleForm";
import PublishQueue from "@/components/publish/PublishQueue";

export default async function PublishPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: projects }, { data: clips }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, title")
      .eq("user_id", user.id)
      .eq("status", "approved"),
    supabase
      .from("clips")
      .select("id, hook_text")
      .eq("user_id", user.id)
      .eq("status", "approved"),
  ]);

  return (
    <AppShell title="Publishing Hub">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">Schedule a Post</h2>
          <ScheduleForm projects={projects ?? []} clips={clips ?? []} />
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-4">Publish Queue</h2>
          <PublishQueue userId={user.id} />
        </div>
      </div>
    </AppShell>
  );
}
