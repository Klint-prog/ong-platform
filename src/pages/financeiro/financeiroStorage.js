const CONTAS_KEY = 'ong_financeiro_contas'
const ORCAMENTOS_KEY = 'ong_financeiro_orcamentos'

function gerarId(prefixo = 'item') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${prefixo}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function lerArray(key) {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function salvarArray(key, items) {
  if (typeof window === 'undefined') return []
  const normalized = Array.isArray(items) ? items : []
  window.localStorage.setItem(key, JSON.stringify(normalized))
  return normalized
}

export function listContasStorage() {
  return lerArray(CONTAS_KEY)
}

export function saveContasStorage(contas) {
  return salvarArray(CONTAS_KEY, contas)
}

export function addContaStorage(conta) {
  const nextItem = { id: conta.id || gerarId('conta'), ...conta }
  const next = [nextItem, ...listContasStorage().filter((item) => String(item.id) !== String(nextItem.id))]
  saveContasStorage(next)
  return nextItem
}

export function deleteContaStorage(id) {
  const next = listContasStorage().filter((item) => String(item.id) !== String(id))
  saveContasStorage(next)
  return next
}

export function listOrcamentosStorage() {
  return lerArray(ORCAMENTOS_KEY)
}

export function saveOrcamentosStorage(orcamentos) {
  return salvarArray(ORCAMENTOS_KEY, orcamentos)
}

export function addOrcamentoStorage(orcamento) {
  const nextItem = { id: orcamento.id || gerarId('orcamento'), ...orcamento }
  const next = [nextItem, ...listOrcamentosStorage().filter((item) => String(item.id) !== String(nextItem.id))]
  saveOrcamentosStorage(next)
  return nextItem
}

export function deleteOrcamentoStorage(id) {
  const next = listOrcamentosStorage().filter((item) => String(item.id) !== String(id))
  saveOrcamentosStorage(next)
  return next
}
