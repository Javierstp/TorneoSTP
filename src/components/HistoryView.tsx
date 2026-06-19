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

export function HistoryView({ players, matches }: Props) {
  const playerMap = new Map(players.map((p) => [p.id, p]))
  const finished = matches
    .filter((m) => m.status === 'finished')
    .sort(
      (a, b) =>
        new Date(b.scheduled_at || b.created_at).getTime() -
        new Date(a.scheduled_at || a.created_at).getTime()
    )

  if (finished.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-14 h-14 mx-auto rounded-full bg-gray-700/30 flex items-center justify-center mb-4">
          <span className="text-2xl text-gray-500">📋</span>
        </div>
        <h2 className="text-xl font-bold text-gray-300 mb-2">Historial de partidos</h2>
        <p className="text-gray-500 text-sm">Aún no se ha jugado ningún partido.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-100">Historial de partidos</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-[#1e2d45] to-transparent" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {finished.map((m) => {
          const cfg = PHASE_CONFIG[m.phase]
          return (
            <div key={m.id} className="card-surface p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}>
                  {cfg.label}
                </span>
                {m.edited_at && (
                  <span className="text-xs text-amber-400/60">Editado</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <PlayerBadge
                  player={m.home_player_id ? playerMap.get(m.home_player_id) : null}
                  reverse
                />
                <div className="text-2xl font-bold font-mono shrink-0 mx-2">
                  <span className={m.winner_player_id === m.home_player_id ? 'text-emerald-400' : 'text-gray-300'}>
                    {m.home_score}
                  </span>
                  <span className="text-gray-600 mx-1">–</span>
                  <span className={m.winner_player_id === m.away_player_id ? 'text-emerald-400' : 'text-gray-300'}>
                    {m.away_score}
                  </span>
                  {m.penalties_home != null && m.penalties_away != null && (
                    <span className="text-xs ml-1.5 text-amber-400/70 font-normal">
                      ({m.penalties_home}–{m.penalties_away})
                    </span>
                  )}
                </div>
                <PlayerBadge
                  player={m.away_player_id ? playerMap.get(m.away_player_id) : null}
                />
              </div>
              {(m.penalties_home != null || m.penalties_away != null) && (
                <div className="text-xs text-amber-400/50 text-center border-t border-[#1e2d45]/50 pt-2 mt-2">
                  Def. por penales
                </div>
              )}
              {m.scheduled_at && (
                <div className="text-xs text-gray-600 text-center mt-2">
                  {new Date(m.scheduled_at).toLocaleString('es-ES', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
