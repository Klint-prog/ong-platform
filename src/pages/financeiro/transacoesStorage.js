const KEY = 'ong_financeiro_transacoes'

function gerarId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `transacao-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function listTransacoesStorage() {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function addTransacaoStorage(transacao) {
  if (typeof window === 'undefined') return null

  const current = listTransacoesStorage()
  const nextItem = {
    id: gerarId(),
    ...transacao,
  }

  const next = [nextItem, ...current]
  window.localStorage.setItem(KEY, JSON.stringify(next))
  return nextItem
}
