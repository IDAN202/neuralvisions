// Ayrshare — post to Instagram, Facebook, TikTok, Twitter, YouTube in one call
// Sign up: https://ayrshare.com — free plan available
// Get API key from dashboard

const AYRSHARE_KEY = process.env.AYRSHARE_API_KEY ?? ''

export type AyrsharePlatform = 'instagram' | 'facebook' | 'tiktok' | 'twitter' | 'youtube' | 'linkedin'

export async function ayrsharePost(params: {
  post: string
  platforms: AyrsharePlatform[]
  mediaUrls?: string[]
  scheduleDate?: string // ISO string
}) {
  const res = await fetch('https://app.ayrshare.com/api/post', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AYRSHARE_KEY}`,
    },
    body: JSON.stringify({
      post: params.post,
      platforms: params.platforms,
      mediaUrls: params.mediaUrls ?? [],
      ...(params.scheduleDate ? { scheduleDate: params.scheduleDate } : {}),
    }),
  })
  if (!res.ok) throw new Error(`Ayrshare error: ${res.status} ${await res.text()}`)
  return res.json()
}

export async function ayrshareDeletePost(id: string) {
  const res = await fetch('https://app.ayrshare.com/api/post', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AYRSHARE_KEY}`,
    },
    body: JSON.stringify({ id }),
  })
  if (!res.ok) throw new Error(`Ayrshare delete error: ${res.status}`)
  return res.json()
}
