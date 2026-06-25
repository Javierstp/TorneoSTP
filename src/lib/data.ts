import { supabase } from './supabase'
import type {
  Tournament,
  Group,
  Player,
  Match,
  MatchPhase,
  TeamStanding,
} from '../types'
import { shuffle } from './countries'

// Auth
export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  return supabase.auth.signOut()
}

export async function getSession() {
  return supabase.auth.getSession()
}

// Tournaments
export async function fetchTournaments(): Promise<Tournament[]> {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function fetchTournament(id: string): Promise<Tournament | null> {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createTournament(
  name: string,
  registrationDeadline?: string
): Promise<Tournament> {
  const { data, error } = await supabase
    .from('tournaments')
    .insert({ name, registration_deadline: registrationDeadline || null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateTournamentStatus(
  id: string,
  status: Tournament['status']
) {
  const { error } = await supabase
    .from('tournaments')
    .update({ status })
    .eq('id', id)
  if (error) throw error
}

// Groups
export async function fetchGroups(tournamentId: string): Promise<Group[]> {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('order_index', { ascending: true })
  if (error) throw error
  return data || []
}

// Players
export async function fetchPlayers(tournamentId: string): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('tournament_id', tournamentId)
  if (error) throw error
  return data || []
}

export async function createPlayer(
  tournamentId: string,
  name: string,
  countryCode: string,
  countryName: string
): Promise<Player> {
  const { data, error } = await supabase
    .from('players')
    .insert({
      tournament_id: tournamentId,
      name,
      country_code: countryCode,
      country_name: countryName,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updatePlayerGroup(
  playerId: string,
  groupId: string | null
) {
  const { error } = await supabase
    .from('players')
    .update({ group_id: groupId })
    .eq('id', playerId)
  if (error) throw error
}

export async function deletePlayer(playerId: string) {
  const { error } = await supabase.from('players').delete().eq('id', playerId)
  if (error) throw error
}

// Matches
export async function fetchMatches(tournamentId: string): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('scheduled_at', { ascending: true, nullsFirst: true })
  if (error) throw error
  return data || []
}

export async function updateMatch(
  match: Partial<Match> & { id: string }
): Promise<Match> {
  const { data, error } = await supabase
    .from('matches')
    .update(match)
    .eq('id', match.id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteMatchesByPhase(
  tournamentId: string,
  phase: MatchPhase
) {
  const { error } = await supabase
    .from('matches')
    .delete()
    .eq('tournament_id', tournamentId)
    .eq('phase', phase)
  if (error) throw error
}

// Standings
export function computeGroupStandings(
  groupPlayers: Player[],
  matches: Match[]
): TeamStanding[] {
  const map = new Map<string, TeamStanding>()
  for (const p of groupPlayers) {
    map.set(p.id, {
      player: p,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      points: 0,
    })
  }

  const groupMatches = matches.filter(
    (m) => m.phase === 'group' && m.status === 'finished' && m.group_id && groupPlayers.some(p => p.id === m.home_player_id || p.id === m.away_player_id)
  )

  for (const m of groupMatches) {
    const home = m.home_player_id
    const away = m.away_player_id
    if (!home || !away) continue
    if (!map.has(home) || !map.has(away)) continue

    const hs = m.home_score ?? 0
    const as = m.away_score ?? 0

    const h = map.get(home)!
    const a = map.get(away)!

    h.played++
    a.played++
    h.gf += hs
    h.ga += as
    a.gf += as
    a.ga += hs

    if (hs > as) {
      h.won++
      h.points += 3
      a.lost++
    } else if (hs < as) {
      a.won++
      a.points += 3
      h.lost++
    } else {
      h.drawn++
      a.drawn++
      h.points += 1
      a.points += 1
    }
  }

  for (const s of map.values()) {
    s.gd = s.gf - s.ga
  }

  const standings = Array.from(map.values())
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.gd !== a.gd) return b.gd - a.gd
    if (b.gf !== a.gf) return b.gf - a.gf
    // Head-to-head (simple, only direct match)
    const h2h = groupMatches.find(
      (m) =>
        (m.home_player_id === a.player.id && m.away_player_id === b.player.id) ||
        (m.home_player_id === b.player.id && m.away_player_id === a.player.id)
    )
    if (h2h) {
      const aIsHome = h2h.home_player_id === a.player.id
      const aGoals = aIsHome ? h2h.home_score ?? 0 : h2h.away_score ?? 0
      const bGoals = aIsHome ? h2h.away_score ?? 0 : h2h.home_score ?? 0
      if (aGoals !== bGoals) return bGoals - aGoals
    }
    return a.player.name.localeCompare(b.player.name)
  })

  return standings
}

// Stage generation
const GROUP_NAMES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export async function generateGroupStage(
  tournamentId: string,
  players: Player[]
) {
  if (players.length % 2 !== 0) {
    throw new Error('La cantidad de jugadores debe ser par para generar los grupos.')
  }
  // Clean previous group data
  await deleteMatchesByPhase(tournamentId, 'group')
  // Clean knockout matches from previous generation
  const koPhases: MatchPhase[] = ['round_of_16', 'quarter', 'semi', 'third_place', 'final']
  for (const phase of koPhases) {
    await deleteMatchesByPhase(tournamentId, phase)
  }
  const { error: delGroupsError } = await supabase
    .from('groups')
    .delete()
    .eq('tournament_id', tournamentId)
  if (delGroupsError) throw delGroupsError

  // Shuffle players for random draw
  const shuffled = shuffle(players)
  const numGroups = Math.ceil(shuffled.length / 4)
  const baseSize = Math.floor(shuffled.length / numGroups)
  const extra = shuffled.length % numGroups
  const groups: Group[] = []

  let playerIdx = 0
  for (let i = 0; i < numGroups; i++) {
    const size = i < extra ? baseSize + 1 : baseSize
    const groupPlayers = shuffled.slice(playerIdx, playerIdx + size)
    playerIdx += size
    if (groupPlayers.length === 0) continue

    const { data: g, error } = await supabase
      .from('groups')
      .insert({
        tournament_id: tournamentId,
        name: GROUP_NAMES[i] || `G${i + 1}`,
        order_index: i,
      })
      .select()
      .single()
    if (error) throw error
    groups.push(g)

    for (const p of groupPlayers) {
      await updatePlayerGroup(p.id, g.id)
    }
  }

  // Create round-robin matches inside each group
  const matchInserts: {
    tournament_id: string
    group_id: string
    phase: 'group'
    round_order: number
    home_player_id: string
    away_player_id: string
    status: 'scheduled'
  }[] = []

  // Fetch updated players
  const updatedPlayers = await fetchPlayers(tournamentId)

  for (const g of groups) {
    const groupPlayers = updatedPlayers.filter((p) => p.group_id === g.id)
    for (let i = 0; i < groupPlayers.length; i++) {
      for (let j = i + 1; j < groupPlayers.length; j++) {
        matchInserts.push({
          tournament_id: tournamentId,
          group_id: g.id,
          phase: 'group',
          round_order: 0,
          home_player_id: groupPlayers[i].id,
          away_player_id: groupPlayers[j].id,
          status: 'scheduled',
        })
      }
    }
  }

  if (matchInserts.length > 0) {
    const { error } = await supabase.from('matches').insert(matchInserts)
    if (error) throw error
  }

  await updateTournamentStatus(tournamentId, 'groups')
}

function nextPowerOf2(n: number): number {
  if (n < 1) return 1
  return Math.pow(2, Math.ceil(Math.log2(n)))
}

export async function generateKnockoutStage(
  tournamentId: string,
  players: Player[],
  groups: Group[],
  matches: Match[]
) {
  // Validate group sizes and standings
  const groupStandings = groups.map((g) => ({
    group: g,
    standings: computeGroupStandings(
      players.filter((p) => p.group_id === g.id),
      matches
    ),
  }))

  const firsts: TeamStanding[] = []
  const seconds: TeamStanding[] = []
  const thirds: TeamStanding[] = []

  for (const { standings } of groupStandings) {
    if (standings[0]) firsts.push(standings[0])
    if (standings[1]) seconds.push(standings[1])
    if (standings[2]) thirds.push(standings[2])
  }

  const autoQualified = firsts.length + seconds.length
  const targetTeams = nextPowerOf2(autoQualified)
  const neededThirds = targetTeams - autoQualified

  if (neededThirds > thirds.length) {
    throw new Error(
      `Se necesitan ${neededThirds} mejores terceros pero solo hay ${thirds.length}. Ajusta la cantidad de grupos.`
    )
  }

  // Sort each bucket by performance
  const sortByPerf = (a: TeamStanding, b: TeamStanding) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.gd !== a.gd) return b.gd - a.gd
    if (b.gf !== a.gf) return b.gf - a.gf
    return a.player.name.localeCompare(b.player.name)
  }

  firsts.sort(sortByPerf)
  seconds.sort(sortByPerf)
  thirds.sort(sortByPerf)

  const selectedThirds = thirds.slice(0, neededThirds)

  // Build seed list: 1st places first, then 2nd places, then selected 3rd places
  const seeded: { standing: TeamStanding; seed: number }[] = [
    ...firsts.map((s) => ({ standing: s, seed: 1 })),
    ...seconds.map((s) => ({ standing: s, seed: 2 })),
    ...selectedThirds.map((s) => ({ standing: s, seed: 3 })),
  ]

  // Delete existing knockout matches
  const phases: MatchPhase[] = ['round_of_16', 'quarter', 'semi', 'third_place', 'final']
  for (const phase of phases) {
    await deleteMatchesByPhase(tournamentId, phase)
  }

  // Create bracket tree bottom-up
  const rounds: MatchPhase[] =
    targetTeams === 2
      ? ['final']
      : targetTeams === 4
      ? ['semi', 'final']
      : targetTeams === 8
      ? ['quarter', 'semi', 'final']
      : ['round_of_16', 'quarter', 'semi', 'final']

  // Create all matches
  const created: Match[] = []
  let previousRound: Match[] = []

  for (let r = 0; r < rounds.length; r++) {
    const phase = rounds[r]
    const count = targetTeams / Math.pow(2, r + 1)
    const currentRound: Match[] = []
    for (let i = 0; i < count; i++) {
      const { data, error } = await supabase
        .from('matches')
        .insert({
          tournament_id: tournamentId,
          phase,
          round_order: i,
          status: 'scheduled',
        })
        .select()
        .single()
      if (error) throw error
      currentRound.push(data)
    }
    created.push(...currentRound)

    // Link previous round winners to current round
    if (previousRound.length > 0) {
      for (let i = 0; i < previousRound.length; i++) {
        const child = previousRound[i]
        const parent = currentRound[Math.floor(i / 2)]
        const position = i % 2 === 0 ? 'home' : 'away'
        const { error } = await supabase
          .from('matches')
          .update({
            next_match_id: parent.id,
            next_match_position: position,
          })
          .eq('id', child.id)
        if (error) throw error
      }
    }
    previousRound = currentRound
  }

  // Assign first round teams: strongest vs weakest
  const firstRoundMatches = created.filter((m) => m.phase === rounds[0])
  // Pair seed 0 vs seed N-1, 1 vs N-2, etc.
  for (let i = 0; i < firstRoundMatches.length; i++) {
    const home = seeded[i]
    const away = seeded[targetTeams - 1 - i]
    if (!home || !away) continue
    const { error } = await supabase
      .from('matches')
      .update({
        home_player_id: home.standing.player.id,
        away_player_id: away.standing.player.id,
      })
      .eq('id', firstRoundMatches[i].id)
    if (error) throw error
  }

  // Third place match: losers of semifinals
  if (rounds.includes('semi')) {
    const { error } = await supabase.from('matches').insert({
      tournament_id: tournamentId,
      phase: 'third_place',
      round_order: 0,
      status: 'scheduled',
    })
    if (error) throw error
  }

  await updateTournamentStatus(tournamentId, 'knockout')
}

// Save match result and propagate winner
export async function saveMatchResult(
  match: Match,
  values: {
    home_score: number
    away_score: number
    extra_time_home?: number
    extra_time_away?: number
    penalties_home?: number
    penalties_away?: number
  }
): Promise<Match> {
  const oldValues = {
    home_score: match.home_score,
    away_score: match.away_score,
    extra_time_home: match.extra_time_home,
    extra_time_away: match.extra_time_away,
    penalties_home: match.penalties_home,
    penalties_away: match.penalties_away,
    winner_player_id: match.winner_player_id,
    status: match.status,
  }

  // Determine winner
  let winnerId: string | null = null
  if (values.home_score > values.away_score) {
    winnerId = match.home_player_id
  } else if (values.away_score > values.home_score) {
    winnerId = match.away_player_id
  } else if (
    values.penalties_home !== undefined &&
    values.penalties_away !== undefined &&
    values.penalties_home !== values.penalties_away
  ) {
    winnerId =
      values.penalties_home > values.penalties_away
        ? match.home_player_id
        : match.away_player_id
  }

  const session = await getSession()
  const adminId = session.data.session?.user.id

  const { data: updated, error } = await supabase
    .from('matches')
    .update({
      ...values,
      winner_player_id: winnerId,
      status: 'finished',
      edited_at: new Date().toISOString(),
    })
    .eq('id', match.id)
    .select()
    .single()
  if (error) throw error

  // Log edit
  await supabase.from('result_edits').insert({
    match_id: match.id,
    admin_user_id: adminId,
    old_values: oldValues,
    new_values: {
      ...values,
      winner_player_id: winnerId,
      status: 'finished',
    },
  })

  // Propagate winner to next knockout match
  if (match.next_match_id && winnerId) {
    const updateField =
      match.next_match_position === 'away' ? 'away_player_id' : 'home_player_id'
    await supabase
      .from('matches')
      .update({ [updateField]: winnerId })
      .eq('id', match.next_match_id)
  }

  // Semifinals: winner goes to final, loser goes to third place match
  if (match.phase === 'semi' && winnerId && match.home_player_id && match.away_player_id) {
    const loserId =
      winnerId === match.home_player_id ? match.away_player_id : match.home_player_id
    const position = match.next_match_position === 'away' ? 'away_player_id' : 'home_player_id'
    let { data: thirdPlaceMatches } = await supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', match.tournament_id)
      .eq('phase', 'third_place')

    // Create third place match if it doesn't exist (defensive fallback)
    if (!thirdPlaceMatches || thirdPlaceMatches.length === 0) {
      const { data: created } = await supabase
        .from('matches')
        .insert({
          tournament_id: match.tournament_id,
          phase: 'third_place',
          round_order: 0,
          status: 'scheduled',
        })
        .select()
        .single()
      if (created) thirdPlaceMatches = [created]
    }

    if (thirdPlaceMatches && thirdPlaceMatches.length > 0) {
      const updateData: Record<string, string | null> = { [position]: loserId }
      // Reset result if third place match was finished (players changed)
      if (thirdPlaceMatches[0].status === 'finished') {
        updateData.status = 'scheduled'
        updateData.home_score = null
        updateData.away_score = null
        updateData.penalties_home = null
        updateData.penalties_away = null
        updateData.winner_player_id = null
      }
      await supabase
        .from('matches')
        .update(updateData)
        .eq('id', thirdPlaceMatches[0].id)
    }
  }

  return updated
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

export async function deleteAllTournamentData(tournamentId: string) {
  const { data: matchIds } = await supabase
    .from('matches')
    .select('id')
    .eq('tournament_id', tournamentId)
  const ids = matchIds?.map(m => m.id) || []
  if (ids.length > 0) {
    await supabase.from('result_edits').delete().in('match_id', ids)
  }
  await supabase.from('matches').delete().eq('tournament_id', tournamentId)
  await supabase.from('players').delete().eq('tournament_id', tournamentId)
  await supabase.from('groups').delete().eq('tournament_id', tournamentId)
  await supabase.from('tournaments').delete().eq('id', tournamentId)
}
