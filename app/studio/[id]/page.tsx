import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { StudioDetailClient } from '@/components/studio/StudioDetailClient'

export default async function StudioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (!project) notFound()

  const { data: scenes } = await supabase
    .from('scenes')
    .select('*')
    .eq('project_id', id)
    .order('scene_number')

  return (
    <StudioDetailClient
      project={project}
      initialScenes={scenes ?? []}
      userId={user!.id}
    />
  )
}
