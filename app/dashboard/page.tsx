'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Pet, AdoptionRequest, RequestStatus } from '@/lib/types'
import PetCard from '@/components/PetCard'

const statusLabels: Record<RequestStatus, { label: string; classes: string }> = {
  pending: { label: 'Pendiente', classes: 'bg-orange-50 text-[#C04828] border-orange-100' },
  approved: { label: 'Aprobada', classes: 'bg-[#EAF3DE] text-[#3B6D11] border-green-100' },
  declined: { label: 'Rechazada', classes: 'bg-gray-50 text-gray-500 border-gray-200' },
}

export default function Dashboard() {
  const router = useRouter()
  const [pets, setPets] = useState<Pet[]>([])
  const [requests, setRequests] = useState<AdoptionRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/login')
        return
      }

      const [petsRes, requestsRes] = await Promise.all([
        supabase
          .from('pets')
          .select(`
            *,
            pet_photos (*)
          `)
          .eq('created_by', session.user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('adoption_requests')
          .select('*, pets!inner(name, created_by)')
          .eq('pets.created_by', session.user.id)
          .order('created_at', { ascending: false }),
      ])

      if (petsRes.error) {
        console.error('Error fetching pets:', petsRes.error.message, petsRes.error.details ?? '')
      } else {
        setPets(petsRes.data || [])
      }

      if (requestsRes.error) {
        console.error('Error fetching requests:', requestsRes.error.message, requestsRes.error.details ?? '')
      } else {
        setRequests((requestsRes.data as AdoptionRequest[]) || [])
      }

      setLoading(false)
    }

    load()
  }, [router])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  async function updateRequestStatus(id: string, status: RequestStatus) {
    const { error } = await supabase
      .from('adoption_requests')
      .update({ status })
      .eq('id', id)

    if (error) {
      console.error('Error updating request:', error.message)
      return
    }

    setRequests(reqs => reqs.map(r => (r.id === id ? { ...r, status } : r)))
  }

  const pending = requests.filter(r => r.status === 'pending')

  return (
    <main className="px-4 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center py-4">
        <Link href="/" className="text-xl font-medium text-[#C04828]">patitas.</Link>
        <button onClick={handleSignOut} className="text-gray-400 text-sm">
          Cerrar sesión
        </button>
      </div>

      {/* Adoption requests */}
      <div className="mb-6">
        <div className="flex justify-between items-baseline mb-2">
          <h1 className="text-lg font-medium text-gray-900">Solicitudes de adopción</h1>
          {pending.length > 0 && (
            <span className="text-xs text-[#C04828] font-medium">
              {pending.length} pendiente{pending.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading ? (
          <div className="border border-gray-100 rounded-2xl p-4 animate-pulse space-y-2">
            <div className="h-3 bg-gray-100 rounded w-2/3" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        ) : requests.length === 0 ? (
          <p className="text-sm text-gray-400 border border-gray-100 rounded-2xl p-4">
            Cuando alguien quiera adoptar a una de tus mascotas, su solicitud aparecerá aquí.
          </p>
        ) : (
          <div className="space-y-3">
            {requests.map(req => {
              const status = statusLabels[req.status]
              const answers = req.survey_answers
              return (
                <div key={req.id} className="border border-gray-100 rounded-2xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {answers.adopter_name || 'Adoptante'} → {req.pets?.name}
                      </p>
                      <p className="text-xs text-gray-400">{answers.adopter_email}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full border ${status.classes}`}>
                      {status.label}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 leading-relaxed mb-3">
                    {answers.home_type === 'casa' ? 'Casa' : answers.home_type === 'departamento' ? 'Departamento' : 'Otro hogar'}
                    {answers.outdoor_space ? ' con espacio exterior' : ', sin espacio exterior'}
                    {' · '}
                    {answers.experience === 'con_experiencia' ? 'Ha tenido mascotas' : 'Primera mascota'}
                    {answers.other_pets ? ` · Otras mascotas: ${answers.other_pets}` : ' · Sin otras mascotas'}
                    {' · '}
                    {answers.city}, {answers.state}
                  </p>

                  {req.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateRequestStatus(req.id, 'approved')}
                        className="flex-1 bg-[#C04828] text-white rounded-xl py-2 text-xs font-medium"
                      >
                        Aprobar
                      </button>
                      <button
                        onClick={() => updateRequestStatus(req.id, 'declined')}
                        className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2 text-xs"
                      >
                        Rechazar
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* My pets */}
      <div className="flex justify-between items-baseline mb-4">
        <h2 className="text-lg font-medium text-gray-900">Mis mascotas</h2>
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
