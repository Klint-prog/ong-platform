const KEY = 'ong.captacao.oportunidades'
const STATUS_KEY = 'ong.captacao.status'

export const statusPadrao = [
  { id: 'PROSPECCAO', label: 'Prospecção', color: '#6B7280' },
  { id: 'EM_ELABORACAO', label: 'Em elaboração', color: '#D97706' },
  { id: 'ENVIADO', label: 'Enviado', color: '#2563EB' },
  { id: 'APROVADO', label: 'Aprovado', color: '#16A34A' },
  { id: 'REPROVADO', label: 'Reprovado', color: '#DC2626' },
]

const iniciais = [
  { id: 1, nome: 'Edital Segurança Alimentar 2026', fonte: 'Instituto Parceiro', valor: 75000, prazo: '2026-05-20', status: 'EM_ELABORACAO', responsavel: 'Coordenação de Projetos', observacoes: '' },
  { id: 2, nome: 'Chamada Empoderamento Rural', fonte: 'Empresa patrocinadora', valor: 120000, prazo: '2026-06-15', status: 'PROSPECCAO', responsavel: 'Diretoria', observacoes: '' },
]

export const getStatusList = () => JSON.parse(localStorage.getItem(STATUS_KEY) || 'null') || statusPadrao
export const saveStatusList = (list) => localStorage.setItem(STATUS_KEY, JSON.stringify(list))

export const getOportunidades = () => JSON.parse(localStorage.getItem(KEY) || 'null') || iniciais
export const saveOportunidades = (list) => localStorage.setItem(KEY, JSON.stringify(list))
export const getOportunidade = (id) => getOportunidades().find((item) => String(item.id) === String(id))
