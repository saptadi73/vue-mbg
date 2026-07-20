export interface ApiMeta {
  total?: number
  timestamp?: string
  request_id?: string
  [key: string]: unknown
}

export interface ApiEnvelope<T> {
  success?: boolean
  code?: string
  message?: string
  data: T
  meta?: ApiMeta
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  message?: string
}
