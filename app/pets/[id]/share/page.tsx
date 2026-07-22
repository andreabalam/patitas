'use client'

import { use, useState } from 'react'
import Link from 'next/link'

type Template = 'warm' | 'dark' | 'nature'

const templates: { id: Template; label: string }[] = [
  { id: 'warm', label: 'Cálido' },
  { id: 'dark', label: 'Oscuro' },
  { id: 'nature', label: 'Natural' },
]

export default function SharePet({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [template, setTemplate] = useState<Template>('warm')
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const imageUrl = `/pets/${id}/card?template=${template}`
  const petUrl = typeof window !== 'undefined' ? `${window.location.origin}/pets/${id}` : ''

  async function handleDownload() {
    setError(null)
    setDownloading(true)
    try {
      const res = await fetch(imageUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `patitas-${id}-${template}.png`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('No se pudo descargar la imagen.')
    }
    setDownloading(false)
  }

  async function handleShare() {
    setError(null)
    try {
      const res = await fetch(imageUrl)
      const blob = await res.blob()
      const file = new File([blob], `patitas-${template}.png`, { type: 'image/png' })

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Patitas', text: '¡Ayúdame a encontrarle un hogar!' })
      } else if (navigator.share) {
        await navigator.share({ title: 'Patitas', text: '¡Ayúdame a encontrarle un hogar!', url: petUrl })
      } else {
        await navigator.clipboard.writeText(petUrl)
        setError('Tu navegador no soporta compartir directamente. Copiamos el link al portapapeles.')
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError('No se pudo compartir.')
      }
    }
  }

  return (
    <main className="px-4 pb-24">
      <div className="flex justify-between items-center py-4">
        <Link href={`/pets/${id}`} className="text-gray-500 text-sm">← Volver</Link>
        <span className="text-xl font-medium text-[#C04828]">patitas.</span>
      </div>

      <h1 className="text-lg font-medium text-gray-900 mb-4">Compartir mascota</h1>

      <div className="flex gap-2 mb-4">
        {templates.map(t => (
          <button
            key={t.id}
            onClick={() => setTemplate(t.id)}
            className={`flex-1 px-3 py-2 rounded-full text-xs border transition-colors ${
              template === t.id
                ? 'bg-[#C04828] text-white border-[#C04828]'
                : 'bg-white text-gray-500 border-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="w-full rounded-2xl overflow-hidden border border-gray-100 mb-4" style={{ aspectRatio: '9 / 16' }}>
        {/* key forces a fresh image request when the template changes */}
        <img key={template} src={imageUrl} alt="Tarjeta para compartir" className="w-full h-full object-cover" />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-3">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex-1 border border-gray-200 text-gray-700 rounded-xl py-3 text-sm disabled:opacity-50"
        >
          {downloading ? 'Descargando…' : 'Descargar'}
        </button>
        <button
          onClick={handleShare}
          className="flex-1 bg-[#C04828] text-white rounded-xl py-3 text-sm font-medium"
        >
          Compartir
        </button>
      </div>
    </main>
  )
}
