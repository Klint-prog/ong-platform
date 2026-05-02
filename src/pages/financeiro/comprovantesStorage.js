const KEY = 'ong_financeiro_comprovantes'
const INIT_KEY = 'ong_financeiro_comprovantes_initialized'

function gerarId(prefixo = 'comprovante') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${prefixo}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function gerarCodigoVerificacao(prefixo = 'AVV') {
  const agora = new Date()
  const data = `${agora.getFullYear()}${String(agora.getMonth() + 1).padStart(2, '0')}${String(agora.getDate()).padStart(2, '0')}`
  const aleatorio = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `${prefixo}-${data}-${aleatorio}`
}

function gerarHashSimples(payload) {
  const texto = JSON.stringify(payload || {})
  let hash = 0
  for (let i = 0; i < texto.length; i += 1) {
    hash = ((hash << 5) - hash) + texto.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')
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

function normalizarValidacao(comprovante) {
  if (comprovante?.status !== 'VALIDO') return comprovante

  const base = {
    ...comprovante,
    validadoEm: comprovante.validadoEm || new Date().toISOString(),
    validadoPor: comprovante.validadoPor || comprovante.validador || 'Admin',
    metodoValidacao: comprovante.metodoValidacao || 'Validação eletrônica interna auditável',
    codigoVerificacao: comprovante.codigoVerificacao || gerarCodigoVerificacao(),
  }

  return {
    ...base,
    hashDocumento: base.hashDocumento || gerarHashSimples({
      id: base.id,
      documento: base.documento,
      tipo: base.tipo,
      lancamento: base.lancamento,
      projeto: base.projeto,
      valor: base.valor,
      validadoEm: base.validadoEm,
      codigoVerificacao: base.codigoVerificacao,
    }),
  }
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
  return salvarArray(comprovantes.map(normalizarValidacao))
}

export function addComprovanteStorage(comprovante) {
  const current = listComprovantesStorage()
  const nextItem = normalizarValidacao({
    id: comprovante.id || gerarId(),
    anexos: Array.isArray(comprovante.anexos) ? comprovante.anexos : [],
    ...comprovante,
  })

  salvarArray([nextItem, ...current.filter((item) => String(item.id) !== String(nextItem.id))])
  return nextItem
}

export function updateComprovanteStorage(comprovante) {
  const current = listComprovantesStorage()
  const nextItem = normalizarValidacao(comprovante)
  const next = current.map((item) => String(item.id) === String(nextItem.id) ? nextItem : item)
  salvarArray(next)
  return nextItem
}

export function deleteComprovanteStorage(id) {
  const current = listComprovantesStorage()
  const next = current.filter((item) => String(item.id) !== String(id))
  salvarArray(next)
  return next
}

export function deleteComprovanteByTransacaoStorage(transacaoId) {
  const current = listComprovantesStorage()
  const next = current.filter((item) => String(item.transacaoId) !== String(transacaoId))
  salvarArray(next)
  return next
}
