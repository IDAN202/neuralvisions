export async function braveSearch(query: string): Promise<BraveResult[]> {
  const key = process.env.BRAVE_SEARCH_API_KEY
  if (!key) return []
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10`
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json', 'X-Subscription-Token': key },
    next: { revalidate: 21600 },
  })
  if (!res.ok) return []
  const data = await res.json()
  return (data.web?.results ?? []).map((r: any) => ({
    title: r.title,
    summary: r.description,
    source_url: r.url,
    source: 'brave',
    thumbnail: r.thumbnail?.src ?? null,
    score: 50,
  }))
}

export interface BraveResult {
  title: string
  summary: string
  source_url: string
  source: string
  thumbnail: string | null
  score: number
}
