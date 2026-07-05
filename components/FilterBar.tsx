'use client'

import { FilterState, Species } from '@/lib/types'

interface FilterBarProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
}

const chips: { label: string; key: keyof FilterState; value: string }[] = [
  { label: 'Todos', key: 'species', value: 'all' },
  { label: 'Perros', key: 'species', value: 'dog' },
  { label: 'Gatos', key: 'species', value: 'cat' },
]

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {chips.map(chip => (
        <button
          key={chip.label}
          onClick={() =>
            onChange({
              ...filters,
              species: chip.value as Species | 'all',
            })
          }
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs border transition-colors ${
            filters.species === chip.value
              ? 'bg-[#C04828] text-white border-[#C04828]'
              : 'bg-white text-gray-500 border-gray-200'
          }`}
        >
          {chip.label}
        </button>
      ))}
      <button
        onClick={() => onChange({ ...filters, urgent_only: !filters.urgent_only })}
        className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs border transition-colors ${
          filters.urgent_only
            ? 'bg-[#C04828] text-white border-[#C04828]'
            : 'bg-white text-gray-500 border-gray-200'
        }`}
      >
        Urgente
      </button>
    </div>
  )
}
