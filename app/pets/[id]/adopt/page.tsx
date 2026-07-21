'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function AdoptPet({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: petId } = use(params)

  const [petName, setPetName] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)

  // account step (shown only when signed out)
  const [accountMode, setAccountMode] = useState<'signup' | 'login'>('signup')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // survey step
  const [homeType, setHomeType] = useState<'casa' | 'departamento' | 'otro'>('casa')
  const [outdoorSpace, setOutdoorSpace] = useState(false)
  const [otherPets, setOtherPets] = useState('')
  const [experience, setExperience] = useState<'primera_vez' | 'con_experiencia'>('primera_vez')
  const [city, setCity] = useState('')
  const [stateName, setStateName] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: { session } }, { data: pet }] = await Promise.all([
        supabase.auth.getSession(),
        supabase
          .from('pets')
          .select('name')
          .eq('id', petId)
          .eq('is_active', true)
          .single(),
      ])

      setPetName(pet?.name ?? null)
      if (session) {
        setUser(session.user)
        setFullName(session.user.user_metadata?.full_name ?? '')
        setEmail(session.user.email ?? '')
      }
      setCheckingSession(false)
    }

    load()
  }, [petId])

  async function handleAccount(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setSubmitting(true)

    if (accountMode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role: 'adopter' },
        },
      })

      if (error) {
        setError(error.message)
      } else if (!data.session) {
        setNotice('Revisa tu correo para confirmar tu cuenta y vuelve a esta página.')
      } else {
        setUser(data.session.user)
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setError(error.message)
      } else if (data.session) {
        setUser(data.session.user)
        setFullName(data.session.user.user_metadata?.full_name ?? fullName)
      }
    }

    setSubmitting(false)
  }

  async function handleSurvey(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setError(null)
    setSubmitting(true)

    const { error: insertError } = await supabase.from('adoption_requests').insert({
      pet_id: petId,
      adopter_id: user.id,
      survey_answers: {
        adopter_name: fullName || user.user_metadata?.full_name || '',
        adopter_email: user.email ?? '',
        home_type: homeType,
        outdoor_space: outdoorSpace,
        other_pets: otherPets,
        experience,
        city,
        state: stateName,
      },
    })

    if (insertError) {
      if (insertError.code === '23505') {
        setError(`Ya enviaste una solicitud por ${petName}. El voluntario la está revisando.`)
      } else {
        setError(insertError.message)
      }
      setSubmitting(false)
      return
    }

    setDone(true)
    setSubmitting(false)
  }

  const inputClass =
    'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C04828]'

  if (checkingSession) {
    return (
      <main className="px-4 py-16 text-center text-gray-400 text-sm">
        Cargando…
      </main>
    )
  }

  if (petName === null) {
    return (
      <main className="px-4 py-16 text-center text-gray-400">
        <p className="text-4xl mb-3">🐾</p>
        <p className="text-sm mb-4">Esta mascota ya no está disponible.</p>
        <Link href="/" className="text-sm text-[#C04828] underline">Ver otras mascotas</Link>
      </main>
    )
  }

  if (done) {
    return (
      <main className="px-4 py-16 text-center">
        <p className="text-4xl mb-3">🎉</p>
        <h1 className="text-xl font-medium text-gray-900 mb-2">¡Solicitud enviada!</h1>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          El voluntario a cargo de {petName} revisará tus respuestas y te
          contactará por correo electrónico.
        </p>
        <Link
          href={`/pets/${petId}`}
          className="inline-block bg-[#C04828] text-white rounded-xl px-6 py-3 text-sm font-medium"
        >
          Volver a {petName}
        </Link>
      </main>
    )
  }

  return (
    <main className="px-4 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center py-4">
        <Link href={`/pets/${petId}`} className="text-gray-500 text-sm">← Volver</Link>
        <span className="text-xl font-medium text-[#C04828]">patitas.</span>
      </div>

      <h1 className="text-2xl font-medium text-gray-900 mb-1">Adoptar a {petName}</h1>

      {!user ? (
        <>
          <p className="text-sm text-gray-500 mb-6">
            {accountMode === 'signup'
              ? 'Crea tu cuenta para enviar la solicitud de adopción.'
              : 'Inicia sesión para enviar la solicitud de adopción.'}
          </p>

          <form onSubmit={handleAccount} className="space-y-3">
            {accountMode === 'signup' && (
              <input
                type="text"
                required
                placeholder="Nombre completo"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className={inputClass}
              />
            )}
            <input
              type="email"
              required
              placeholder="Correo electrónico"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={inputClass}
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={inputClass}
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
              {submitting ? 'Un momento…' : 'Continuar'}
            </button>
          </form>

          <button
            onClick={() => {
              setAccountMode(accountMode === 'signup' ? 'login' : 'signup')
              setError(null)
              setNotice(null)
            }}
            className="w-full text-center text-sm text-gray-500 mt-4"
          >
            {accountMode === 'signup'
              ? '¿Ya tienes cuenta? Inicia sesión'
              : '¿No tienes cuenta? Regístrate'}
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-6">
            Cuéntanos un poco sobre tu hogar. El voluntario usará tus respuestas
            para conocer mejor el lugar donde viviría {petName}.
          </p>

          <form onSubmit={handleSurvey} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">¿En qué tipo de hogar vives?</label>
              <select
                value={homeType}
                onChange={e => setHomeType(e.target.value as typeof homeType)}
                className={inputClass}
              >
                <option value="casa">Casa</option>
                <option value="departamento">Departamento</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={outdoorSpace}
                onChange={e => setOutdoorSpace(e.target.checked)}
                className="accent-[#C04828]"
              />
              Tengo patio, jardín o espacio exterior
            </label>

            <div>
              <label className="block text-sm text-gray-700 mb-1">¿Tienes otras mascotas?</label>
              <input
                type="text"
                placeholder="Ej. un perro mediano, dos gatos, ninguna…"
                value={otherPets}
                onChange={e => setOtherPets(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">¿Has tenido mascotas antes?</label>
              <select
                value={experience}
                onChange={e => setExperience(e.target.value as typeof experience)}
                className={inputClass}
              >
                <option value="primera_vez">Sería mi primera mascota</option>
                <option value="con_experiencia">He tenido mascotas antes</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="Ciudad *"
                value={city}
                onChange={e => setCity(e.target.value)}
                className={inputClass}
              />
              <input
                type="text"
                required
                placeholder="Estado *"
                value={stateName}
                onChange={e => setStateName(e.target.value)}
                className={inputClass}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#C04828] text-white rounded-xl py-3.5 text-sm font-medium disabled:opacity-50"
            >
              {submitting ? 'Enviando…' : 'Enviar solicitud'}
            </button>
          </form>
        </>
      )}
    </main>
  )
}
