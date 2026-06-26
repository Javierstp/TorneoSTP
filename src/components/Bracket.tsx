import type { Tournament, Player, Match } from '../types'
import { PlayerBadge } from './PlayerBadge'
import { formatMatchDate } from '../lib/date'

interface Props {
  tournament: Tournament
  players: Player[]
  matches: Match[]
}

const PHASE_ORDER: { phase: Match['phase']; label: string }[] = [
  { phase: 'round_of_16', label: 'Octavos' },
  { phase: 'quarter', label: 'Cuartos' },
  { phase: 'semi', label: 'Semifinal' },
  { phase: 'third_place', label: '3er Puesto' },
  { phase: 'final', label: 'Final' },
]

const PHASE_COLORS: Record<string, string> = {
  round_of_16: 'text-blue-400 border-blue-400/30',
  quarter: 'text-indigo-400 border-indigo-400/30',
  semi: 'text-purple-400 border-purple-400/30',
  third_place: 'text-gray-400 border-gray-400/30',
  final: 'text-amber-400 border-amber-400/30',
}

export function Bracket({ players, matches }: Props) {
  const knockoutMatches = matches.filter((m) => m.phase !== 'group')

  if (knockoutMatches.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-14 h-14 mx-auto rounded-full bg-gray-700/30 flex items-center justify-center mb-4">
          <span className="text-2xl text-gray-500">🏆</span>
        </div>
        <h2 className="text-xl font-bold text-gray-300 mb-2">Fase eliminatoria</h2>
        <p className="text-gray-500 text-sm">Aún no se ha generado la fase eliminatoria.</p>
      </div>
    )
  }

  const playerMap = new Map(players.map((p) => [p.id, p]))

  const visiblePhases = PHASE_ORDER.filter(({ phase }) =>
    knockoutMatches.some((m) => m.phase === phase)
  )

  if (visiblePhases.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p>No hay partidos de eliminación.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-100">Llave del torneo</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-[#1e2d45] to-transparent" />
      </div>
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-8 min-w-max px-2">
          {visiblePhases.map(({ phase, label }, phaseIdx) => {
            const phaseMatches = knockoutMatches
              .filter((m) => m.phase === phase)
              .sort((a, b) => a.round_order - b.round_order)
            if (phaseMatches.length === 0) return null

            const isThirdPlace = phase === 'third_place'

            return (
              <div key={phase} className="flex flex-col justify-around gap-4 min-h-[300px]">
                <div className="text-center mb-1">
                  <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${PHASE_COLORS[phase] || 'text-gray-500 border-gray-500/30'}`}>
                    {label}
                  </span>
                </div>
                {isThirdPlace && (
                  <div className="flex-1 flex items-center justify-center text-gray-600 text-xs">
                    Perdedores de semifinales
                  </div>
                )}
                {phaseMatches.map((m) => (
                  <MatchCard key={m.id} match={m} playerMap={playerMap} />
                ))}
                {/* Connector lines between rounds */}
                {phaseIdx < visiblePhases.length - 1 && phaseMatches.length > 1 && (
                  <div className="hidden md:block absolute inset-0 pointer-events-none" />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function MatchCard({
  match,
  playerMap,
}: {
  match: Match
  playerMap: Map<string, Player>
}) {
  const home = match.home_player_id ? playerMap.get(match.home_player_id) : null
  const away = match.away_player_id ? playerMap.get(match.away_player_id) : null
  const isFinished = match.status === 'finished'
  const homeWon = isFinished && match.winner_player_id === match.home_player_id
  const awayWon = isFinished && match.winner_player_id === match.away_player_id

  return (
    <div className={`w-56 rounded-lg border transition ${
      isFinished
        ? 'border-emerald-500/30 bg-emerald-500/5'
        : match.status === 'scheduled' && match.home_player_id
          ? 'border-[#1e2d45] bg-[#111b2e]'
          : 'border-[#1e2d45]/40 bg-[#111b2e]/60'
    }`}>
      {/* Home team */}
      <div className={`flex items-center justify-between px-3.5 py-2.5 border-b border-[#1e2d45]/50 ${
        homeWon ? 'bg-emerald-500/5' : ''
      }`}>
        <PlayerBadge player={home} />
        <span className={`font-bold text-lg font-mono ml-3 ${
          homeWon ? 'text-emerald-400' : isFinished ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {isFinished ? `${match.home_score ?? '-'}` : '-'}
          {isFinished && match.penalties_home != null && (
            <span className="text-xs ml-0.5 font-normal">({match.penalties_home})</span>
          )}
        </span>
      </div>
      {/* Away team */}
      <div className={`flex items-center justify-between px-3.5 py-2.5 ${
        !homeWon && awayWon ? 'bg-emerald-500/5 rounded-b-lg' : ''
      }`}>
        <PlayerBadge player={away} />
        <span className={`font-bold text-lg font-mono ml-3 ${
          awayWon ? 'text-emerald-400' : isFinished ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {isFinished ? `${match.away_score ?? '-'}` : '-'}
          {isFinished && match.penalties_away != null && (
            <span className="text-xs ml-0.5 font-normal">({match.penalties_away})</span>
          )}
        </span>
      </div>
      {/* Extra info */}
      {isFinished && match.penalties_home != null && (
        <div className="border-t border-[#1e2d45]/30 px-3.5 py-1 text-xs text-amber-400/60 text-center">
          Penales
        </div>
      )}
      {match.scheduled_at && !isFinished && (
        <div className="border-t border-[#1e2d45]/30 px-3.5 py-1.5 text-xs text-sky-300 text-center flex items-center justify-center gap-1">
          <ClockIcon />
          {formatMatchDate(match.scheduled_at)}
        </div>
      )}
    </div>
  )
}

function ClockIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
