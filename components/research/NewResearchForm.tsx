'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'

interface Topic { id: string; title: string }

export function NewResearchForm({ topics }: { topics: Topic[] }) {
  const [query, setQuery] = useState('')
  const [topicId, setTopicId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, topicId: topicId || undefined, title: query }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      toast.success('Research complete')
      router.push(`/research/${data.report.id}`)
      router.refresh()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">New Research Query</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex gap-3 flex-wrap">
          {topics.length > 0 && (
            <Select value={topicId} onValueChange={(v) => setTopicId(v ?? '')}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Link to approved topic (optional)" />
              </SelectTrigger>
              <SelectContent>
                {topics.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Input
            className="flex-1 min-w-48"
            placeholder="e.g. How does AI affect football scouting?"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <Button type="submit" disabled={loading || !query.trim()}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
            Research
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
