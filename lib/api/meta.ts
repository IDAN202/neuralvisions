// Meta Graph API — Instagram + Facebook publishing
// Get token: https://developers.facebook.com/tools/explorer
// Required env: META_ACCESS_TOKEN, META_IG_USER_ID, META_FB_PAGE_ID

const TOKEN = process.env.META_ACCESS_TOKEN ?? ''
const IG_USER_ID = process.env.META_IG_USER_ID ?? ''
const FB_PAGE_ID = process.env.META_FB_PAGE_ID ?? ''
const GRAPH = 'https://graph.facebook.com/v19.0'

// Post a video reel to Instagram
export async function postInstagramReel(videoUrl: string, caption: string) {
  // Step 1: Create container
  const container = await fetch(`${GRAPH}/${IG_USER_ID}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: 'REELS',
      video_url: videoUrl,
      caption,
      access_token: TOKEN,
    }),
  }).then(r => r.json())

  if (container.error) throw new Error(container.error.message)

  // Step 2: Publish container
  const publish = await fetch(`${GRAPH}/${IG_USER_ID}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: container.id, access_token: TOKEN }),
  }).then(r => r.json())

  if (publish.error) throw new Error(publish.error.message)
  return publish
}

// Post a video to Facebook page
export async function postFacebookVideo(videoUrl: string, description: string) {
  const res = await fetch(`${GRAPH}/${FB_PAGE_ID}/videos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_url: videoUrl, description, access_token: TOKEN }),
  }).then(r => r.json())

  if (res.error) throw new Error(res.error.message)
  return res
}
