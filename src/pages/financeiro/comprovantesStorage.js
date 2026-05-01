const KEY = 'ong_financeiro_comprovantes'
const INIT_KEY = 'ong_financeiro_comprovantes_initialized'

function gerarId(prefixo = 'comprovante') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${prefixo}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function lerArray() {
  if (typeof window === 'undefined') return []

  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function salvarArray(items) {
  if (typeof window === 'undefined') return []
  window.localStorage.setItem(KEY, JSON.stringify(items))
  window.localStorage.setItem(INIT_KEY, 'true')
  return items
}

export function ensureComprovantesStorage(defaultItems = []) {
  if (typeof window === 'undefined') return defaultItems

  const initialized = window.localStorage.getItem(INIT_KEY) === 'true'
  if (initialized) return lerArray()

  return salvarArray(defaultItems)
}

export function listComprovantesStorage() {
  return lerArray()
}

export function saveComprovantesStorage(comprovantes) {
  return salvarArray(comprovantes)
}

export function addComprovanteStorage(comprovante) {
  const current = listComprovantesStorage()
  const nextItem = {
    id: comprovante.id || gerarId(),
    ...comprovante,
  }

  salvarArray([nextItem, ...current])
  return nextItem
}

export function updateComprovanteStorage(comprovante) {
  const current = listComprovantesStorage()
  const next = current.map((item) => String(item.id) === String(comprovante.id) ? comprovante : item)
  salvarArray(next)
  return comprovante
}

export function deleteComprovanteStorage(id) {
  const current = listComprovantesStorage()
  const next = current.filter((item) => String(item.id) !== String(id))
  salvarArray(next)
  return next
}
