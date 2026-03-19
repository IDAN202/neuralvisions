import { NextRequest, NextResponse } from 'next/server'
import { YoutubeTranscript } from 'youtube-transcript'
import { createClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/api/claude'

function extractVideoId(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.slice(1)
    }
    if (parsed.hostname.includes('youtube.com')) {
      return parsed.searchParams.get('v')
    }
  } catch {}
  return null
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { jobId, sourceUrl } = await request.json()
  if (!jobId || !sourceUrl) {
    return NextResponse.json({ error: 'jobId and sourceUrl required' }, { status: 400 })
  }

  const videoId = extractVideoId(sourceUrl)
  if (!videoId) {
    return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
  }

  try {
    // Fetch transcript
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId)
    const transcript = transcriptItems.map(t => t.text).join(' ')

    // Save transcript to clip_jobs
    await supabase.from('clip_jobs').update({ transcript }).eq('id', jobId)

    // Call Claude to identify viral moments
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: 'You are a viral content strategist. Given a video transcript, identify exactly 5 viral moments. Return ONLY a JSON array of 5 objects: [{clip_number, start_time (seconds), end_time (seconds, max 60s clip), hook_text (punchy 1-line hook), caption (engaging caption for social media)}]. No markdown, just JSON.',
      messages: [{ role: 'user', content: transcript }],
    })

    const raw = (message.content[0] as { type: string; text: string }).text.trim()
    const clipSuggestions: Array<{
      clip_number: number
      start_time: number
      end_time: number
      hook_text: string
      caption: string
    }> = JSON.parse(raw)

    // Insert clips
    const clipsToInsert = clipSuggestions.map(c => ({
      job_id: jobId,
      user_id: user.id,
      clip_number: c.clip_number,
      start_time: c.start_time,
      end_time: c.end_time,
      hook_text: c.hook_text,
      caption: c.caption,
      status: 'pending',
    }))

    const { data: clips, error: clipsError } = await supabase
      .from('clips')
      .insert(clipsToInsert)
      .select()

    if (clipsError) throw new Error(clipsError.message)

    // Update job status to done
    await supabase.from('clip_jobs').update({ status: 'done' }).eq('id', jobId)

    return NextResponse.json({ clips })
  } catch (e: any) {
    await supabase.from('clip_jobs').update({ status: 'error' }).eq('id', jobId)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
