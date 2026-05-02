import { addComprovanteStorage, deleteComprovanteByTransacaoStorage } from './comprovantesStorage'

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

export function saveTransacoesStorage(transacoes) {
  if (typeof window === 'undefined') return []
  const normalized = Array.isArray(transacoes) ? transacoes : []
  window.localStorage.setItem(KEY, JSON.stringify(normalized))
  return normalized
}

export function addTransacaoStorage(transacao) {
  if (typeof window === 'undefined') return null

  const current = listTransacoesStorage()
  const nextItem = {
    id: gerarId(),
    ...transacao,
    anexos: Array.isArray(transacao.anexos) ? transacao.anexos : [],
  }

  const next = [nextItem, ...current]
  saveTransacoesStorage(next)

  if (nextItem.comprovante === 'PENDENTE') {
    addComprovanteStorage({
      id: `comp-${nextItem.id}`,
      documento: nextItem.anexos?.[0]?.nome || `comprovante-${String(nextItem.descricao || 'transacao').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.txt`,
      tipo: nextItem.tipo === 'RECEITA' ? 'Comprovante de receita' : 'Comprovante de despesa',
      lancamento: nextItem.descricao || 'Transação sem descrição',
      categoria: nextItem.categoria || '-',
      origemEntidade: nextItem.origemEntidade || nextItem.nomeDoador || nextItem.nomeEntidade || '',
      nomeDoador: nextItem.nomeDoador || '',
      nomeEntidade: nextItem.nomeEntidade || nextItem.origemEntidade || '',
      projeto: nextItem.projeto || 'Fundo Geral',
      conta: nextItem.conta || nextItem.forma || '-',
      forma: nextItem.forma || nextItem.conta || '-',
      valor: Number(nextItem.valor || 0),
      status: 'PENDENTE',
      validador: '-',
      transacaoId: nextItem.id,
      anexos: nextItem.anexos || [],
    })
  }

  return nextItem
}

export function deleteTransacaoStorage(id) {
  const next = listTransacoesStorage().filter((item) => String(item.id) !== String(id))
  saveTransacoesStorage(next)
  deleteComprovanteByTransacaoStorage(id)
  return next
}
