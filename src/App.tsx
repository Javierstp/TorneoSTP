import { useEffect, useState } from 'react'
import type { Tournament, Group, Player, Match } from './types'
import { supabase } from './lib/supabase'
import {
  fetchTournaments,
  fetchTournament,
  fetchPlayers,
  fetchGroups,
  fetchMatches,
  getSession,
} from './lib/data'
import { Bracket } from './components/Bracket'
import { GroupsView } from './components/GroupsView'
import { FixtureView } from './components/FixtureView'
import { HistoryView } from './components/HistoryView'
import { AdminPanel } from './components/AdminPanel'
import { LoginForm } from './components/LoginForm'
import { Trophy, Users, CalendarDays, History, Shield, Loader2 } from 'lucide-react'

type View = 'home' | 'groups' | 'fixture' | 'history' | 'admin' | 'login'

function StatusBadge({ status }: { status: Tournament['status'] }) {
  const config = {
    setup: { label: 'Configuración', classes: 'bg-amber-400/10 text-amber-400 border-amber-400/30' },
    groups: { label: 'Fase de grupos', classes: 'bg-blue-400/10 text-blue-400 border-blue-400/30' },
    knockout: { label: 'Eliminatorias', classes: 'bg-purple-400/10 text-purple-400 border-purple-400/30' },
    finished: { label: 'Finalizado', classes: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30' },
  }
  const c = config[status]
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${c.classes}`}>
      {c.label}
    </span>
  )
}

function App() {
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [session, setSession] = useState<any>(null)
  const [view, setView] = useState<View>('home')
  const [loading, setLoading] = useState(true)

  async function loadData() {
    try {
      const tournaments = await fetchTournaments()
      const current = tournaments[0] || null
      if (!current) {
        setTournament(null)
        setLoading(false)
        return
      }
      setTournament(current)
      const [p, g, m] = await Promise.all([
        fetchPlayers(current.id),
        fetchGroups(current.id),
        fetchMatches(current.id),
      ])
      setPlayers(p)
      setGroups(g)
      setMatches(m)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => listener?.subscription.unsubscribe()
  }, [])

  const refresh = async () => {
    if (!tournament) return
    const [t, p, g, m] = await Promise.all([
      fetchTournament(tournament.id),
      fetchPlayers(tournament.id),
      fetchGroups(tournament.id),
      fetchMatches(tournament.id),
    ])
    if (t) setTournament(t)
    setPlayers(p)
    setGroups(g)
    setMatches(m)
  }

  const isAdmin = !!session

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c18] flex items-center justify-center gap-3">
        <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
        <span className="text-gray-400">Cargando torneo...</span>
      </div>
    )
  }

  if (!tournament) {
    if (view === 'login') {
      return (
        <div className="min-h-screen bg-[#080c18] flex items-center justify-center p-4">
          <LoginForm
            onSuccess={() => {
              setView('admin')
              refresh()
            }}
          />
        </div>
      )
    }
    return (
      <div className="min-h-screen bg-[#080c18] flex items-center justify-center p-4">
        <div className="max-w-md w-full card-surface p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-400/10 flex items-center justify-center mb-5">
            <Trophy className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-100 mb-2">No hay torneo activo</h1>
          <p className="text-gray-400 mb-6 text-sm">
            Ve al panel de administración para crear el torneo.
          </p>
          {isAdmin ? (
            <AdminPanel
              tournament={null}
              players={players}
              groups={groups}
              matches={matches}
              onChange={async () => {
                await loadData()
              }}
            />
          ) : (
            <button
              onClick={() => setView('login')}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black rounded-lg font-semibold hover:from-amber-400 hover:to-amber-500 transition"
            >
              Acceder como admin
            </button>
          )}
        </div>
      </div>
    )
  }

  const navItems: { key: View; label: string; icon: any }[] = [
    { key: 'home', label: 'Inicio', icon: Trophy },
    { key: 'groups', label: 'Grupos', icon: Users },
    { key: 'fixture', label: 'Partidos', icon: CalendarDays },
    { key: 'history', label: 'Historial', icon: History },
  ]

  return (
    <div className="min-h-screen bg-[#080c18]">
      <header className="bg-gradient-to-b from-[#0f1a2e] to-[#0a1120] border-b border-[#1e2d45] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-100 tracking-tight">{tournament.name}</h1>
              <StatusBadge status={tournament.status} />
            </div>
          </div>
          <nav className="flex flex-wrap gap-1.5">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setView(item.key)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                  view === item.key
                    ? 'bg-amber-400/15 text-amber-400 shadow-sm shadow-amber-400/5'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
            <div className="w-px bg-[#1e2d45] mx-1 self-stretch" />
            {isAdmin ? (
              <button
                onClick={() => setView('admin')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                  view === 'admin'
                    ? 'bg-amber-400/15 text-amber-400 shadow-sm shadow-amber-400/5'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <Shield className="w-4 h-4" />
                Admin
              </button>
            ) : (
              <button
                onClick={() => setView('login')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-200 hover:bg-white/5 transition"
              >
                <Shield className="w-4 h-4" />
                Admin
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {view === 'home' && (tournament.status === 'knockout' || tournament.status === 'finished') && (
          <Bracket tournament={tournament} players={players} matches={matches} />
        )}
        {view === 'home' && (tournament.status === 'setup' || tournament.status === 'groups') && (
          <GroupsView
            tournament={tournament}
            players={players}
            groups={groups}
            matches={matches}
          />
        )}
        {view === 'groups' && (
          <GroupsView
            tournament={tournament}
            players={players}
            groups={groups}
            matches={matches}
          />
        )}
        {view === 'fixture' && (
          <FixtureView players={players} matches={matches} />
        )}
        {view === 'history' && (
          <HistoryView players={players} matches={matches} />
        )}
        {view === 'admin' && isAdmin && (
          <AdminPanel
            tournament={tournament}
            players={players}
            groups={groups}
            matches={matches}
            onChange={refresh}
          />
        )}
        {view === 'login' && (
          <LoginForm
            onSuccess={() => {
              setView('admin')
              refresh()
            }}
          />
        )}
      </main>

      <footer className="border-t border-[#1e2d45] py-4 mt-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs text-gray-600">
          Torneo de FIFA — uso interno
        </div>
      </footer>
    </div>
  )
}

export default App
