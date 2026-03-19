'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { URLInputForm } from '@/components/clips/URLInputForm'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface ClipJob {
  id: string
  source_url: string
  status: string
  created_at: string
}

const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  pending: 'outline',
  processing: 'secondary',
  done: 'default',
  error: 'destructive',
}

export default function ClipsPage() {
  const [loading, setLoading] = useState(false)
  const [jobs, setJobs] = useState<ClipJob[]>([])
  const supabase = createClient()

  useEffect(() => {
    loadJobs()
  }, [])

  async function loadJobs() {
    const { data } = await supabase
      .from('clip_jobs')
      .select('id, source_url, status, created_at')
      .order('created_at', { ascending: false })
    if (data) setJobs(data)
  }

  async function handleSubmit(url: string) {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast.error('Not authenticated'); return }

      // Create clip_job
      const { data: job, error: jobError } = await supabase
        .from('clip_jobs')
        .insert({ user_id: user.id, source_url: url, status: 'processing' })
        .select()
        .single()

      if (jobError || !job) throw new Error(jobError?.message ?? 'Failed to create job')

      setJobs(prev => [job, ...prev])

      // Call extract API
      const res = await fetch('/api/clips/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id, sourceUrl: url }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      toast.success('Clips extracted successfully')
      await loadJobs()
    } catch (e: any) {
      toast.error(e.message)
      await loadJobs()
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell title="Clip Extractor">
      <div className="space-y-6">
        <URLInputForm onSubmit={handleSubmit} loading={loading} />

        <div className="space-y-3">
          {jobs.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-12">
              No clip jobs yet. Paste a YouTube URL above to get started.
            </p>
          )}
          {jobs.map(job => (
            <Link key={job.id} href={`/clips/${job.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-sm truncate max-w-md">{job.source_url}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge variant={statusVariant[job.status] ?? 'outline'}>{job.status}</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
