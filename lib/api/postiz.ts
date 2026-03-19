// Postiz — self-hosted multi-platform publisher (30+ platforms)
// Deploy: docker run -p 3000:3000 postiz/postiz
// Set POSTIZ_URL and POSTIZ_API_KEY in .env.local

const POSTIZ_URL = process.env.POSTIZ_URL ?? 'http://localhost:3000'
const POSTIZ_API_KEY = process.env.POSTIZ_API_KEY ?? ''

export interface PostizPost {
  content: string
  platforms: string[] // e.g. ['twitter', 'instagram', 'tiktok']
  mediaUrls?: string[]
  scheduledAt?: string // ISO string
}

export async function publishViaPostiz(post: PostizPost) {
  const res = await fetch(`${POSTIZ_URL}/api/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${POSTIZ_API_KEY}`,
    },
    body: JSON.stringify({
      content: post.content,
      platforms: post.platforms,
      media: post.mediaUrls ?? [],
      date: post.scheduledAt ?? new Date().toISOString(),
    }),
  })
  if (!res.ok) throw new Error(`Postiz error: ${res.status} ${await res.text()}`)
  return res.json()
}
