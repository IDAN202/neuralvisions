export async function newsTopHeadlines(category: string): Promise<NewsResult[]> {
  const key = process.env.NEWS_API_KEY
  if (!key) return []
  const q = category === 'football' ? 'football OR soccer' : category
  const url = `https://newsapi.org/v2/top-headlines?q=${encodeURIComponent(q)}&language=en&pageSize=10&apiKey=${key}`
  const res = await fetch(url, { next: { revalidate: 21600 } })
  if (!res.ok) return []
  const data = await res.json()
  return (data.articles ?? []).map((a: any) => ({
    title: a.title,
    summary: a.description,
    source_url: a.url,
    source: 'newsapi',
    thumbnail: a.urlToImage ?? null,
    score: 60,
  }))
}

export interface NewsResult {
  title: string
  summary: string
  source_url: string
  source: string
  thumbnail: string | null
  score: number
}
