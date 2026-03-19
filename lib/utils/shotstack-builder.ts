export type Scene = {
  id: string
  scene_number: number
  broll_url: string | null
  voiceover_url: string | null
  narration_text: string | null
  duration: number
}

export function buildExplainerTimeline(scenes: Scene[]): object {
  const videoClips: object[] = []
  const audioClips: object[] = []
  const titleClips: object[] = []

  for (const scene of scenes) {
    const offset = (scene.scene_number - 1) * 12
    const length = 12

    // Video track — black placeholder if no broll_url
    if (scene.broll_url) {
      videoClips.push({
        asset: { type: 'video', src: scene.broll_url },
        start: offset,
        length,
        fit: 'crop',
      })
    } else {
      videoClips.push({
        asset: { type: 'luma', src: 'https://templates.shotstack.io/basic/asset/video/black.mp4' },
        start: offset,
        length,
      })
    }

    // Audio track
    if (scene.voiceover_url) {
      audioClips.push({
        asset: { type: 'audio', src: scene.voiceover_url },
        start: offset,
        length,
      })
    }

    // Title overlay
    if (scene.narration_text) {
      titleClips.push({
        asset: {
          type: 'title',
          text: scene.narration_text,
          style: 'minimal',
          size: 'small',
        },
        start: offset,
        length,
        position: 'bottom',
      })
    }
  }

  const tracks: object[] = [{ clips: videoClips }]
  if (titleClips.length) tracks.push({ clips: titleClips })
  if (audioClips.length) tracks.push({ clips: audioClips })

  return {
    timeline: { tracks },
    output: { format: 'mp4', resolution: 'hd' },
  }
}
