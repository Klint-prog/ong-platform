const STORAGE_KEY = 'ong:pessoas'

const CORES = ['#ec4899', '#a855f7', '#3b82f6', '#22c55e', '#eab308', '#ef4444']

const getInicial = (nome = '') => nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')

function safeParseArray(value) {
  try {
    const parsed = JSON.parse(value || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function loadPessoas() {
  if (typeof localStorage === 'undefined') return []
  return safeParseArray(localStorage.getItem(STORAGE_KEY))
}

export function savePessoas(pessoas) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.isArray(pessoas) ? pessoas : []))
}

export function upsertPessoa(payload, id) {
  const pessoas = loadPessoas()
  const pessoaData = {
    ...payload,
    tipo: payload.tipo?.toUpperCase() || 'MEMBRO',
    inicial: getInicial(payload.nome),
    status: payload.status || 'ATIVO',
    horas: Number(payload.horas || 0),
    projetos: Number(payload.projetos || 0),
  }

  if (id) {
    const numericId = Number(id)
    const updated = pessoas.map((p) => (p.id === numericId ? { ...p, ...pessoaData } : p))
    savePessoas(updated)
    return numericId
  }

  const nextId = pessoas.length ? Math.max(...pessoas.map((p) => Number(p.id) || 0)) + 1 : 1
  const novaPessoa = { ...pessoaData, id: nextId, cor: CORES[nextId % CORES.length] }
  const updated = [novaPessoa, ...pessoas]
  savePessoas(updated)
  return nextId
}

export function findPessoaById(id) {
  return loadPessoas().find((p) => p.id === Number(id))
}
