'use client'

import { use, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Pet, PetPhoto } from '@/lib/types'
import Link from 'next/link'
import FavoriteButton from '@/components/FavoriteButton'

export default function PetDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [pet, setPet] = useState<Pet | null | undefined>(undefined)

  useEffect(() => {
    async function load() {
      // No is_active filter here: RLS already returns active pets to
      // anyone, and inactive ones only to their own volunteer (so an
      // owner can still open their adopted listing; anyone else gets
      // an empty result, same as if it never existed).
      const { data } = await supabase
        .from('pets')
        .select(`
          *,
          pet_photos (*),
          profiles (full_name, phone)
        `)
        .eq('id', id)
        .single()

      setPet(data ?? null)
    }

    load()
  }, [id])

  if (pet === undefined) {
    return (
      <main className="px-4 py-16 text-center text-gray-400 text-sm">
        Cargando…
      </main>
    )
  }

  if (pet === null) {
    return (
      <main className="px-4 py-16 text-center text-gray-400">
        <p className="text-4xl mb-3">🐾</p>
        <p className="text-sm mb-4">Esta mascota ya no está disponible.</p>
        <Link href="/" className="text-sm text-[#C04828] underline">Ver otras mascotas</Link>
      </main>
    )
  }

  const primaryPhoto = pet.pet_photos?.find((p: PetPhoto) => p.is_primary)
  const emoji = pet.species === 'dog' ? '🐕' : pet.species === 'cat' ? '🐈' : '🐾'

  const speciesLabel = pet.species === 'dog' ? 'Perro' : pet.species === 'cat' ? 'Gato' : 'Otro'
  const sexLabel = pet.sex === 'male' ? 'Macho' : pet.sex === 'female' ? 'Hembra' : null
  const sizeLabel = pet.size === 'small' ? 'Pequeño' : pet.size === 'medium' ? 'Mediano' : pet.size === 'large' ? 'Grande' : null

  async function handleShareLink() {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: pet!.name, text: `Conoce a ${pet!.name} en Patitas`, url })
      } catch {
        // user cancelled the native share sheet — nothing to do
      }
    } else {
      await navigator.clipboard.writeText(url)
    }
  }

  return (
    <main className="pb-32">
      {/* Back button */}
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/" className="text-gray-500 text-sm flex items-center gap-1">
          ← Volver
        </Link>
        <div className="flex items-center gap-3">
          <button onClick={handleShareLink} aria-label="Compartir link" className="text-gray-400 text-xl">
            ↗
          </button>
          <FavoriteButton petId={pet.id} className="text-xl" />
        </div>
      </div>

      {/* Photo */}
      <div className="w-full h-56 bg-amber-50 flex items-center justify-center relative">
        {primaryPhoto ? (
          <img
            src={primaryPhoto.url}
            alt={pet.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-8xl">{emoji}</span>
        )}
        {pet.is_urgent && (
          <div className="absolute top-3 left-3 bg-[#C04828] text-white text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
            ⏱ Urgente
          </div>
        )}
      </div>

      <div className="px-4 pt-4">
        {/* Name and days */}
        <div className="flex justify-between items-start mb-1">
          <h1 className="text-2xl font-medium text-gray-900">{pet.name}</h1>
          <div className="bg-orange-50 border border-orange-100 rounded-xl px-3 py-1.5 text-center">
            <span className="text-lg font-medium text-[#C04828] block">{pet.days_in_shelter}</span>
            <span className="text-xs text-orange-700">días esperando</span>
          </div>
        </div>

        {/* Meta */}
        <p className="text-sm text-gray-500 mb-4">
          {[speciesLabel, sexLabel, pet.age_years ? `${pet.age_years} año${pet.age_years !== 1 ? 's' : ''}` : null, sizeLabel, pet.city]
            .filter(Boolean)
            .join(' · ')}
        </p>

        <Link
          href={`/pets/${pet.id}/share`}
          className="inline-block text-sm text-[#C04828] underline mb-4"
        >
          Compartir tarjeta para redes sociales
        </Link>

        {/* Description */}
        {pet.description && (
          <div className="mb-4">
            <h2 className="text-sm font-medium text-gray-900 mb-1">Sobre {pet.name}</h2>
            <p className="text-sm text-gray-500 leading-relaxed">{pet.description}</p>
          </div>
        )}

        {/* Video link */}
        {pet.video_url && (
          <div className="mb-4">
            <h2 className="text-sm font-medium text-gray-900 mb-1">Video</h2>
            <a
              href={pet.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#C04828] underline"
            >
              Ver video de {pet.name} ↗
            </a>
          </div>
        )}

        {/* Volunteer */}
        {pet.profiles && (
          <div className="flex items-center gap-3 py-3 border-t border-b border-gray-100 mb-4">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-sm font-medium text-[#C04828]">
              {pet.profiles.full_name?.charAt(0) ?? '?'}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{pet.profiles.full_name}</p>
              <p className="text-xs text-gray-400">Voluntario verificado</p>
            </div>
          </div>
        )}
      </div>

      {/* CTA — fixed at bottom */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pb-6 pt-3 bg-white border-t border-gray-100">
        {pet.is_active ? (
          <>
            <Link
              href={`/pets/${pet.id}/adopt`}
              className="block w-full bg-[#C04828] text-white rounded-xl py-3.5 text-sm font-medium mb-2 text-center"
            >
              Quiero adoptar a {pet.name}
            </Link>
            <button className="w-full border border-gray-200 text-gray-700 rounded-xl py-3.5 text-sm">
              Hacer una pregunta
            </button>
          </>
        ) : (
          <p className="text-center text-sm text-[#3B6D11] bg-[#EAF3DE] border border-green-100 rounded-xl py-3">
            ✓ {pet.name} ya fue adoptado
          </p>
        )}
      </div>
    </main>
  )
}
