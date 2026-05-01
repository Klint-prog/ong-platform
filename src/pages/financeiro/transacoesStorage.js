import { addComprovanteStorage } from './comprovantesStorage'

const KEY = 'ong_financeiro_transacoes'

function gerarId(prefixo = 'transacao') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${prefixo}-${Date.now()}-${Math.random().toString(36).slice(2)}`
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

  if (nextItem.comprovante === 'PENDENTE') {
    addComprovanteStorage({
      id: `comp-${nextItem.id}`,
      documento: `comprovante-${String(nextItem.descricao || 'transacao').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.txt`,
      tipo: nextItem.tipo === 'RECEITA' ? 'Comprovante de receita' : 'Comprovante de despesa',
      lancamento: nextItem.descricao || 'Transação sem descrição',
      projeto: nextItem.projeto || 'Fundo Geral',
      valor: Number(nextItem.valor || 0),
      status: 'PENDENTE',
      validador: '-',
      transacaoId: nextItem.id,
    })
  }

  return nextItem
}
