'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Pet, AdoptionRequest, RequestStatus } from '@/lib/types'
import { statusLabels } from '@/lib/labels'
import PetCard from '@/components/PetCard'
import MessageThread from '@/components/MessageThread'

const URGENT_SUGGESTION_THRESHOLD_DAYS = 30

export default function Dashboard() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [pets, setPets] = useState<Pet[]>([])
  const [requests, setRequests] = useState<AdoptionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [openThread, setOpenThread] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/login')
        return
      }
      setUserId(session.user.id)

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
          .select('*, pets!inner(name, created_by, is_active)')
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

  async function markAsAdopted(req: AdoptionRequest) {
    const { error: petError } = await supabase
      .from('pets')
      .update({ is_active: false })
      .eq('id', req.pet_id)

    if (petError) {
      console.error('Error marking pet as adopted:', petError.message)
      return
    }

    const { data: otherPending, error: findError } = await supabase
      .from('adoption_requests')
      .select('id')
      .eq('pet_id', req.pet_id)
      .eq('status', 'pending')
      .neq('id', req.id)

    if (findError) {
      console.error('Error finding other pending requests:', findError.message)
    }

    const declinedIds = (otherPending || []).map(r => r.id)

    if (declinedIds.length > 0) {
      const { error: declineError } = await supabase
        .from('adoption_requests')
        .update({ status: 'declined' })
        .in('id', declinedIds)

      if (declineError) {
        console.error('Error declining other requests:', declineError.message)
      }

      for (const declinedId of declinedIds) {
        const { data: existingConv } = await supabase
          .from('conversations')
          .select('id')
          .eq('adoption_request_id', declinedId)
          .maybeSingle()

        let convId = existingConv?.id ?? null

        if (!convId) {
          const { data: created } = await supabase
            .from('conversations')
            .insert({ adoption_request_id: declinedId })
            .select('id')
            .single()
          convId = created?.id ?? null
        }

        if (convId) {
          await supabase
            .from('messages')
            .insert({
              conversation_id: convId,
              sender_id: null,
              body: 'Esta mascota ya fue adoptada por otra familia. ¡Gracias por tu interés!',
            })
        }
      }
    }

    setPets(ps => ps.map(p => (p.id === req.pet_id ? { ...p, is_active: false } : p)))
    setRequests(reqs =>
      reqs.map(r => {
        if (r.id === req.id) return { ...r, status: 'approved', pets: r.pets ? { ...r.pets, is_active: false } : r.pets }
        if (declinedIds.includes(r.id)) return { ...r, status: 'declined' }
        return r
      })
    )
  }

  async function suggestUrgent(petId: string) {
    const { error } = await supabase
      .from('pets')
      .update({ is_urgent: true })
      .eq('id', petId)

    if (error) {
      console.error('Error marking pet as urgent:', error.message)
      return
    }

    setPets(ps => ps.map(p => (p.id === petId ? { ...p, is_urgent: true } : p)))
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
                    <div className="flex gap-2 mb-2">
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

                  {req.status === 'approved' && req.pets?.is_active !== false && (
                    <button
                      onClick={() => markAsAdopted(req)}
                      className="w-full bg-[#3B6D11] text-white rounded-xl py-2 text-xs font-medium mb-2"
                    >
                      Marcar como adoptado
                    </button>
                  )}

                  {req.status === 'approved' && req.pets?.is_active === false && (
                    <p className="text-xs text-[#3B6D11] mb-2">✓ Mascota adoptada</p>
                  )}

                  <button
                    onClick={() => setOpenThread(openThread === req.id ? null : req.id)}
                    className="text-xs text-[#C04828] underline"
                  >
                    {openThread === req.id ? 'Ocultar mensajes' : 'Ver mensajes'}
                  </button>

                  {openThread === req.id && userId && (
                    <MessageThread adoptionRequestId={req.id} currentUserId={userId} />
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
        <span className="text-xs text-gray-400">{pets.filter(p => p.is_active).length} de 10 activas</span>
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
            <div key={pet.id} className={!pet.is_active ? 'opacity-60' : undefined}>
              <PetCard pet={pet} />
              {!pet.is_active && (
                <p className="text-xs text-[#3B6D11] text-center mt-1">✓ Adoptada</p>
              )}
              {pet.is_active && (
                <Link
                  href={`/pets/${pet.id}/share`}
                  className="block text-center text-xs text-[#C04828] underline mt-1.5"
                >
                  Compartir
                </Link>
              )}
              {pet.is_active && !pet.is_urgent && pet.days_in_shelter >= URGENT_SUGGESTION_THRESHOLD_DAYS && (
                <div className="mt-1.5 bg-orange-50 border border-orange-100 rounded-xl p-2">
                  <p className="text-xs text-[#712B13] mb-1">
                    Lleva {pet.days_in_shelter} días — ¿marcar como urgente?
                  </p>
                  <button
                    onClick={() => suggestUrgent(pet.id)}
                    className="w-full bg-[#C04828] text-white rounded-lg py-1.5 text-xs font-medium"
                  >
                    Marcar urgente
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
