import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function EditorIndexPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get most recent project
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (project) {
    redirect(`/editor/${project.id}`)
  }

  // No projects yet — redirect to studio
  redirect('/studio')
}
