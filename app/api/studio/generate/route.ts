import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/api/claude'
import { geminiGenerate } from '@/lib/api/gemini'
import { SCRIPT_GENERATOR_PROMPT } from '@/lib/prompts/script-generator'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { researchId, title } = await request.json()
  if (!researchId) return NextResponse.json({ error: 'researchId required' }, { status: 400 })

  const { data: report } = await supabase
    .from('research_reports')
    .select('*')
    .eq('id', researchId)
    .eq('user_id', user.id)
    .single()

  if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 })

  // Create project
  const { data: project, error: projError } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      research_id: researchId,
      title: title ?? report.title,
      status: 'generating',
    })
    .select()
    .single()

  if (projError) return NextResponse.json({ error: projError.message }, { status: 500 })

  const userContent = `Topic: ${report.title}\n\nResearch Summary:\n${report.summary}\n\nDetailed Content:\n${report.full_content?.slice(0, 4000) ?? ''}`

  try {
    let raw: string

    if (process.env.ANTHROPIC_API_KEY) {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
        system: SCRIPT_GENERATOR_PROMPT,
        messages: [{ role: 'user', content: userContent }],
      })
      raw = (message.content[0] as any).text
    } else {
      // Fallback to Gemini 2.0 Flash when Claude key is not set
      raw = await geminiGenerate(userContent, SCRIPT_GENERATOR_PROMPT)
    }
    const scenes: any[] = JSON.parse(raw)

    const sceneRows = scenes.map((s: any) => ({
      project_id: project.id,
      scene_number: s.scene_number,
      narration_text: s.narration_text,
      broll_suggestion: s.broll_suggestion,
      visual_prompt: s.visual_prompt,
      duration: 12,
      status: 'draft',
    }))

    await supabase.from('scenes').insert(sceneRows)
    await supabase.from('projects').update({ status: 'review' }).eq('id', project.id)

    return NextResponse.json({ projectId: project.id })
  } catch (e: any) {
    await supabase.from('projects').update({ status: 'draft' }).eq('id', project.id)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
