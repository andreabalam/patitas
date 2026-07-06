'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { MexicanState, Species, PetSex, PetSize } from '@/lib/types'
import { validatePhotoFiles } from '@/lib/upload'

export default function NewPet() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [states, setStates] = useState<MexicanState[]>([])

  const [name, setName] = useState('')
  const [species, setSpecies] = useState<Species>('dog')
  const [sex, setSex] = useState<PetSex | ''>('')
  const [ageYears, setAgeYears] = useState('')
  const [size, setSize] = useState<PetSize | ''>('')
  const [city, setCity] = useState('')
  const [stateName, setStateName] = useState('')
  const [description, setDescription] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/login')
        return
      }
      setUserId(session.user.id)

      const { data } = await supabase
        .from('mexican_states')
        .select('*')
        .order('name')
      setStates(data || [])
    }

    load()
  }, [router])

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const result = validatePhotoFiles(files)

    if (!result.valid) {
      setError(result.error)
      e.target.value = ''
      setPhotos([])
    } else {
      setError(null)
      setPhotos(files)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    setError(null)
    setSubmitting(true)

    const { data: pet, error: petError } = await supabase
      .from('pets')
      .insert({
        created_by: userId,
        name,
        species,
        sex: sex || null,
        age_years: ageYears ? Number(ageYears) : null,
        size: size || null,
        city,
        state: stateName,
        description: description || null,
        video_url: videoUrl || null,
        is_urgent: isUrgent,
        is_active: true,
      })
      .select()
      .single()

    if (petError || !pet) {
      setError(petError?.message ?? 'No se pudo crear la publicación.')
      setSubmitting(false)
      return
    }

    for (let i = 0; i < photos.length; i++) {
      const file = photos[i]
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${pet.id}/${Date.now()}-${i}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('pet-photos')
        .upload(path, file)

      if (uploadError) {
        setError(`La mascota se publicó, pero falló la foto ${i + 1}: ${uploadError.message}`)
        setSubmitting(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('pet-photos')
        .getPublicUrl(path)

      const { error: photoError } = await supabase
        .from('pet_photos')
        .insert({ pet_id: pet.id, url: publicUrl, is_primary: i === 0 })

      if (photoError) {
        setError(`La mascota se publicó, pero falló la foto ${i + 1}: ${photoError.message}`)
        setSubmitting(false)
        return
      }
    }

    router.push('/dashboard')
  }

  const inputClass =
    'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C04828]'

  return (
    <main className="px-4 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center py-4">
        <Link href="/dashboard" className="text-gray-500 text-sm">← Volver</Link>
        <span className="text-xl font-medium text-[#C04828]">patitas.</span>
      </div>

      <h1 className="text-2xl font-medium text-gray-900 mb-4">Publicar una mascota</h1>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          required
          placeholder="Nombre *"
          value={name}
          onChange={e => setName(e.target.value)}
          className={inputClass}
        />

        <div className="grid grid-cols-2 gap-3">
          <select value={species} onChange={e => setSpecies(e.target.value as Species)} className={inputClass}>
            <option value="dog">Perro</option>
            <option value="cat">Gato</option>
            <option value="other">Otro</option>
          </select>
          <select value={sex} onChange={e => setSex(e.target.value as PetSex | '')} className={inputClass}>
            <option value="">Sexo</option>
            <option value="male">Macho</option>
            <option value="female">Hembra</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            min="0"
            step="0.5"
            placeholder="Edad (años)"
            value={ageYears}
            onChange={e => setAgeYears(e.target.value)}
            className={inputClass}
          />
          <select value={size} onChange={e => setSize(e.target.value as PetSize | '')} className={inputClass}>
            <option value="">Tamaño</option>
            <option value="small">Pequeño</option>
            <option value="medium">Mediano</option>
            <option value="large">Grande</option>
          </select>
        </div>

        <input
          type="text"
          required
          placeholder="Ciudad *"
          value={city}
          onChange={e => setCity(e.target.value)}
          className={inputClass}
        />

        {states.length > 0 ? (
          <select required value={stateName} onChange={e => setStateName(e.target.value)} className={inputClass}>
            <option value="">Estado *</option>
            {states.map(s => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            required
            placeholder="Estado *"
            value={stateName}
            onChange={e => setStateName(e.target.value)}
            className={inputClass}
          />
        )}

        <textarea
          rows={4}
          placeholder="Descripción — historia, personalidad, salud…"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className={inputClass}
        />

        <input
          type="url"
          placeholder="Link de video (YouTube, TikTok, Reels)"
          value={videoUrl}
          onChange={e => setVideoUrl(e.target.value)}
          className={inputClass}
        />

        <label className="flex items-center gap-2 text-sm text-gray-700 py-1">
          <input
            type="checkbox"
            checked={isUrgent}
            onChange={e => setIsUrgent(e.target.checked)}
            className="accent-[#C04828]"
          />
          Necesita hogar urgente
        </label>

        <div>
          <label className="block text-sm text-gray-700 mb-1">
            Fotos (hasta 6, máx. 5MB cada una)
          </label>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/heic"
            onChange={handlePhotoChange}
            className="w-full text-sm text-gray-500 file:mr-3 file:rounded-xl file:border-0 file:bg-orange-50 file:px-4 file:py-2 file:text-sm file:text-[#C04828]"
          />
          {photos.length > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {photos.length} foto{photos.length !== 1 ? 's' : ''} — la primera será la principal
            </p>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#C04828] text-white rounded-xl py-3.5 text-sm font-medium disabled:opacity-50"
        >
          {submitting ? 'Publicando…' : 'Publicar'}
        </button>
      </form>
    </main>
  )
}
