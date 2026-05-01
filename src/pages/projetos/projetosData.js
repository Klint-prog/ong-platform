export const statusPadrao = [
  { value: 'EM_ANDAMENTO', label: 'Em andamento' },
  { value: 'CONCLUIDO', label: 'Concluído' },
  { value: 'RASCUNHO', label: 'Rascunho' },
  { value: 'CANCELADO', label: 'Cancelado' },
]

export const statusConfig = {
  EM_ANDAMENTO: { label: 'Em andamento', badge: 'badge-blue' },
  CONCLUIDO: { label: 'Concluído', badge: 'badge-green' },
  RASCUNHO: { label: 'Rascunho', badge: 'badge-gray' },
  CANCELADO: { label: 'Cancelado', badge: 'badge-red' },
}

export const fmt = v => `R$ ${Number(v || 0).toLocaleString('pt-BR')}`

const STORAGE_KEY = 'ong.projetos'

function safeParseArray(value) {
  try {
    const parsed = JSON.parse(value || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function carregarProjetos() {
  if (typeof localStorage === 'undefined') return []
  return safeParseArray(localStorage.getItem(STORAGE_KEY))
}

export function salvarProjetos(projetos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.isArray(projetos) ? projetos : []))
}
