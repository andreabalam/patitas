import { ImageResponse } from 'next/og'
import { supabase } from '@/lib/supabase'

export const alt = 'Patitas'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: pet } = await supabase
    .from('pets')
    .select('name, species, days_in_shelter, pet_photos(url, is_primary)')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  const emoji = pet?.species === 'dog' ? '🐕' : pet?.species === 'cat' ? '🐈' : '🐾'
  const photo = pet?.pet_photos?.find((p: { is_primary: boolean }) => p.is_primary)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#C04828',
        }}
      >
        <div
          style={{
            width: '45%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#FFF3EF',
          }}
        >
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo.url} width={540} height={630} style={{ objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 220 }}>{emoji}</span>
          )}
        </div>

        <div
          style={{
            width: '55%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '60px',
          }}
        >
          <span style={{ fontSize: 32, color: '#F5C4B3', marginBottom: 16 }}>patitas.</span>
          <span style={{ fontSize: 72, fontWeight: 700, color: 'white', lineHeight: 1.1 }}>
            {pet?.name ?? 'Patitas'}
          </span>
          {pet && (
            <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 32 }}>
              <span style={{ fontSize: 56, fontWeight: 700, color: 'white' }}>
                {pet.days_in_shelter}
              </span>
              <span style={{ fontSize: 28, color: '#F5C4B3', marginLeft: 12 }}>
                días esperando un hogar
              </span>
            </div>
          )}
        </div>
      </div>
    ),
    { ...size }
  )
}
