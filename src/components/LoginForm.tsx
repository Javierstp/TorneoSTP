import { useState } from 'react'
import { signIn } from '../lib/data'
import { Shield, Loader2 } from 'lucide-react'

interface Props {
  onSuccess: () => void
}

export function LoginForm({ onSuccess }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      setError('Correo o contraseña incorrectos')
    } else {
      onSuccess()
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="card-surface p-8">
        <div className="w-12 h-12 mx-auto rounded-full bg-amber-400/10 flex items-center justify-center mb-5">
          <Shield className="w-6 h-6 text-amber-400" />
        </div>
        <h2 className="text-lg font-bold text-gray-100 text-center mb-6">
          Acceso de administrador
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Correo
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[#1e2d45] bg-[#0a1120] px-3 py-2.5 text-gray-200 text-sm placeholder:text-gray-600 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 transition"
              placeholder="admin@fifa.local"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[#1e2d45] bg-[#0a1120] px-3 py-2.5 text-gray-200 text-sm placeholder:text-gray-600 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 transition"
              placeholder="••••••••"
              required
            />
          </div>
          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-black rounded-lg px-4 py-2.5 font-semibold hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
