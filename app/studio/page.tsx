import { AppShell } from '@/components/layout/AppShell'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export default async function StudioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, status, render_url, created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const statusColor: Record<string, any> = {
    draft: 'outline', review: 'secondary', approved: 'default',
    rendering: 'secondary', done: 'default', generating: 'secondary',
  }

  return (
    <AppShell title="Explainer Studio" user={user}>
      <div className="space-y-3">
        {(!projects || projects.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-12">
            No projects yet. Approve a research report and click "Generate Script in Studio".
          </p>
        )}
        {(projects ?? []).map(p => (
          <Link key={p.id} href={`/studio/${p.id}`}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-sm">{p.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                  </p>
                </div>
                <Badge variant={statusColor[p.status] ?? 'outline'}>{p.status}</Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  )
}
