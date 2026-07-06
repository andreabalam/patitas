'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setSubmitting(true)

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role: 'volunteer' },
        },
      })

      if (error) {
        setError(error.message)
      } else if (!data.session) {
        setNotice('Revisa tu correo para confirmar tu cuenta.')
      } else {
        await supabase
          .from('profiles')
          .update({ full_name: fullName, role: 'volunteer' })
          .eq('id', data.session.user.id)
        router.push('/dashboard')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard')
      }
    }

    setSubmitting(false)
  }

  return (
    <main className="px-4 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center py-4">
        <Link href="/" className="text-xl font-medium text-[#C04828]">patitas.</Link>
        <Link href="/" className="text-gray-400 text-sm">← Volver</Link>
      </div>

      <div className="pt-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-1">
          {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {mode === 'login'
            ? 'Entra para gestionar tus mascotas en adopción.'
            : 'Regístrate como voluntario para publicar mascotas.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <input
              type="text"
              required
              placeholder="Nombre completo"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C04828]"
            />
          )}
          <input
            type="email"
            required
            placeholder="Correo electrónico"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C04828]"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C04828]"
          />

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
          )}
          {notice && (
            <p className="text-sm text-[#3B6D11] bg-[#EAF3DE] border border-green-100 rounded-xl px-3 py-2">{notice}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#C04828] text-white rounded-xl py-3.5 text-sm font-medium disabled:opacity-50"
          >
            {submitting
              ? 'Un momento…'
              : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login')
            setError(null)
            setNotice(null)
          }}
          className="w-full text-center text-sm text-gray-500 mt-4"
        >
          {mode === 'login'
            ? '¿No tienes cuenta? Regístrate como voluntario'
            : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </div>
    </main>
  )
}
