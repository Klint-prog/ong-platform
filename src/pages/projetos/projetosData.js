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

export function buscarProjetoPorId(id) {
  return carregarProjetos().find((projeto) => String(projeto.id) === String(id))
}

export function upsertProjeto(payload, id) {
  const projetos = carregarProjetos()
  const projetoData = {
    ...payload,
    orcamento: Number(payload.orcamento || 0),
    gasto: Number(payload.gasto || 0),
    pessoas: Number(payload.pessoas || 0),
    tarefas: payload.tarefas || { total: 0, concluidas: 0 },
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    documentos: Array.isArray(payload.documentos) ? payload.documentos : [],
    cor: payload.cor || '#3b82f6',
  }

  if (id) {
    const atualizados = projetos.map((projeto) => String(projeto.id) === String(id) ? { ...projeto, ...projetoData, id: projeto.id } : projeto)
    salvarProjetos(atualizados)
    return id
  }

  const novoId = Date.now()
  salvarProjetos([{ ...projetoData, id: novoId }, ...projetos])
  return novoId
}

export function excluirProjeto(id) {
  const atualizados = carregarProjetos().filter((projeto) => String(projeto.id) !== String(id))
  salvarProjetos(atualizados)
  return atualizados
}
