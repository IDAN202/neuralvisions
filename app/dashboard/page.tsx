import { AppShell } from '@/components/layout/AppShell'
import { createClient } from '@/lib/supabase/server'
import { AgentStatusCard } from '@/components/dashboard/AgentStatusCard'
import { ApprovalQueue } from '@/components/dashboard/ApprovalQueue'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { Radar, BookOpen, Film, Scissors } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { count: topicsCount },
    { count: researchCount },
    { count: projectsCount },
    { count: clipsCount },
  ] = await Promise.all([
    supabase.from('topics').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('research_reports').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('clip_jobs').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
  ])

  const agents = [
    { label: 'Scout Agent', icon: Radar, count: topicsCount ?? 0, href: '/scout', color: 'text-blue-500' },
    { label: 'Research Agent', icon: BookOpen, count: researchCount ?? 0, href: '/research', color: 'text-purple-500' },
    { label: 'Studio', icon: Film, count: projectsCount ?? 0, href: '/studio', color: 'text-orange-500' },
    { label: 'Clipping Factory', icon: Scissors, count: clipsCount ?? 0, href: '/clips', color: 'text-green-500' },
  ]

  return (
    <AppShell title="War Room" user={user}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {agents.map(a => (
            <AgentStatusCard key={a.label} {...a} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ApprovalQueue userId={user!.id} />
          <RecentActivity userId={user!.id} />
        </div>
      </div>
    </AppShell>
  )
}
