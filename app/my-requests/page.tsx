'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { AdoptionRequest } from '@/lib/types'
import { statusLabels } from '@/lib/labels'
import MessageThread from '@/components/MessageThread'

export default function MyRequests() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
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

      const { data, error } = await supabase
        .from('adoption_requests')
        .select('*, pets (id, name, is_active, pet_photos (*))')
        .eq('adopter_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching my requests:', error.message, error.details ?? '')
      } else {
        setRequests((data as AdoptionRequest[]) || [])
      }

      setLoading(false)
    }

    load()
  }, [router])

  return (
    <main className="px-4 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center py-4">
        <Link href="/" className="text-xl font-medium text-[#C04828]">patitas.</Link>
        <span className="text-gray-400 text-sm">Mis solicitudes</span>
      </div>

      <h1 className="text-lg font-medium text-gray-900 mb-4">Mis solicitudes de adopción</h1>

      {loading ? (
        <div className="border border-gray-100 rounded-2xl p-4 animate-pulse space-y-2">
          <div className="h-3 bg-gray-100 rounded w-2/3" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🐾</p>
          <p className="text-sm">Aún no has enviado ninguna solicitud de adopción.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => {
            const status = statusLabels[req.status]
            const pet = req.pets

            return (
              <div key={req.id} className="border border-gray-100 rounded-2xl p-4">
                <div className="flex justify-between items-start mb-1">
                  <Link href={`/pets/${req.pet_id}`} className="text-sm font-medium text-gray-900">
                    {pet?.name ?? 'Mascota'}
                  </Link>
                  <span className={`text-xs px-2 py-1 rounded-full border ${status.classes}`}>
                    {status.label}
                  </span>
                </div>

                {pet && !pet.is_active && (
                  <p className="text-xs text-gray-400 mb-2">Esta publicación ya no está activa.</p>
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
    </main>
  )
}
