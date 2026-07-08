const STORAGE_KEY = 'ong:institucional'

export const INSTITUCIONAL_INICIAL = {
  nome: '',
  nomeFantasia: '',
  slogan: '',
  cnpj: '',
  email: '',
  telefone: '',
  site: '',
  logoUrl: '',
  atuacao: '',
  endereco: '',
  missao: '',
  visao: '',
  assinaturaNome: '',
  assinaturaCargo: '',
  presidente: '',
  vicePresidente: '',
  diretorOperacoes: '',
  viceDiretorOperacoes: '',
  secretaria: '',
  diretorFinanceiro: '',
  viceDiretorFinanceiro: '',
  conselheiro1: '',
  conselheiro2: '',
  conselheiro3: '',
}

export function loadInstitucional() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) return INSTITUCIONAL_INICIAL

  try {
    const parsed = JSON.parse(saved)
    return { ...INSTITUCIONAL_INICIAL, ...parsed }
  } catch {
    return INSTITUCIONAL_INICIAL
  }
}

export function saveInstitucional(payload) {
  const next = { ...INSTITUCIONAL_INICIAL, ...payload }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}
