const KEY = 'ong.captacao.oportunidades'
const STATUS_KEY = 'ong.captacao.status'

export const statusPadrao = [
  { id: 'PROSPECCAO', label: 'Prospecção', color: '#6B7280' },
  { id: 'EM_ELABORACAO', label: 'Em elaboração', color: '#D97706' },
  { id: 'ENVIADO', label: 'Enviado', color: '#2563EB' },
  { id: 'APROVADO', label: 'Aprovado', color: '#16A34A' },
  { id: 'REPROVADO', label: 'Reprovado', color: '#DC2626' },
]

function safeParseArray(value) {
  try {
    const parsed = JSON.parse(value || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const getStatusList = () => safeParseArray(localStorage.getItem(STATUS_KEY)).length ? safeParseArray(localStorage.getItem(STATUS_KEY)) : statusPadrao
export const saveStatusList = (list) => localStorage.setItem(STATUS_KEY, JSON.stringify(Array.isArray(list) ? list : statusPadrao))

export const getOportunidades = () => safeParseArray(localStorage.getItem(KEY))
export const saveOportunidades = (list) => localStorage.setItem(KEY, JSON.stringify(Array.isArray(list) ? list : []))
export const getOportunidade = (id) => getOportunidades().find((item) => String(item.id) === String(id))
