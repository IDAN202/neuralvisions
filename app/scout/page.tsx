'use client'

import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { TopicCard } from '@/components/scout/TopicCard'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, RefreshCw } from 'lucide-react'

const CATEGORIES = ['ai', 'football', 'news', 'gadgets']

interface Topic {
  title: string
  summary: string
  source_url: string
  source: string
  thumbnail: string | null
  score: number
}

export default function ScoutPage() {
  const [category, setCategory] = useState('ai')
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(false)
  const [approved, setApproved] = useState<Set<string>>(new Set())
  const supabase = createClient()

  async function runScout() {
    setLoading(true)
    try {
      const res = await fetch(`/api/scout?category=${category}`)
      const data = await res.json()
      setTopics(data.results ?? [])
    } catch {
      toast.error('Scout failed — check your API keys')
    } finally {
      setLoading(false)
    }
  }

  async function approveTopic(topic: Topic) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('topics').insert({
      user_id: user.id,
      title: topic.title,
      summary: topic.summary,
      source: topic.source,
      source_url: topic.source_url,
      thumbnail: topic.thumbnail,
      score: topic.score,
      category,
      status: 'approved',
    })
    if (error) { toast.error('Failed to save topic'); return }
    setApproved(prev => new Set([...prev, topic.source_url]))
    toast.success('Topic approved — go to Research to deep-dive it')
  }

  return (
    <AppShell title="Scout Agent">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Tabs value={category} onValueChange={v => { setCategory(v); setTopics([]) }}>
            <TabsList>
              {CATEGORIES.map(c => (
                <TabsTrigger key={c} value={c} className="capitalize">{c}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Button onClick={runScout} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Run Scout
          </Button>
        </div>

        {topics.length === 0 && !loading && (
          <div className="text-center py-20 text-muted-foreground text-sm">
            Select a category and click Run Scout to discover trending topics.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {topics.map(topic => (
            <TopicCard
              key={topic.source_url}
              topic={topic}
              onApprove={approveTopic}
              approved={approved.has(topic.source_url)}
            />
          ))}
        </div>
      </div>
    </AppShell>
  )
}
