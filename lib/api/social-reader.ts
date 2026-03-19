// Social Media Reading APIs
// Twitter/X: read trending tweets, search content
// Instagram: read public posts via RapidAPI
// TikTok: read trending videos via RapidAPI
// Facebook: read public page posts via Graph API

// ---- TWITTER/X ----
// Sign up: https://developer.twitter.com — free basic tier
const TWITTER_BEARER = process.env.TWITTER_BEARER_TOKEN ?? ''

export async function twitterSearch(query: string, maxResults = 10) {
  if (!TWITTER_BEARER) throw new Error('TWITTER_BEARER_TOKEN not set')
  const params = new URLSearchParams({
    query,
    max_results: String(maxResults),
    'tweet.fields': 'public_metrics,created_at,author_id',
    expansions: 'author_id',
    'user.fields': 'name,username,profile_image_url',
  })
  const res = await fetch(`https://api.twitter.com/2/tweets/search/recent?${params}`, {
    headers: { Authorization: `Bearer ${TWITTER_BEARER}` },
  })
  if (!res.ok) throw new Error(`Twitter error: ${res.status} ${await res.text()}`)
  return res.json()
}

export async function twitterTrending(woeid = 1) { // 1 = worldwide
  if (!TWITTER_BEARER) throw new Error('TWITTER_BEARER_TOKEN not set')
  const res = await fetch(`https://api.twitter.com/1.1/trends/place.json?id=${woeid}`, {
    headers: { Authorization: `Bearer ${TWITTER_BEARER}` },
  })
  if (!res.ok) throw new Error(`Twitter trends error: ${res.status}`)
  return res.json()
}

// ---- INSTAGRAM (via RapidAPI) ----
// Sign up: https://rapidapi.com/search/instagram — free tier
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY ?? ''

export async function instagramGetHashtagPosts(hashtag: string) {
  if (!RAPIDAPI_KEY) throw new Error('RAPIDAPI_KEY not set')
  const res = await fetch(
    `https://instagram-scraper-api2.p.rapidapi.com/v1/hashtag?hashtag=${hashtag}`,
    {
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': 'instagram-scraper-api2.p.rapidapi.com',
      },
    }
  )
  if (!res.ok) throw new Error(`Instagram error: ${res.status}`)
  return res.json()
}

export async function instagramGetProfile(username: string) {
  if (!RAPIDAPI_KEY) throw new Error('RAPIDAPI_KEY not set')
  const res = await fetch(
    `https://instagram-scraper-api2.p.rapidapi.com/v1/info?username_or_id_or_url=${username}`,
    {
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': 'instagram-scraper-api2.p.rapidapi.com',
      },
    }
  )
  if (!res.ok) throw new Error(`Instagram profile error: ${res.status}`)
  return res.json()
}

// ---- TIKTOK (via RapidAPI) ----
// Same RapidAPI key works
export async function tiktokTrending() {
  if (!RAPIDAPI_KEY) throw new Error('RAPIDAPI_KEY not set')
  const res = await fetch(
    'https://tiktok-api23.p.rapidapi.com/api/trending/feed',
    {
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': 'tiktok-api23.p.rapidapi.com',
      },
    }
  )
  if (!res.ok) throw new Error(`TikTok error: ${res.status}`)
  return res.json()
}

export async function tiktokSearch(keyword: string) {
  if (!RAPIDAPI_KEY) throw new Error('RAPIDAPI_KEY not set')
  const res = await fetch(
    `https://tiktok-api23.p.rapidapi.com/api/search/video?keywords=${encodeURIComponent(keyword)}&count=10`,
    {
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': 'tiktok-api23.p.rapidapi.com',
      },
    }
  )
  if (!res.ok) throw new Error(`TikTok search error: ${res.status}`)
  return res.json()
}

// ---- FACEBOOK (via Graph API) ----
// Read public page posts — requires page access token
const FB_TOKEN = process.env.META_ACCESS_TOKEN ?? ''

export async function facebookGetPagePosts(pageId: string, limit = 10) {
  if (!FB_TOKEN) throw new Error('META_ACCESS_TOKEN not set')
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${pageId}/posts?fields=message,created_time,full_picture,permalink_url&limit=${limit}&access_token=${FB_TOKEN}`
  )
  if (!res.ok) throw new Error(`Facebook error: ${res.status}`)
  return res.json()
}
