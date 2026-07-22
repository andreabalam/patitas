import { ImageResponse } from 'next/og'
import { supabase } from '@/lib/supabase'

export const runtime = 'edge'

const WIDTH = 1080
const HEIGHT = 1920

type Template = 'warm' | 'dark' | 'nature'

const palettes: Record<Template, { bg: string; accent: string; text: string; sub: string }> = {
  warm: { bg: '#C04828', accent: '#F5C4B3', text: '#ffffff', sub: '#FFF3EF' },
  dark: { bg: '#171717', accent: '#C04828', text: '#ffffff', sub: '#a3a3a3' },
  nature: { bg: '#3B6D11', accent: '#EAF3DE', text: '#ffffff', sub: '#EAF3DE' },
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const templateParam = searchParams.get('template')
  const template: Template = (['warm', 'dark', 'nature'] as const).includes(templateParam as Template)
    ? (templateParam as Template)
    : 'warm'

  const palette = palettes[template]

  const { data: pet } = await supabase
    .from('pets')
    .select('name, species, city, days_in_shelter, pet_photos(url, is_primary)')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (!pet) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#171717',
            color: 'white',
            fontSize: 48,
          }}
        >
          Ya no disponible
        </div>
      ),
      { width: WIDTH, height: HEIGHT }
    )
  }

  const emoji = pet.species === 'dog' ? '🐕' : pet.species === 'cat' ? '🐈' : '🐾'
  const photo = pet.pet_photos?.find((p: { is_primary: boolean }) => p.is_primary)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: palette.bg,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '65%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.08)',
          }}
        >
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo.url} width={WIDTH} height={HEIGHT * 0.65} style={{ objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 320 }}>{emoji}</span>
          )}
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '64px',
          }}
        >
          <span style={{ fontSize: 36, color: palette.accent, marginBottom: 20 }}>patitas.</span>
          <span style={{ fontSize: 88, fontWeight: 700, color: palette.text, lineHeight: 1.05 }}>
            {pet.name}
          </span>
          <span style={{ fontSize: 32, color: palette.sub, marginTop: 12 }}>{pet.city}</span>

          <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 40 }}>
            <span style={{ fontSize: 72, fontWeight: 700, color: palette.text }}>
              {pet.days_in_shelter}
            </span>
            <span style={{ fontSize: 34, color: palette.sub, marginLeft: 16 }}>
              días esperando un hogar
            </span>
          </div>
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT }
  )
}
