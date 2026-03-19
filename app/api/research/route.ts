import { NextRequest, NextResponse } from 'next/server'
import { tavilySearch } from '@/lib/api/tavily'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { topicId, query, title } = await request.json()
  if (!query) return NextResponse.json({ error: 'query required' }, { status: 400 })

  try {
    const result = await tavilySearch(query)

    const sources = result.results.map(r => ({
      title: r.title,
      url: r.url,
      snippet: r.content.slice(0, 300),
    }))

    const full_content = result.results
      .map(r => `## ${r.title}\n${r.content}`)
      .join('\n\n')

    const { data, error } = await supabase.from('research_reports').insert({
      user_id: user.id,
      topic_id: topicId ?? null,
      title: title ?? query,
      query,
      summary: result.answer,
      full_content,
      sources,
      status: 'pending',
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ report: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
