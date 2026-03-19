import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { publishQueueId } = await req.json();

  if (!publishQueueId) {
    return NextResponse.json({ error: "publishQueueId is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("publish_queue")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", publishQueueId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
