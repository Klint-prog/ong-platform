const STORAGE_KEY = 'ong:pessoas'

export const PESSOAS_INICIAIS = [
  { id: 1, nome: 'Maria Silva', tipo: 'VOLUNTARIO', status: 'ATIVO', telefone: '(81) 99123-4567', email: 'maria@email.com', horas: 124, projetos: 3, inicial: 'MS', cor: '#ec4899' },
  { id: 2, nome: 'João Costa', tipo: 'BENEFICIARIO', status: 'ATIVO', telefone: '(81) 98765-4321', email: 'joao@email.com', horas: 0, projetos: 1, inicial: 'JC', cor: '#a855f7' },
  { id: 3, nome: 'Ana Beatriz', tipo: 'MEMBRO', status: 'ATIVO', telefone: '(81) 99234-5678', email: 'ana@email.com', horas: 80, projetos: 5, inicial: 'AB', cor: '#3b82f6' },
  { id: 4, nome: 'Carlos Mendes', tipo: 'DOADOR', status: 'ATIVO', telefone: '(81) 97654-3210', email: 'carlos@email.com', horas: 0, projetos: 0, inicial: 'CM', cor: '#22c55e' },
  { id: 5, nome: 'Fernanda Lima', tipo: 'VOLUNTARIO', status: 'INATIVO', telefone: '(81) 96543-2109', email: 'fer@email.com', horas: 56, projetos: 2, inicial: 'FL', cor: '#eab308' },
  { id: 6, nome: 'Roberto Santos', tipo: 'BENEFICIARIO', status: 'ATIVO', telefone: '(81) 95432-1098', email: 'rob@email.com', horas: 0, projetos: 2, inicial: 'RS', cor: '#ef4444' },
]

const CORES = ['#ec4899', '#a855f7', '#3b82f6', '#22c55e', '#eab308', '#ef4444']

const getInicial = (nome = '') => nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')

export function loadPessoas() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) return PESSOAS_INICIAIS
  try {
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : PESSOAS_INICIAIS
  } catch {
    return PESSOAS_INICIAIS
  }
}

export function savePessoas(pessoas) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pessoas))
}

export function upsertPessoa(payload, id) {
  const pessoas = loadPessoas()
  const pessoaData = {
    ...payload,
    tipo: payload.tipo?.toUpperCase() || 'MEMBRO',
    inicial: getInicial(payload.nome),
    status: 'ATIVO',
    horas: 0,
    projetos: 0,
  }

  if (id) {
    const numericId = Number(id)
    const updated = pessoas.map((p) => (p.id === numericId ? { ...p, ...pessoaData } : p))
    savePessoas(updated)
    return numericId
  }

  const nextId = pessoas.length ? Math.max(...pessoas.map((p) => p.id)) + 1 : 1
  const novaPessoa = { ...pessoaData, id: nextId, cor: CORES[nextId % CORES.length] }
  const updated = [novaPessoa, ...pessoas]
  savePessoas(updated)
  return nextId
}

export function findPessoaById(id) {
  return loadPessoas().find((p) => p.id === Number(id))
}
