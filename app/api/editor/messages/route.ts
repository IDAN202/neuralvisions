import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sessionId = req.nextUrl.searchParams.get('sessionId')
  const limit = parseInt(req.nextUrl.searchParams.get('limit') ?? '1')

  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

  const { data } = await supabase
    .from('editor_messages')
    .select('id, role, content, action_type, action_data')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(limit)

  const messages = (data ?? []).reverse()
  const latest = messages[messages.length - 1] ?? null

  return NextResponse.json(latest)
}
