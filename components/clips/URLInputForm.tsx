'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface URLInputFormProps {
  onSubmit: (url: string) => void
  loading: boolean
}

export function URLInputForm({ onSubmit, loading }: URLInputFormProps) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      setError('Please enter a valid YouTube URL')
      return
    }
    setError('')
    onSubmit(url)
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={e => { setUrl(e.target.value); setError('') }}
              disabled={loading}
            />
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
          <Button type="submit" disabled={loading || !url.trim()}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {loading ? 'Extracting...' : 'Extract Clips'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
