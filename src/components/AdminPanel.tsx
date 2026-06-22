import { useState, useMemo } from 'react'
import type { Tournament, Group, Player, Match } from '../types'
import { supabase } from '../lib/supabase'
import {
  createTournament,
  createPlayer,
  updatePlayerGroup,
  deletePlayer,
  generateGroupStage,
  generateKnockoutStage,
  updateMatch,
  saveMatchResult,
  signOut,
  deleteAllTournamentData,
  getSession,
  updateTournamentStatus,
  updatePassword
} from '../lib/data'
import { COUNTRIES } from '../lib/countries'
import { PlayerBadge } from './PlayerBadge'
import {
  Trophy,
  Users,
  Swords,
  Calendar,
  LogOut,
  Trash2,
  Save,
  Plus,
  Loader2,
  Check,
  ChevronRight,
  Key,
  Eye,
  EyeOff
} from 'lucide-react'

interface Props {
  tournament: Tournament | null
  players: Player[]
  groups: Group[]
  matches: Match[]
  onChange: () => Promise<void>
}

export function AdminPanel({
  tournament,
  players,
  groups,
  matches,
  onChange
}: Props) {
  const [activeTab, setActiveTab] = useState<
    'tournament' | 'players' | 'groups' | 'matches' | 'knockout'
  >('players')

  async function handleSignOut() {
    await signOut()
    window.location.reload()
  }

  if (!tournament) {
    return (
      <div className="max-w-xl mx-auto card-surface p-8">
        <h2 className="text-xl font-bold text-gray-100 mb-6 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" /> Crear torneo
        </h2>
        <CreateTournamentForm onCreated={onChange} />
      </div>
    )
  }

  const tabs = [
    { key: 'players' as const, icon: Users, label: 'Jugadores' },
    { key: 'groups' as const, icon: Swords, label: 'Grupos' },
    { key: 'matches' as const, icon: Calendar, label: 'Partidos' },
    { key: 'knockout' as const, icon: Trophy, label: 'Eliminatoria' },
    { key: 'tournament' as const, icon: Trophy, label: 'Torneo' }
  ]

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-100">
            Panel de administración
          </h2>
          <div className="h-px w-20 bg-gradient-to-r from-[#1e2d45] to-transparent" />
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 font-medium transition"
        >
          <LogOut className="w-4 h-4" /> Cerrar sesión
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-6 justify-center">
        {tabs.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === key
                ? 'bg-amber-400/15 text-amber-400 shadow-sm shadow-amber-400/5'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'tournament' && (
        <TournamentEditor tournament={tournament} onChange={onChange} />
      )}
      {activeTab === 'players' && (
        <PlayerManager
          tournament={tournament}
          players={players}
          onChange={onChange}
        />
      )}
      {activeTab === 'groups' && (
        <GroupManager
          tournament={tournament}
          players={players}
          groups={groups}
          onChange={onChange}
        />
      )}
      {activeTab === 'matches' && (
        <MatchManager
          players={players}
          groups={groups}
          matches={matches}
          onChange={onChange}
        />
      )}
      {activeTab === 'knockout' && (
        <KnockoutManager
          tournament={tournament}
          players={players}
          groups={groups}
          matches={matches}
          onChange={onChange}
        />
      )}
    </div>
  )
}

/* ---------- Subcomponents ---------- */

function CreateTournamentForm({
  onCreated
}: {
  onCreated: () => Promise<void>
}) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await createTournament(name)
    setLoading(false)
    await onCreated()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">
          Nombre del torneo
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-[#1e2d45] bg-[#0a1120] px-3 py-2.5 text-gray-200 text-sm placeholder:text-gray-600 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 transition"
          placeholder="Ej: Copa Mundial 2026"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-black rounded-lg px-4 py-2.5 font-semibold hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 transition flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Creando...
          </>
        ) : (
          'Crear torneo'
        )}
      </button>
    </form>
  )
}

