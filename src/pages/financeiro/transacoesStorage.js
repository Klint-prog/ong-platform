const KEY = 'ong_financeiro_transacoes'

export function listTransacoesStorage() {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function addTransacaoStorage(transacao) {
  if (typeof window === 'undefined') return
  const current = listTransacoesStorage()
  const next = [{ id: crypto.randomUUID(), ...transacao }, ...current]
  window.localStorage.setItem(KEY, JSON.stringify(next))
}
