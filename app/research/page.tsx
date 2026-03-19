import { AppShell } from '@/components/layout/AppShell'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { NewResearchForm } from '@/components/research/NewResearchForm'
import { formatDistanceToNow } from 'date-fns'

export default async function ResearchPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: reports } = await supabase
    .from('research_reports')
    .select('id, title, summary, status, created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const { data: topics } = await supabase
    .from('topics')
    .select('id, title')
    .eq('user_id', user!.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  return (
    <AppShell title="Research Agent" user={user}>
      <div className="space-y-6">
        <NewResearchForm topics={topics ?? []} />
        <div className="space-y-3">
          {(reports ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-12">No research reports yet. Approve a topic from Scout or start a custom query above.</p>
          )}
          {(reports ?? []).map(r => (
            <Link key={r.id} href={`/research/${r.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="py-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{r.title}</p>
                    {r.summary && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.summary}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</p>
                  </div>
                  <Badge variant={r.status === 'approved' ? 'default' : r.status === 'rejected' ? 'destructive' : 'secondary'}>
                    {r.status}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
