'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Message } from '@/lib/types'

interface MessageThreadProps {
  adoptionRequestId: string
  currentUserId: string
}

export default function MessageThread({ adoptionRequestId, currentUserId }: MessageThreadProps) {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      // Find or lazily create the conversation for this request.
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('adoption_request_id', adoptionRequestId)
        .maybeSingle()

      let id = existing?.id ?? null

      if (!id) {
        const { data: created, error } = await supabase
          .from('conversations')
          .insert({ adoption_request_id: adoptionRequestId })
          .select('id')
          .single()

        if (error) {
          // Unique violation means the other participant just created it —
          // fetch instead of failing.
          if (error.code === '23505') {
            const { data: retry } = await supabase
              .from('conversations')
              .select('id')
              .eq('adoption_request_id', adoptionRequestId)
              .maybeSingle()
            id = retry?.id ?? null
          } else {
            console.error('Error creating conversation:', error.message)
            setLoading(false)
            return
          }
        } else {
          id = created.id
        }
      }

      setConversationId(id)

      const { data: msgs, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true })

      if (msgError) {
        console.error('Error loading messages:', msgError.message)
      } else {
        setMessages(msgs || [])
      }

      setLoading(false)
    }

    load()
  }, [adoptionRequestId])

  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        payload => {
          setMessages(msgs => {
            if (msgs.some(m => m.id === payload.new.id)) return msgs
            return [...msgs, payload.new as Message]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!conversationId || !body.trim()) return
    setSending(true)

    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: currentUserId, body: body.trim() })
      .select()
      .single()

    if (error) {
      console.error('Error sending message:', error.message)
    } else {
      // Don't wait on the realtime echo — append immediately. The realtime
      // handler already dedupes by id if this arrives again from the socket.
      setMessages(msgs => (msgs.some(m => m.id === data.id) ? msgs : [...msgs, data as Message]))
      setBody('')
    }

    setSending(false)
  }

  if (loading) {
    return <p className="text-xs text-gray-400 py-2">Cargando mensajes…</p>
  }

  return (
    <div className="border-t border-gray-100 mt-3 pt-3">
      <div className="max-h-48 overflow-y-auto space-y-2 mb-2">
        {messages.length === 0 ? (
          <p className="text-xs text-gray-400">Aún no hay mensajes. Escribe el primero.</p>
        ) : (
          messages.map(msg => {
            const isMine = msg.sender_id === currentUserId
            const isSystem = !msg.sender_id
            return (
              <div
                key={msg.id}
                className={`text-xs rounded-xl px-3 py-2 max-w-[85%] ${
                  isSystem
                    ? 'bg-gray-50 text-gray-500 mx-auto text-center'
                    : isMine
                      ? 'bg-[#C04828] text-white ml-auto'
                      : 'bg-gray-100 text-gray-700'
                }`}
              >
                {msg.body}
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Escribe un mensaje…"
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#C04828]"
        />
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className="bg-[#C04828] text-white rounded-xl px-3 py-2 text-xs font-medium disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  )
}
