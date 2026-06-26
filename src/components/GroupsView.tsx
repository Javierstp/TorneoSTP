import { computeGroupStandings } from '../lib/data'
import type { Tournament, Group, Player, Match } from '../types'
import { PlayerBadge } from './PlayerBadge'

interface Props {
  tournament: Tournament
  players: Player[]
  groups: Group[]
  matches: Match[]
}

const POSITION_CLASSES = [
  'border-l-2 border-amber-400/60',
  'border-l-2 border-gray-400/40',
  'border-l-2 border-transparent',
  'border-l-2 border-transparent',
]

const POSITION_BG = [
  'bg-amber-400/5',
  'bg-gray-400/5',
  '',
  '',
]

export function GroupsView({ players, groups, matches }: Props) {
  if (groups.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-14 h-14 mx-auto rounded-full bg-gray-700/30 flex items-center justify-center mb-4">
          <span className="text-2xl text-gray-500">🏆</span>
        </div>
        <h2 className="text-xl font-bold text-gray-300 mb-2">Fase de grupos</h2>
        <p className="text-gray-500 text-sm">Los grupos aún no han sido generados.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-100">Tablas de posiciones</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-[#1e2d45] to-transparent" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {groups.map((group) => {
          const groupPlayers = players.filter((p) => p.group_id === group.id)
          const standings = computeGroupStandings(groupPlayers, matches)
          return (
            <div key={group.id} className="card-surface overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1e2d45] flex items-center justify-between">
                <h3 className="font-bold text-gray-200">Grupo {group.name}</h3>
                <span className="text-xs text-gray-500">
                  {standings.filter(s => s.played > 0).length}/{groupPlayers.length} jugados
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-[#1e2d45]">
                      <th className="text-left py-3 pl-4 w-1"></th>
                      <th className="text-left py-3 pr-4">Equipo</th>
                      <th className="text-center py-3 px-2">PJ</th>
                      <th className="text-center py-3 px-2">G</th>
                      <th className="text-center py-3 px-2">E</th>
                      <th className="text-center py-3 px-2">P</th>
                      <th className="text-center py-3 px-2">GF</th>
                      <th className="text-center py-3 px-2">GC</th>
                      <th className="text-center py-3 px-2">DG</th>
                      <th className="text-center py-3 pr-4">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((s, idx) => (
                      <tr
                        key={s.player.id}
                        className={`border-b border-[#1e2d45]/50 last:border-0 transition ${
                          POSITION_BG[idx] || 'hover:bg-white/[0.02]'
                        } ${POSITION_CLASSES[idx] || ''}`}
                      >
                        <td className="pl-4 pr-1 py-2.5 w-6">
                          {idx < 2 ? (
                            <span className={`text-xs font-bold ${idx === 0 ? 'text-amber-400' : 'text-gray-400'}`}>
                              {idx + 1}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-600">{idx + 1}</span>
                          )}
                        </td>
                        <td className="pr-4 py-2.5">
                          <PlayerBadge player={s.player} />
                        </td>
                        <td className="text-center py-2.5 px-2 text-gray-300 font-mono">{s.played}</td>
                        <td className="text-center py-2.5 px-2 text-gray-300 font-mono">{s.won}</td>
                        <td className="text-center py-2.5 px-2 text-gray-300 font-mono">{s.drawn}</td>
                        <td className="text-center py-2.5 px-2 text-gray-300 font-mono">{s.lost}</td>
                        <td className="text-center py-2.5 px-2 text-gray-300 font-mono">{s.gf}</td>
                        <td className="text-center py-2.5 px-2 text-gray-300 font-mono">{s.ga}</td>
                        <td className={`text-center py-2.5 px-2 font-mono ${s.gd > 0 ? 'text-emerald-400' : s.gd < 0 ? 'text-red-400' : 'text-gray-300'}`}>
                          {s.gd > 0 ? '+' : ''}{s.gd}
                        </td>
                        <td className="text-center py-2.5 pr-4 font-bold text-gray-100">{s.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
