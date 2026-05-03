const STORAGE_KEY = 'ong:pessoas'
const TIPOS_KEY = 'ong:pessoas:tipos'

export const TIPOS_PESSOA_PADRAO = ['VOLUNTARIO', 'BENEFICIARIO', 'MEMBRO', 'DOADOR']

const CORES = ['#ec4899', '#a855f7', '#3b82f6', '#22c55e', '#eab308', '#ef4444']

const getInicial = (nome = '') => nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')

export const formatarTipoPessoa = (tipo = '') => tipo.replaceAll('_', ' ').toLowerCase().replace(/(^|\s)\S/g, (l) => l.toUpperCase())
export const normalizarTipoPessoa = (tipo = '') => tipo.trim().toUpperCase().replaceAll(' ', '_')

function safeParseArray(value) {
  try {
    const parsed = JSON.parse(value || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function listarTiposPessoa() {
  if (typeof localStorage === 'undefined') return TIPOS_PESSOA_PADRAO
  const salvos = safeParseArray(localStorage.getItem(TIPOS_KEY))
  return salvos.length ? salvos : TIPOS_PESSOA_PADRAO
}

export function salvarTiposPessoa(tipos) {
  const normalizados = Array.from(new Set((Array.isArray(tipos) ? tipos : TIPOS_PESSOA_PADRAO).map(normalizarTipoPessoa).filter(Boolean)))
  localStorage.setItem(TIPOS_KEY, JSON.stringify(normalizados.length ? normalizados : TIPOS_PESSOA_PADRAO))
  return listarTiposPessoa()
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
    tipo: normalizarTipoPessoa(payload.tipo || 'MEMBRO'),
    inicial: getInicial(payload.nome),
    status: payload.status || 'ATIVO',
    horas: Number(payload.horas || 0),
    projetos: Number(payload.projetos || 0),
  }

  if (id) {
    const numericId = Number(id)
    const updated = pessoas.map((p) => (Number(p.id) === numericId ? { ...p, ...pessoaData, id: p.id, cor: p.cor || pessoaData.cor } : p))
    savePessoas(updated)
    return numericId
  }

  const nextId = pessoas.length ? Math.max(...pessoas.map((p) => Number(p.id) || 0)) + 1 : 1
  const novaPessoa = { ...pessoaData, id: nextId, cor: CORES[nextId % CORES.length] }
  const updated = [novaPessoa, ...pessoas]
  savePessoas(updated)
  return nextId
}

export function excluirPessoa(id) {
  const updated = loadPessoas().filter((pessoa) => String(pessoa.id) !== String(id))
  savePessoas(updated)
  return updated
}

export function findPessoaById(id) {
  return loadPessoas().find((p) => String(p.id) === String(id))
}
