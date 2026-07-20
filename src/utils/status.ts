const statusMap: Record<string, string> = {
  DRAFT: 'neutral',
  SUBMITTED: 'info',
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  POSTED: 'success',
  FAILED: 'danger',
  OPEN: 'warning',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  RECEIVED: 'success',
  PARTIALLY_RECEIVED: 'warning',
  CANCELLED: 'neutral',
  MATERIAL_RESERVED: 'success',
  PLANNED: 'info',
}

export const getStatusTone = (status?: string) => statusMap[status || ''] || 'neutral'
