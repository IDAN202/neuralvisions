// AutoClip — self-hosted AI highlight detection
// Deploy: docker run -p 8080:8080 autoclipper/autoclipper
// Falls back to Claude-based detection if AUTOCLIPPER_URL not set

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/api/claude'
import { geminiGenerate } from '@/lib/api/gemini'

const AUTOCLIPPER_URL = process.env.AUTOCLIPPER_URL // e.g. http://localhost:8080

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { videoUrl, jobId } = await req.json()
  if (!videoUrl) return NextResponse.json({ error: 'videoUrl required' }, { status: 400 })

  try {
    let clips: any[]

    if (AUTOCLIPPER_URL) {
      // Use self-hosted AutoClip Docker instance
      const res = await fetch(`${AUTOCLIPPER_URL}/clip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: videoUrl, max_clips: 5 }),
      })
      if (!res.ok) throw new Error(`AutoClip error: ${res.status}`)
      const data = await res.json()
      clips = data.clips ?? []
    } else {
      // AI fallback: ask Claude/Gemini to suggest clip timestamps
      const prompt = `You are a viral content expert. Given this video URL: ${videoUrl}

Suggest 5 viral clip moments with timestamps. Return ONLY a JSON array:
[
  { "start_time": 10, "end_time": 40, "title": "Hook moment", "virality_score": 85, "caption": "..." },
  ...
]`

      let raw: string
      if (process.env.ANTHROPIC_API_KEY) {
        const msg = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        })
        raw = (msg.content[0] as any).text
      } else {
        raw = await geminiGenerate(prompt)
      }

      const match = raw.match(/\[[\s\S]*\]/)
      clips = match ? JSON.parse(match[0]) : []
    }

    // Save clips to DB if jobId provided
    if (jobId && clips.length > 0) {
      const rows = clips.map((c: any, i: number) => ({
        job_id: jobId,
        user_id: user.id,
        clip_number: i + 1,
        start_time: c.start_time,
        end_time: c.end_time,
        title: c.title ?? `Clip ${i + 1}`,
        caption: c.caption ?? '',
        virality_score: c.virality_score ?? 0,
        status: 'pending',
      }))
      await supabase.from('clips').insert(rows)
    }

    return NextResponse.json({ clips })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
