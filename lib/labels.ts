import { RequestStatus } from '@/lib/types'

export const statusLabels: Record<RequestStatus, { label: string; classes: string }> = {
  pending: { label: 'Pendiente', classes: 'bg-orange-50 text-[#C04828] border-orange-100' },
  approved: { label: 'Aprobada', classes: 'bg-[#EAF3DE] text-[#3B6D11] border-green-100' },
  declined: { label: 'Rechazada', classes: 'bg-gray-50 text-gray-500 border-gray-200' },
}
