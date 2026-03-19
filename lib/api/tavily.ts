export async function tavilySearch(query: string): Promise<TavilyResult> {
  const key = process.env.TAVILY_API_KEY
  if (!key) throw new Error('TAVILY_API_KEY not set')
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: key,
      query,
      search_depth: 'advanced',
      max_results: 10,
      include_answer: true,
    }),
  })
  if (!res.ok) throw new Error(`Tavily error: ${res.status}`)
  return res.json()
}

export interface TavilyResult {
  answer: string
  results: Array<{
    title: string
    url: string
    content: string
    score: number
  }>
}
