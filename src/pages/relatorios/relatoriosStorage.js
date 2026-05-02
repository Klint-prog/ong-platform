const CONFIG_KEY = 'ong.relatorios.config'
const AUDIT_KEY = 'ong.relatorios.audit'

function safeParseArray(value) {
  try {
    const parsed = JSON.parse(value || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function safeParseObject(value) {
  try {
    const parsed = JSON.parse(value || '{}')
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

export function loadRelatoriosConfig() {
  if (typeof localStorage === 'undefined') return {}
  return safeParseObject(localStorage.getItem(CONFIG_KEY))
}

export function saveRelatorioConfig(id, config) {
  if (typeof localStorage === 'undefined') return config
  const current = loadRelatoriosConfig()
  const next = { ...current, [id]: { ...(current[id] || {}), ...config, atualizadoEm: new Date().toISOString() } }
  localStorage.setItem(CONFIG_KEY, JSON.stringify(next))
  return next[id]
}

export function listRelatoriosAudit() {
  if (typeof localStorage === 'undefined') return []
  return safeParseArray(localStorage.getItem(AUDIT_KEY))
}

export function addRelatorioAudit({ relatorioId, relatorioNome, acao, detalhes = '' }) {
  if (typeof localStorage === 'undefined') return null
  const item = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    relatorioId,
    relatorioNome,
    acao,
    detalhes,
    usuario: 'Usuário local',
    criadoEm: new Date().toISOString(),
  }
  localStorage.setItem(AUDIT_KEY, JSON.stringify([item, ...listRelatoriosAudit()].slice(0, 100)))
  return item
}
