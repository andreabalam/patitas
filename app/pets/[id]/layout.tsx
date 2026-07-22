import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params

  // Anon fetch, active-only: a share link is only ever meaningful for an
  // active listing, so an inactive/nonexistent pet just falls back to the
  // site defaults from the root layout instead of a broken preview.
  const { data: pet } = await supabase
    .from('pets')
    .select('name, description, city')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (!pet) {
    return {}
  }

  const title = `${pet.name} — Adopta en ${pet.city} | Patitas`
  const description = pet.description || `Conoce a ${pet.name} y dale un hogar. Adopta con Patitas.`

  // The sibling opengraph-image.tsx file is picked up automatically by
  // Next and merged into the head tags — no need to reference it here.
  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default function PetLayout({ children }: { children: React.ReactNode }) {
  return children
}
