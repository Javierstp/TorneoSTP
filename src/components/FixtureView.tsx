import type { Player, Match } from '../types'
import { PlayerBadge } from './PlayerBadge'

interface Props {
  players: Player[]
  matches: Match[]
}

const PHASE_CONFIG: Record<Match['phase'], { label: string; color: string }> = {
  group: { label: 'Fase de grupos', color: 'text-blue-400 bg-blue-400/10 border-blue-400/30' },
  round_of_16: { label: 'Octavos', color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/30' },
  quarter: { label: 'Cuartos', color: 'text-purple-400 bg-purple-400/10 border-purple-400/30' },
  semi: { label: 'Semifinal', color: 'text-violet-400 bg-violet-400/10 border-violet-400/30' },
  third_place: { label: '3er Puesto', color: 'text-gray-400 bg-gray-400/10 border-gray-400/30' },
  final: { label: 'Final', color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
}

export function FixtureView({ players, matches }: Props) {
  const playerMap = new Map(players.map((p) => [p.id, p]))
  const sorted = [...matches].sort((a, b) => {
    const dateA = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Infinity
    const dateB = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Infinity
    return dateA - dateB || a.created_at.localeCompare(b.created_at)
  })

  if (sorted.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-14 h-14 mx-auto rounded-full bg-gray-700/30 flex items-center justify-center mb-4">
          <CalendarDaysIcon />
        </div>
        <h2 className="text-xl font-bold text-gray-300 mb-2">Partidos</h2>
        <p className="text-gray-500 text-sm">No hay partidos programados.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-100">Partidos</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-[#1e2d45] to-transparent" />
      </div>
      <div className="space-y-2">
        {sorted.map((m) => {
          const cfg = PHASE_CONFIG[m.phase]
          return (
            <div
              key={m.id}
              className="card-surface card-hover flex flex-col md:flex-row md:items-center gap-3 px-4 py-3"
            >
              <div className="flex items-center gap-3 md:w-44 shrink-0">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}>
                  {cfg.label}
                </span>
              </div>
              <div className="flex-1 flex items-center justify-center gap-4">
                <div className="flex-1 flex justify-end">
                  <PlayerBadge
                    player={m.home_player_id ? playerMap.get(m.home_player_id) : null}
                    reverse
                  />
                </div>
                <div className="text-center min-w-[80px]">
                  {m.status === 'finished' ? (
                    <div className="text-lg font-bold font-mono">
                      <span className={m.winner_player_id === m.home_player_id ? 'text-emerald-400' : 'text-gray-300'}>
                        {m.home_score}
                      </span>
                      <span className="text-gray-500 mx-1">–</span>
                      <span className={m.winner_player_id === m.away_player_id ? 'text-emerald-400' : 'text-gray-300'}>
                        {m.away_score}
                      </span>
                      {m.penalties_home != null && m.penalties_away != null && (
                        <span className="text-xs ml-2 text-amber-400/70 font-normal">
                          ({m.penalties_home}–{m.penalties_away} pen.)
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-lg font-bold text-gray-600">vs</div>
                  )}
                </div>
                <div className="flex-1">
                  <PlayerBadge
                    player={m.away_player_id ? playerMap.get(m.away_player_id) : null}
                  />
                </div>
              </div>
              <div className="text-xs text-gray-500 md:w-32 md:text-right shrink-0">
                {m.scheduled_at
                  ? new Date(m.scheduled_at).toLocaleString('es-ES', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                    })
                  : <span className="italic">Sin fecha</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CalendarDaysIcon() {
  return (
    <svg className="w-7 h-7 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}
