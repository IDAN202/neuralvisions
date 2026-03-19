// GDELT — free global news event database, no API key needed

export interface GdeltArticle {
  title: string
  url: string
  domain: string
  seendate: string
  socialimage: string | null
  tone: number
}

export async function fetchGdeltTrends(query: string, maxRecords = 10): Promise<GdeltArticle[]> {
  const params = new URLSearchParams({
    query,
    mode: 'artlist',
    maxrecords: String(maxRecords),
    sort: 'ToneDesc',
    format: 'json',
  })

  const res = await fetch(`https://api.gdeltproject.org/api/v2/doc/doc?${params}`)
  if (!res.ok) throw new Error(`GDELT error: ${res.status}`)
  const data = await res.json()

  return (data.articles ?? []).map((a: any) => ({
    title: a.title ?? '',
    url: a.url ?? '',
    domain: a.domain ?? '',
    seendate: a.seendate ?? '',
    socialimage: a.socialimage ?? null,
    tone: parseFloat(a.tone ?? '0'),
  }))
}
