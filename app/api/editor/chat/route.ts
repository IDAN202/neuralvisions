import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/api/claude'
import { geminiGenerate } from '@/lib/api/gemini'
import { EDITOR_AGENT_PROMPT } from '@/lib/prompts/editor-agent'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sessionId, message, projectId } = await request.json()
  if (!sessionId || !message || !projectId) {
    return NextResponse.json({ error: 'sessionId, message, and projectId are required' }, { status: 400 })
  }

  // Load last 10 editor messages for context
  const { data: history } = await supabase
    .from('editor_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(10)

  const priorMessages = (history ?? []).reverse()

  // Load project scenes summary
  const { data: scenes } = await supabase
    .from('scenes')
    .select('scene_number, narration_text')
    .eq('project_id', projectId)
    .order('scene_number')

  const scenesSummary = (scenes ?? [])
    .map((s) => `Scene ${s.scene_number}: ${s.narration_text ?? '(no narration)'}`)
    .join('\n')

  const systemWithContext = `${EDITOR_AGENT_PROMPT}\n\nCurrent project scenes:\n${scenesSummary}`

  // Build messages array for Claude
  const claudeMessages: { role: 'user' | 'assistant'; content: string }[] = [
    ...priorMessages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: message },
  ]

  let fullText = ''
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (process.env.ANTHROPIC_API_KEY) {
          // Use Claude with streaming
          const claudeStream = await anthropic.messages.stream({
            model: 'claude-sonnet-4-6',
            max_tokens: 1024,
            system: systemWithContext,
            messages: claudeMessages,
          })
          for await (const chunk of claudeStream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              fullText += chunk.delta.text
            }
          }
        } else {
          // Fallback to Gemini 2.0 Flash
          const conversationText = claudeMessages.map(m => `${m.role}: ${m.content}`).join('\n')
          fullText = await geminiGenerate(conversationText, systemWithContext)
        }

        // Parse JSON response
        let parsed: {
          reply: string
          action_type: string | null
          action_data: Record<string, unknown> | null
        } = { reply: fullText, action_type: null, action_data: null }

        try {
          parsed = JSON.parse(fullText)
        } catch {
          // fallback: treat entire text as reply
        }

        const { reply, action_type, action_data } = parsed

        // Execute action server-side
        if (action_type && action_data !== undefined) {
          try {
            if (action_type === 'rewrite_scene') {
              const { scene_number, new_narration } = action_data as { scene_number: number; new_narration: string }
              await supabase
                .from('scenes')
                .update({ narration_text: new_narration })
                .eq('project_id', projectId)
                .eq('scene_number', scene_number)
            } else if (action_type === 'regenerate_broll') {
              const { scene_number, new_query } = action_data as { scene_number: number; new_query: string }
              await supabase
                .from('scenes')
                .update({ broll_suggestion: new_query })
                .eq('project_id', projectId)
                .eq('scene_number', scene_number)
            } else if (action_type === 'trim_clip') {
              const { scene_number, new_duration } = action_data as { scene_number: number; new_duration: number }
              await supabase
                .from('scenes')
                .update({ duration: new_duration })
                .eq('project_id', projectId)
                .eq('scene_number', scene_number)
            } else if (action_type === 're_render') {
              const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
              await fetch(`${baseUrl}/api/video/assemble`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId }),
              })
            }
          } catch {
            // action errors are non-fatal
          }
        }

        // Save user message
        await supabase.from('editor_messages').insert({
          session_id: sessionId,
          role: 'user',
          content: message,
        })

        // Save assistant reply with action metadata
        await supabase.from('editor_messages').insert({
          session_id: sessionId,
          role: 'assistant',
          content: reply,
          action_type: action_type ?? null,
          action_data: action_data ?? null,
        })

        // Stream just the reply text to the client
        controller.enqueue(encoder.encode(reply))
        controller.close()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        controller.enqueue(encoder.encode(msg))
        controller.close()
      }
    },
  })

  return new NextResponse(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
