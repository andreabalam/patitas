'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'patitas_favorites'

function getFavorites(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

interface FavoriteButtonProps {
  petId: string
  className?: string
}

export default function FavoriteButton({ petId, className }: FavoriteButtonProps) {
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSaved(getFavorites().includes(petId))
  }, [petId])

  function toggle(e: React.MouseEvent) {
    // The card version lives inside a <Link> — don't navigate
    e.preventDefault()
    e.stopPropagation()

    const favorites = getFavorites()
    const next = favorites.includes(petId)
      ? favorites.filter(id => id !== petId)
      : [...favorites, petId]

    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setSaved(next.includes(petId))
  }

  return (
    <button
      onClick={toggle}
      aria-label={saved ? 'Quitar de guardados' : 'Guardar'}
      className={className ?? 'text-base'}
    >
      <span className={saved ? 'text-[#C04828]' : 'text-gray-300'}>
        {saved ? '♥' : '♡'}
      </span>
    </button>
  )
}
