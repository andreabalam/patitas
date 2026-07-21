'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Pet, FilterState } from '@/lib/types'
import PetCard from '@/components/PetCard'
import FilterBar from '@/components/FilterBar'

export default function Home() {
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [signedIn, setSignedIn] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    species: 'all',
    state: 'all',
    size: 'all',
    urgent_only: false,
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSignedIn(!!session)
    })
  }, [])

  useEffect(() => {
    async function fetchPets() {
      setLoading(true)

      let query = supabase
        .from('pets')
        .select(`
          *,
          pet_photos (*)
        `)
        .eq('is_active', true)
        .order('is_urgent', { ascending: false })
        .order('days_in_shelter', { ascending: false })

      if (filters.species !== 'all') {
        query = query.eq('species', filters.species)
      }

      if (filters.state !== 'all') {
        query = query.eq('state', filters.state)
      }

      if (filters.size !== 'all') {
        query = query.eq('size', filters.size)
      }

      if (filters.urgent_only) {
        query = query.eq('is_urgent', true)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching pets:', error.message, error.details ?? '')
      } else {
        setPets(data || [])
      }

      setLoading(false)
    }

    fetchPets()
  }, [filters])

  return (
    <main className="px-4 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center py-4">
        <h1 className="text-xl font-medium text-[#C04828]">patitas.</h1>
        {signedIn ? (
          <div className="flex gap-3 text-xs text-gray-400">
            <Link href="/my-requests">Mis solicitudes</Link>
            <Link href="/dashboard">Mi panel</Link>
          </div>
        ) : (
          <Link href="/login" className="text-gray-400 text-sm">
            Iniciar sesión
          </Link>
        )}
      </div>

      {/* Search (placeholder for now) */}
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 mb-3">
        <span className="text-gray-400 text-sm">🔍</span>
        <span className="text-gray-400 text-sm">Buscar por ciudad, raza…</span>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      {/* Pet grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
              <div className="w-full h-36 bg-gray-100" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-2/3" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : pets.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🐾</p>
          <p className="text-sm">No hay mascotas con estos filtros.</p>
        </div>
      ) : (
        <>
          {/* Urgent section */}
          {pets.some(p => p.is_urgent) && (
            <div className="mb-5">
              <div className="flex justify-between items-baseline mb-2">
                <h2 className="text-sm font-medium text-gray-900">Necesitan hogar urgente</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {pets.filter(p => p.is_urgent).map(pet => (
                  <PetCard key={pet.id} pet={pet} />
                ))}
              </div>
            </div>
          )}

          {/* All pets section */}
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <h2 className="text-sm font-medium text-gray-900">
                {filters.urgent_only ? 'Urgentes' : 'Todos'}
              </h2>
              <span className="text-xs text-gray-400">{pets.length} mascotas</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {pets.filter(p => !p.is_urgent).map(pet => (
                <PetCard key={pet.id} pet={pet} />
              ))}
            </div>
          </div>
        </>
      )}
    </main>
  )
}
