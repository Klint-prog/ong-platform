export const PROJETOS_INICIAIS = [
  {
    id: 1, nome: 'Horta Solidária', status: 'EM_ANDAMENTO',
    descricao: 'Implantação de hortas comunitárias em 5 bairros da periferia.',
    orcamento: 12000, gasto: 7400, inicio: 'Jan/2025', fim: 'Ago/2025',
    pessoas: 12, tarefas: { total: 18, concluidas: 11 },
    cor: '#22c55e', tags: [{ nome: 'Alimentação', cor: '#16a34a' }, { nome: 'Comunidade', cor: '#2563eb' }],
    documentos: [],
  },
  {
    id: 2, nome: 'Escola Digital', status: 'EM_ANDAMENTO',
    descricao: 'Inclusão digital para jovens de 14-18 anos em situação de vulnerabilidade.',
    orcamento: 25000, gasto: 9800, inicio: 'Mar/2025', fim: 'Dez/2025',
    pessoas: 8, tarefas: { total: 24, concluidas: 7 },
    cor: '#3b82f6', tags: [{ nome: 'Educação', cor: '#2563eb' }, { nome: 'Tecnologia', cor: '#7c3aed' }],
    documentos: [],
  },
]

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

export function carregarProjetos() {
  const salvos = localStorage.getItem(STORAGE_KEY)
  if (!salvos) return PROJETOS_INICIAIS
  try {
    const parsed = JSON.parse(salvos)
    return Array.isArray(parsed) ? parsed : PROJETOS_INICIAIS
  } catch {
    return PROJETOS_INICIAIS
  }
}

export function salvarProjetos(projetos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projetos))
}
