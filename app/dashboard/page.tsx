'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Pet } from '@/lib/types'
import PetCard from '@/components/PetCard'

export default function Dashboard() {
  const router = useRouter()
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/login')
        return
      }

      const { data, error } = await supabase
        .from('pets')
        .select(`
          *,
          pet_photos (*)
        `)
        .eq('created_by', session.user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching pets:', error.message, error.details ?? '')
      } else {
        setPets(data || [])
      }

      setLoading(false)
    }

    load()
  }, [router])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <main className="px-4 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center py-4">
        <Link href="/" className="text-xl font-medium text-[#C04828]">patitas.</Link>
        <button onClick={handleSignOut} className="text-gray-400 text-sm">
          Cerrar sesión
        </button>
      </div>

      <div className="flex justify-between items-baseline mb-4">
        <h1 className="text-lg font-medium text-gray-900">Mis mascotas</h1>
        <span className="text-xs text-gray-400">{pets.length} de 10 activas</span>
      </div>

      <Link
        href="/dashboard/new"
        className="block w-full bg-[#C04828] text-white rounded-xl py-3.5 text-sm font-medium text-center mb-5"
      >
        + Publicar una mascota
      </Link>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(2)].map((_, i) => (
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
          <p className="text-sm">Aún no has publicado ninguna mascota.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {pets.map(pet => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </div>
      )}
    </main>
  )
}
