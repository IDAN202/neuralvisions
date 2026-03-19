import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ClipsReviewClient } from '@/components/clips/ClipsReviewClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ClipJobPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: job } = await supabase
    .from('clip_jobs')
    .select('*')
    .eq('id', id)
    .single()

  if (!job) notFound()

  const { data: clips } = await supabase
    .from('clips')
    .select('*')
    .eq('job_id', id)
    .order('clip_number')

  return <ClipsReviewClient job={job} initialClips={clips ?? []} />
}