function TournamentEditor({
  tournament,
  onChange
}: {
  tournament: Tournament
  onChange: () => Promise<void>
}) {
  const [name, setName] = useState(tournament.name)
  const [saved, setSaved] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [password, setPassword] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordChanging, setPasswordChanging] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)

  async function handleSave() {
    await supabase.from('tournaments').update({ name }).eq('id', tournament.id)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    await onChange()
  }

  async function handleDelete() {
    setDeleteError('')
    setDeleting(true)
    try {
      const { data } = await getSession()
      const email = data.session?.user?.email
      if (!email) throw new Error('No se pudo obtener el email del admin')

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw new Error('Contraseña incorrecta')

      await deleteAllTournamentData(tournament.id)
      window.location.reload()
    } catch (e: unknown) {
      setDeleteError(
        e instanceof Error ? e.message : 'Error al eliminar torneo'
      )
    } finally {
      setDeleting(false)
    }
  }

  async function handlePasswordChange() {
    setPasswordError('')
    setPasswordSuccess(false)
    if (newPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden')
      return
    }
    setPasswordChanging(true)
    try {
      await updatePassword(newPassword)
      setPasswordSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setShowPasswordChange(false), 2000)
    } catch (e: unknown) {
      setPasswordError(e instanceof Error ? e.message : 'Error al cambiar contraseña')
    } finally {
      setPasswordChanging(false)
    }
  }

  return (
    <div className="card-surface p-6 space-y-4 max-w-md mx-auto">
      <h3 className="font-bold text-gray-200 text-center">
        Configuración del torneo
      </h3>
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">
          Nombre
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-[#1e2d45] bg-[#0a1120] px-3 py-2.5 text-gray-200 text-sm focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 transition"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-amber-500/15 text-amber-400 rounded-lg px-4 py-2 font-medium hover:bg-amber-500/25 transition text-sm"
        >
          <Save className="w-4 h-4" /> Guardar
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-emerald-400 text-sm">
            <Check className="w-4 h-4" /> Guardado
          </span>
        )}
      </div>

      <hr className="border-[#1e2d45]" />

      {(tournament.status === 'groups' || tournament.status === 'knockout') && (
        <>
          <button
            onClick={async () => {
              if (
                !confirm(
                  '¿Finalizar torneo? Esto marcará el torneo como completado.'
                )
              )
                return
              await updateTournamentStatus(tournament.id, 'finished')
              await onChange()
            }}
            className="flex items-center gap-2 text-emerald-400/70 hover:text-emerald-400 text-sm font-medium transition"
          >
            <Trophy className="w-4 h-4" /> Finalizar torneo
          </button>
          <hr className="border-[#1e2d45]" />
        </>
      )}

      <div>
        {!showDelete ? (
          <button
            onClick={() => setShowDelete(true)}
            className="flex items-center gap-2 text-red-400/70 hover:text-red-400 text-sm font-medium transition"
          >
            <Trash2 className="w-4 h-4" /> Eliminar torneo
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-400/80 font-medium">
              Ingresa tu contraseña de admin para confirmar
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className="w-full rounded-lg border border-red-400/30 bg-[#0a1120] px-3 py-2 text-gray-200 text-sm placeholder:text-gray-600 focus:outline-none focus:border-red-400/50"
            />
            {deleteError && (
              <p className="text-red-400 text-xs">{deleteError}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting || !password}
                className="flex items-center gap-2 bg-red-500/15 text-red-400 rounded-lg px-4 py-2 text-sm font-medium hover:bg-red-500/25 disabled:opacity-40 transition"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {deleting ? 'Eliminando...' : 'Confirmar'}
              </button>
              <button
                onClick={() => {
                  setShowDelete(false)
                  setPassword('')
                  setDeleteError('')
                }}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-300 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      <hr className="border-[#1e2d45]" />

      <div>
        {!showPasswordChange ? (
          <button
            onClick={() => {
              setShowPasswordChange(true)
              setPasswordError('')
              setPasswordSuccess(false)
            }}
            className="flex items-center gap-2 text-amber-400/70 hover:text-amber-400 text-sm font-medium transition"
          >
            <Key className="w-4 h-4" /> Cambiar contraseña
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-amber-400/80 font-medium">
              Ingresa tu nueva contraseña
            </p>
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nueva contraseña"
                className="w-full rounded-lg border border-amber-400/30 bg-[#0a1120] px-3 py-2 pr-10 text-gray-200 text-sm placeholder:text-gray-600 focus:outline-none focus:border-amber-400/50"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
              >
                {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmar contraseña"
                className="w-full rounded-lg border border-amber-400/30 bg-[#0a1120] px-3 py-2 pr-10 text-gray-200 text-sm placeholder:text-gray-600 focus:outline-none focus:border-amber-400/50"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
              >
                {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordError && (
              <p className="text-red-400 text-xs">{passwordError}</p>
            )}
            {passwordSuccess && (
              <p className="text-emerald-400 text-xs flex items-center gap-1">
                <Check className="w-3 h-3" /> Contraseña actualizada
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handlePasswordChange}
                disabled={passwordChanging || !newPassword || !confirmPassword}
                className="flex items-center gap-2 bg-amber-500/15 text-amber-400 rounded-lg px-4 py-2 text-sm font-medium hover:bg-amber-500/25 disabled:opacity-40 transition"
              >
                {passwordChanging ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Key className="w-4 h-4" />
                )}
                {passwordChanging ? 'Cambiando...' : 'Cambiar'}
              </button>
              <button
                onClick={() => {
                  setShowPasswordChange(false)
                  setNewPassword('')
                  setConfirmPassword('')
                  setPasswordError('')
                  setPasswordSuccess(false)
                }}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-300 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function PlayerManager({
  tournament,
  players,
  onChange
}: {
  tournament: Tournament
  players: Player[]
  onChange: () => Promise<void>
}) {
  const [name, setName] = useState('')
  const [countryCode, setCountryCode] = useState(COUNTRIES[0].code)
  const [saving, setSaving] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const country = COUNTRIES.find((c) => c.code === countryCode)!
    await createPlayer(tournament.id, name, country.code, country.name)
    setName('')
    await onChange()
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar jugador?')) return
    await deletePlayer(id)
    await onChange()
  }

  return (
    <div className="space-y-6">
      <div className="card-surface p-6 max-w-xl mx-auto">
        <h3 className="font-bold text-gray-200 mb-4">Agregar jugador</h3>
        <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del jugador"
            className="flex-1 rounded-lg border border-[#1e2d45] bg-[#0a1120] px-3 py-2.5 text-gray-200 text-sm placeholder:text-gray-600 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 transition"
            required
          />
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="rounded-lg border border-[#1e2d45] bg-[#0a1120] px-3 py-2.5 text-gray-200 text-sm focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 transition"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-black rounded-lg px-4 py-2.5 font-semibold hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 transition text-sm"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {saving ? 'Agregando...' : 'Agregar'}
          </button>
        </form>
      </div>

      <div className="card-surface p-6 max-w-4xl mx-auto">
        <h3 className="font-bold text-gray-200 mb-4">
          Jugadores registrados{' '}
          <span className="text-gray-500 font-normal">({players.length})</span>
        </h3>
        {players.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">
            No hay jugadores registrados.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[...players]
              .sort((a, b) => a.country_code.localeCompare(b.country_code))
              .map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between border border-[#1e2d45] rounded-lg p-3 hover:border-gray-600 transition"
                >
                  <PlayerBadge player={p} />
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-red-400/60 hover:text-red-400 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

function GroupManager({
  tournament,
  players,
  groups,
  onChange
}: {
  tournament: Tournament
  players: Player[]
  groups: Group[]
  onChange: () => Promise<void>
}) {
  const [moving, setMoving] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    if (
      !confirm(
        'Esto eliminará los grupos y partidos actuales y generará nuevos. ¿Continuar?'
      )
    )
      return
    setLoading(true)
    await generateGroupStage(tournament.id, players)
    await onChange()
    setLoading(false)
  }

  async function handleMove(playerId: string, groupId: string) {
    await updatePlayerGroup(playerId, groupId)
    setMoving(null)
    await onChange()
  }

  const playersByGroup = useMemo(() => {
    const map: Record<string, Player[]> = {}
    for (const g of groups) map[g.id] = []
    for (const p of players) {
      if (p.group_id) {
        if (!map[p.group_id]) map[p.group_id] = []
        map[p.group_id].push(p)
      }
    }
    return map
  }, [players, groups])

  const unassigned = players.filter((p) => !p.group_id)

  return (
    <div className="space-y-6">
      <div className="card-surface p-6 max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-200">Generar grupos</h3>
          <span className="text-sm text-gray-500">
            {players.length} jugadores → {Math.ceil(players.length / 4)} grupos
          </span>
        </div>
        {players.length % 2 !== 0 && (
          <p className="text-red-400 text-sm mb-3">
            La cantidad de jugadores debe ser par para generar los grupos.
          </p>
        )}
        {unassigned.length > 0 && (
          <p className="text-amber-400/70 text-sm mb-3">
            {unassigned.length} jugador(es) sin grupo asignado
          </p>
        )}
        <button
          onClick={handleGenerate}
          disabled={players.length % 2 !== 0 || loading}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-black rounded-lg px-4 py-2.5 font-semibold hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Swords className="w-4 h-4" />
          )}
          {loading ? 'Generando...' : 'Generar grupos aleatorios'}
        </button>
      </div>

      {groups.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">
          Aún no hay grupos generados.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((g) => (
            <div key={g.id} className="card-surface p-4">
              <h3 className="font-bold text-gray-200 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-amber-400/10 text-amber-400 text-xs font-bold flex items-center justify-center">
                  {g.name}
                </span>
                Grupo {g.name}
              </h3>
              {!playersByGroup[g.id] || playersByGroup[g.id].length === 0 ? (
                <p className="text-gray-600 text-sm">Sin jugadores</p>
              ) : (
                <ul className="space-y-2">
                  {playersByGroup[g.id]?.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between border border-[#1e2d45] rounded-lg p-2.5"
                    >
                      <PlayerBadge player={p} />
                      {moving === p.id ? (
                        <select
                          value={p.group_id || ''}
                          onChange={(e) => handleMove(p.id, e.target.value)}
                          className="text-sm border border-[#1e2d45] bg-[#0a1120] rounded px-2 py-1 text-gray-200 focus:outline-none"
                        >
                          {groups.map((gg) => (
                            <option key={gg.id} value={gg.id}>
                              Grupo {gg.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <button
                          onClick={() => setMoving(p.id)}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 font-medium transition"
                        >
                          Mover <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MatchManager({
  players,
  groups,
  matches,
  onChange
}: {
  players: Player[]
  groups: Group[]
  matches: Match[]
  onChange: () => Promise<void>
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [penaltyEnabled, setPenaltyEnabled] = useState<Set<string>>(new Set())
  const playerMap = new Map(players.map((p) => [p.id, p]))
  const groupMap = new Map(groups.map((g) => [g.id, g]))

  async function saveSchedule(matchId: string, date: string) {
    await updateMatch({ id: matchId, scheduled_at: date || null })
    await onChange()
  }

  async function saveResult(matchId: string, formData: FormData) {
    const home_score = parseInt(formData.get('home_score') as string)
    const away_score = parseInt(formData.get('away_score') as string)
    const hasPenalties = formData.get('has_penalties') === 'on'
    const penalties_home = hasPenalties
      ? parseInt(formData.get('penalties_home') as string)
      : undefined
    const penalties_away = hasPenalties
      ? parseInt(formData.get('penalties_away') as string)
      : undefined

    const match = matches.find((m) => m.id === matchId)!
    await saveMatchResult(match, {
      home_score,
      away_score,
      penalties_home,
      penalties_away
    })
    setEditingId(null)
    await onChange()
  }

  const sorted = [...matches].sort((a, b) => {
    if (a.phase === 'group' && b.phase !== 'group') return -1
    if (a.phase !== 'group' && b.phase === 'group') return 1

    if (a.phase === 'group' && b.phase === 'group') {
      const gA = groupMap.get(a.group_id || '')?.order_index ?? 0
      const gB = groupMap.get(b.group_id || '')?.order_index ?? 0
      if (gA !== gB) return gA - gB
      const aHasDate = a.scheduled_at ? 0 : 1
      const bHasDate = b.scheduled_at ? 0 : 1
      if (aHasDate !== bHasDate) return bHasDate - aHasDate
    }

    const dateA = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Infinity
    const dateB = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Infinity
    return dateA - dateB || a.created_at.localeCompare(b.created_at)
  })

  return (
    <div className="space-y-3">
      {sorted.map((m) => {
        const phaseLabel =
          m.phase === 'group'
            ? `Grupo ${groupMap.get(m.group_id || '')?.name || ''}`
            : m.phase === 'round_of_16'
              ? 'Octavos'
              : m.phase === 'quarter'
                ? 'Cuartos'
                : m.phase === 'semi'
                  ? 'Semifinal'
                  : m.phase === 'third_place'
                    ? '3er Puesto'
                    : m.phase === 'final'
                      ? 'Final'
                      : m.phase

        const phaseColor =
          m.phase === 'group'
            ? 'text-blue-400'
            : m.phase === 'final'
              ? 'text-amber-400'
              : m.phase === 'semi'
                ? 'text-purple-400'
                : m.phase === 'third_place'
                  ? 'text-gray-400'
                  : 'text-indigo-400'

        return (
          <div key={m.id} className="card-surface overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#0a1120]/50 border-b border-[#1e2d45]">
              <span
                className={`text-xs font-semibold uppercase tracking-wide ${phaseColor}`}
              >
                {phaseLabel}
              </span>
              {m.status === 'finished' && (
                <span className="text-xs text-emerald-400">Finalizado</span>
              )}
            </div>

            {/* Body */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 px-4 py-3">
              {/* Date */}
              <div className="flex items-center gap-2 md:min-w-[200px]">
                <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                <input
                  type="datetime-local"
                  defaultValue={
                    m.scheduled_at
                      ? new Date(m.scheduled_at).toISOString().slice(0, 16)
                      : ''
                  }
                  onBlur={(e) => saveSchedule(m.id, e.target.value)}
                  className="text-xs border border-[#1e2d45] bg-[#0a1120] rounded px-2 py-1.5 text-gray-300 w-full focus:outline-none focus:border-amber-400/50"
                />
              </div>

              {/* Matchup */}
              <div className="flex items-center justify-center gap-3 flex-1 min-w-0">
                <PlayerBadge
                  player={
                    m.home_player_id ? playerMap.get(m.home_player_id) : null
                  }
                  reverse
                />
                <span className="font-bold text-gray-500 shrink-0">vs</span>
                <PlayerBadge
                  player={
                    m.away_player_id ? playerMap.get(m.away_player_id) : null
                  }
                />
              </div>

              {/* Score + Action */}
              <div className="flex items-center gap-3 md:min-w-[180px] justify-end shrink-0">
                {m.status === 'finished' ? (
                  <span className="text-lg font-bold font-mono">
                    <span
                      className={
                        m.winner_player_id === m.home_player_id
                          ? 'text-emerald-400'
                          : 'text-gray-300'
                      }
                    >
                      {m.home_score}
                    </span>
                    <span className="text-gray-600 mx-1">–</span>
                    <span
                      className={
                        m.winner_player_id === m.away_player_id
                          ? 'text-emerald-400'
                          : 'text-gray-300'
                      }
                    >
                      {m.away_score}
                    </span>
                    {m.penalties_home != null && m.penalties_away != null && (
                      <span className="text-xs ml-1 text-amber-400/70 font-normal">
                        ({m.penalties_home}–{m.penalties_away})
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-sm text-gray-600 italic">
                    Pendiente
                  </span>
                )}
                <button
                  onClick={() => {
                    if (m.status === 'finished' && editingId !== m.id) {
                      if (
                        !confirm(
                          'Este partido ya está finalizado. ¿Reemplazar el resultado actual?'
                        )
                      )
                        return
                    }
                    setEditingId(editingId === m.id ? null : m.id)
                  }}
                  className={`text-sm font-medium rounded-lg px-3 py-1.5 transition ${
                    m.status === 'finished'
                      ? 'bg-amber-400/10 text-amber-400 hover:bg-amber-400/20'
                      : 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25'
                  }`}
                >
                  {m.status === 'finished' ? 'Editar' : 'Resultado'}
                </button>
              </div>
            </div>

            {/* Result form */}
            {editingId === m.id && (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  saveResult(m.id, new FormData(e.currentTarget))
                }}
                className="border-t border-[#1e2d45] bg-[#0a1120]/50 px-4 py-4"
              >
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Goles{' '}
                      {playerMap.get(m.home_player_id || '')?.country_code ||
                        'local'}
                    </label>
                    <input
                      name="home_score"
                      type="number"
                      min={0}
                      defaultValue={m.home_score ?? ''}
                      className="w-full border border-[#1e2d45] bg-[#0a1120] rounded px-2 py-1.5 text-gray-200 text-sm focus:outline-none focus:border-amber-400/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Goles{' '}
                      {playerMap.get(m.away_player_id || '')?.country_code ||
                        'visita'}
                    </label>
                    <input
                      name="away_score"
                      type="number"
                      min={0}
                      defaultValue={m.away_score ?? ''}
                      className="w-full border border-[#1e2d45] bg-[#0a1120] rounded px-2 py-1.5 text-gray-200 text-sm focus:outline-none focus:border-amber-400/50"
                      required
                    />
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer mb-4 select-none">
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="has_penalties"
                      className="sr-only peer"
                      defaultChecked={m.penalties_home != null}
                      onChange={(e) => {
                        const next = new Set(penaltyEnabled)
                        if (e.target.checked) next.add(m.id)
                        else next.delete(m.id)
                        setPenaltyEnabled(next)
                      }}
                    />
                    <div className="w-10 h-6 rounded-full bg-[#1e2d45] peer-checked:bg-amber-500/30 after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:w-5 after:h-5 after:rounded-full after:bg-gray-500 after:transition-all peer-checked:after:translate-x-4 peer-checked:after:bg-amber-400" />
                  </div>
                  <span className="text-sm text-gray-400 peer-checked:text-gray-200">
                    ¿Se definió por penales?
                  </span>
                </label>

                {(penaltyEnabled.has(m.id) || m.penalties_home != null) && (
                  <div className="grid grid-cols-2 gap-3 mb-4 p-3 rounded-lg border border-amber-400/20 bg-amber-400/5">
                    <div>
                      <label className="block text-xs font-medium text-amber-400/80 mb-1">
                        Penales{' '}
                        {playerMap.get(m.home_player_id || '')?.country_code ||
                          'local'}
                      </label>
                      <input
                        name="penalties_home"
                        type="number"
                        min={0}
                        defaultValue={m.penalties_home ?? ''}
                        className="w-full border border-[#1e2d45] bg-[#0a1120] rounded px-2 py-1.5 text-gray-200 text-sm focus:outline-none focus:border-amber-400/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-amber-400/80 mb-1">
                        Penales{' '}
                        {playerMap.get(m.away_player_id || '')?.country_code ||
                          'visita'}
                      </label>
                      <input
                        name="penalties_away"
                        type="number"
                        min={0}
                        defaultValue={m.penalties_away ?? ''}
                        className="w-full border border-[#1e2d45] bg-[#0a1120] rounded px-2 py-1.5 text-gray-200 text-sm focus:outline-none focus:border-amber-400/50"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-end gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:from-emerald-400 hover:to-emerald-500 transition"
                  >
                    Guardar resultado
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="px-3 py-2 text-sm text-gray-500 hover:text-gray-300 font-medium transition"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        )
      })}
    </div>
  )
}

function KnockoutManager({
  tournament,
  players,
  groups,
  matches,
  onChange
}: {
  tournament: Tournament
  players: Player[]
  groups: Group[]
  matches: Match[]
  onChange: () => Promise<void>
}) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    setError('')
    setLoading(true)
    try {
      await generateKnockoutStage(tournament.id, players, groups, matches)
      await onChange()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al generar eliminatoria')
    } finally {
      setLoading(false)
    }
  }

  const finishedGroupMatches = matches.filter(
    (m) => m.phase === 'group' && m.status === 'finished'
  ).length
  const totalGroupMatches = matches.filter((m) => m.phase === 'group').length

  return (
    <div className="card-surface p-6 max-w-xl mx-auto">
      <h3 className="font-bold text-gray-200 mb-4">
        Generar fase eliminatoria
      </h3>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-2 rounded-full bg-[#1e2d45] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all"
            style={{
              width: `${totalGroupMatches > 0 ? (finishedGroupMatches / totalGroupMatches) * 100 : 0}%`
            }}
          />
        </div>
        <span className="text-sm text-gray-500 shrink-0">
          {finishedGroupMatches}/{totalGroupMatches}
        </span>
      </div>
      <button
        onClick={handleGenerate}
        disabled={loading || finishedGroupMatches < totalGroupMatches}
        className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-black rounded-lg px-4 py-2.5 font-semibold hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 transition text-sm"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Generando...
          </>
        ) : (
          'Generar eliminatoria'
        )}
      </button>
      {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
      {finishedGroupMatches < totalGroupMatches && (
        <p className="text-amber-400/60 text-xs mt-2">
          Faltan {totalGroupMatches - finishedGroupMatches} partido(s) por jugar
          en grupos
        </p>
      )}
    </div>
  )
}
