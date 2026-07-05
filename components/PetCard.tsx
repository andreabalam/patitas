import Link from 'next/link'
import { Pet } from '@/lib/types'

interface PetCardProps {
  pet: Pet
}

export default function PetCard({ pet }: PetCardProps) {
  const primaryPhoto = pet.pet_photos?.find(p => p.is_primary)
  const emoji = pet.species === 'dog' ? '🐕' : pet.species === 'cat' ? '🐈' : '🐾'

  return (
    <Link href={`/pets/${pet.id}`}>
      <div className="border border-gray-100 rounded-2xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
        {/* Photo */}
        <div className="w-full h-36 bg-amber-50 flex items-center justify-center relative">
          {primaryPhoto ? (
            <img
              src={primaryPhoto.url}
              alt={pet.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-5xl">{emoji}</span>
          )}
          {pet.is_urgent && (
            <div className="absolute top-2 left-2 bg-[#C04828] text-white text-xs font-medium px-2 py-1 rounded-full">
              Urgente
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-sm font-medium text-gray-900">{pet.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {pet.sex === 'male' ? 'Macho' : pet.sex === 'female' ? 'Hembra' : ''}
            {pet.age_years ? ` · ${pet.age_years} año${pet.age_years !== 1 ? 's' : ''}` : ''}
            {pet.city ? ` · ${pet.city}` : ''}
          </p>
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-400">
              <span className="text-[#C04828] font-medium">{pet.days_in_shelter}</span> días esperando
            </span>
            <span className="text-gray-300 text-base">♡</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
