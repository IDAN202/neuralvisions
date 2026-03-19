import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { EditorClient } from './EditorClient'

export default async function EditorPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) notFound()

  // Load project
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) notFound()

  // Get or create editor session
  let { data: session } = await supabase
    .from('editor_sessions')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!session) {
    const { data: newSession } = await supabase
      .from('editor_sessions')
      .insert({ user_id: user.id, project_id: projectId })
      .select()
      .single()
    session = newSession
  }

  // Load existing messages
  const { data: messages } = await supabase
    .from('editor_messages')
    .select('id, role, content, action_type')
    .eq('session_id', session!.id)
    .order('created_at', { ascending: true })

  return (
    <AppShell title={`${project.title} — Chat Editor`} user={user}>
      <EditorClient
        project={project}
        sessionId={session!.id}
        initialMessages={messages ?? []}
      />
    </AppShell>
  )
}
