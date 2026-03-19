import { AppShell } from '@/components/layout/AppShell'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ResearchActions } from '@/components/research/ResearchActions'
import { ExternalLink } from 'lucide-react'

export default async function ResearchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: report } = await supabase
    .from('research_reports')
    .select('*')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (!report) notFound()

  const sources: Array<{ title: string; url: string; snippet: string }> = report.sources ?? []

  return (
    <AppShell title={report.title} user={user}>
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <Badge variant={report.status === 'approved' ? 'default' : 'secondary'}>{report.status}</Badge>
          <span className="text-xs text-muted-foreground">Query: {report.query}</span>
        </div>

        {report.summary && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{report.summary}</p>
            </CardContent>
          </Card>
        )}

        {sources.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Sources ({sources.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sources.map((s, i) => (
                <div key={i}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer"
                    className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                    {s.title} <ExternalLink className="w-3 h-3" />
                  </a>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{s.snippet}</p>
                  {i < sources.length - 1 && <Separator className="mt-3" />}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <ResearchActions reportId={report.id} status={report.status} title={report.title} />
      </div>
    </AppShell>
  )
}
