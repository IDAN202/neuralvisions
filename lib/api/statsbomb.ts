// StatsBomb Open Data — free football match data, no API key needed
// https://github.com/statsbomb/open-data

const BASE = 'https://raw.githubusercontent.com/statsbomb/open-data/master/data'

export interface SBCompetition {
  competition_id: number
  season_id: number
  country_name: string
  competition_name: string
  season_name: string
}

export interface SBMatch {
  match_id: number
  match_date: string
  home_team: { home_team_name: string }
  away_team: { away_team_name: string }
  home_score: number
  away_score: number
  competition: { competition_name: string }
}

export async function getCompetitions(): Promise<SBCompetition[]> {
  const res = await fetch(`${BASE}/competitions.json`)
  if (!res.ok) throw new Error('StatsBomb competitions fetch failed')
  return res.json()
}

export async function getMatches(competitionId: number, seasonId: number): Promise<SBMatch[]> {
  const res = await fetch(`${BASE}/matches/${competitionId}/${seasonId}.json`)
  if (!res.ok) throw new Error('StatsBomb matches fetch failed')
  return res.json()
}

export async function getMatchEvents(matchId: number): Promise<any[]> {
  const res = await fetch(`${BASE}/events/${matchId}.json`)
  if (!res.ok) throw new Error('StatsBomb events fetch failed')
  return res.json()
}
