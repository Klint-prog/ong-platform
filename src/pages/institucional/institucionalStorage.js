const STORAGE_KEY = 'ong:institucional'

export const INSTITUCIONAL_INICIAL = {
  nome: 'Associação de Produtores e Produtoras Rurais do Assentamento Mariano Sales',
  cnpj: '07.779.623',
  atuacao: 'Desenvolvimento rural, assistência social, capacitação e projetos agropecuários',
  endereco: 'Engenho Sirigi, Aliança - PE',
  missao: 'Promover autonomia, acesso a direitos e desenvolvimento sustentável para famílias do campo.',
  visao: 'Ser referência regional em projetos sociais rurais, transparência e impacto comunitário.',
  presidente: 'Eliel Gomes da Silva',
  vicePresidente: 'A definir',
  diretorOperacoes: 'Jhonatas Mendes',
  viceDiretorOperacoes: 'A definir',
  secretaria: 'A definir',
  diretorFinanceiro: 'A definir',
  viceDiretorFinanceiro: 'A definir',
  conselheiro1: 'A definir',
  conselheiro2: 'A definir',
  conselheiro3: 'A definir',
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
