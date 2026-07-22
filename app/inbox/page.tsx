'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import MessageThread from '@/components/MessageThread'

interface InboxRow {
  requestId: string
  petId: string
  petName: string
  otherPartyName: string
  lastMessage: string | null
  lastMessageAt: string | null
  requestCreatedAt: string
}

export default function Inbox() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [rows, setRows] = useState<InboxRow[]>([])
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

      const [asAdopter, asVolunteer] = await Promise.all([
        supabase
          .from('adoption_requests')
          .select('id, pet_id, created_at, survey_answers, pets(name, created_by)')
          .eq('adopter_id', session.user.id),
        supabase
          .from('adoption_requests')
          .select('id, pet_id, created_at, survey_answers, pets!inner(name, created_by)')
          .eq('pets.created_by', session.user.id),
      ])

      const requestsById = new Map<string, {
        id: string
        pet_id: string
        created_at: string
        otherPartyName: string
        petName: string
      }>()

      for (const req of asAdopter.data || []) {
        requestsById.set(req.id, {
          id: req.id,
          pet_id: req.pet_id,
          created_at: req.created_at,
          petName: (req.pets as unknown as { name: string } | null)?.name ?? 'Mascota',
          otherPartyName: 'Voluntario',
        })
      }

      for (const req of asVolunteer.data || []) {
        requestsById.set(req.id, {
          id: req.id,
          pet_id: req.pet_id,
          created_at: req.created_at,
          petName: (req.pets as unknown as { name: string } | null)?.name ?? 'Mascota',
          otherPartyName: (req.survey_answers as { adopter_name?: string })?.adopter_name || 'Adoptante',
        })
      }

      const requestIds = [...requestsById.keys()]

      const { data: conversations } = requestIds.length
        ? await supabase
            .from('conversations')
            .select('id, adoption_request_id, messages(body, created_at)')
            .in('adoption_request_id', requestIds)
        : { data: [] }

      const lastMessageByRequest = new Map<string, { body: string; created_at: string }>()
      for (const conv of conversations || []) {
        const msgs = (conv.messages as { body: string; created_at: string }[]) || []
        const last = msgs.sort((a, b) => a.created_at.localeCompare(b.created_at)).at(-1)
        if (last) lastMessageByRequest.set(conv.adoption_request_id, last)
      }

      const built: InboxRow[] = [...requestsById.values()].map(req => {
        const last = lastMessageByRequest.get(req.id)
        return {
          requestId: req.id,
          petId: req.pet_id,
          petName: req.petName,
          otherPartyName: req.otherPartyName,
          lastMessage: last?.body ?? null,
          lastMessageAt: last?.created_at ?? null,
          requestCreatedAt: req.created_at,
        }
      })

      built.sort((a, b) => {
        const aTime = a.lastMessageAt ?? a.requestCreatedAt
        const bTime = b.lastMessageAt ?? b.requestCreatedAt
        return bTime.localeCompare(aTime)
      })

      setRows(built)
      setLoading(false)
    }

    load()
  }, [router])

  return (
    <main className="px-4 pb-24">
      <div className="flex justify-between items-center py-4">
        <Link href="/" className="text-xl font-medium text-[#C04828]">patitas.</Link>
        <span className="text-gray-400 text-sm">Inbox</span>
      </div>

      <h1 className="text-lg font-medium text-gray-900 mb-4">Mensajes</h1>

      {loading ? (
        <div className="border border-gray-100 rounded-2xl p-4 animate-pulse space-y-2">
          <div className="h-3 bg-gray-100 rounded w-2/3" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">💬</p>
          <p className="text-sm">Todavía no tienes conversaciones.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(row => (
            <div key={row.requestId} className="border border-gray-100 rounded-2xl p-4">
              <button
                onClick={() => setOpenThread(openThread === row.requestId ? null : row.requestId)}
                className="w-full text-left"
              >
                <div className="flex justify-between items-baseline">
                  <p className="text-sm font-medium text-gray-900">
                    {row.otherPartyName} · {row.petName}
                  </p>
                  {row.lastMessageAt && (
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {new Date(row.lastMessageAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {row.lastMessage ?? 'Sin mensajes aún — toca para escribir'}
                </p>
              </button>

              {openThread === row.requestId && userId && (
                <MessageThread adoptionRequestId={row.requestId} currentUserId={userId} />
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
