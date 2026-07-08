const USERS_KEY = 'ong_auth_users'
const AUTH_STORAGE_KEY = 'ong_platform_auth_user'

export const ACOES = [
  { id: 'visualizar', label: 'Ver' },
  { id: 'criar', label: 'Criar' },
  { id: 'editar', label: 'Editar' },
  { id: 'excluir', label: 'Excluir' },
  { id: 'validar', label: 'Validar' },
  { id: 'exportar', label: 'Exportar' },
  { id: 'administrar', label: 'Administrar' },
]

export const MODULOS = [
  { id: 'dashboard', label: 'Dashboard', path: '/', descricao: 'Indicadores gerais da organização' },
  { id: 'institucional', label: 'Institucional', path: '/institucional', descricao: 'Dados oficiais, diretoria, logo e documentos críticos' },
  { id: 'projetos', label: 'Projetos', path: '/projetos', descricao: 'Projetos, atividades, metas e cronogramas' },
  { id: 'beneficiarios', label: 'Beneficiários', path: '/beneficiarios', descricao: 'Famílias, pessoas atendidas e termos LGPD' },
  { id: 'pessoas', label: 'Pessoas', path: '/pessoas', descricao: 'Membros, voluntários, doadores e equipe' },
  { id: 'documentos', label: 'Documentos', path: '/documentos', descricao: 'Central de documentos e evidências' },
  { id: 'financeiro', label: 'Financeiro', path: '/financeiro', descricao: 'Receitas, despesas, contas, orçamento e comprovantes' },
  { id: 'captacao', label: 'Captação', path: '/captacao', descricao: 'Editais, oportunidades e propostas' },
  { id: 'relatorios', label: 'Relatórios', path: '/relatorios', descricao: 'Relatórios gerenciais, impacto e prestação de contas' },
  { id: 'notasPaulista', label: 'Notas Paulista', path: '/notas-paulista', descricao: 'Registros e conferência de notas fiscais' },
  { id: 'comunicacao', label: 'Comunicação', path: '/comunicacao', descricao: 'Comunicados, modelos e notificações' },
  { id: 'usuarios', label: 'Usuários', path: '/usuarios', descricao: 'Contas, papéis e permissões' },
  { id: 'configuracoes', label: 'Configurações', path: '/configuracoes', descricao: 'Parâmetros gerais da plataforma' },
]

export const ROLE_CONFIG = {
  ADMIN: {
    label: 'Administrador geral',
    resumo: 'Acesso total à plataforma, usuários, configurações, exclusões e validações.',
    badge: 'badge-purple',
  },
  DIRETORIA: {
    label: 'Diretoria',
    resumo: 'Gestão institucional, projetos, captação, relatórios e aprovações estratégicas.',
    badge: 'badge-blue',
  },
  FINANCEIRO: {
    label: 'Financeiro',
    resumo: 'Operação financeira, comprovantes, prestação de contas, notas e relatórios financeiros.',
    badge: 'badge-green',
  },
  COORDENADOR: {
    label: 'Coordenador de projeto',
    resumo: 'Gestão operacional de projetos, beneficiários, pessoas, documentos e comunicação básica.',
    badge: 'badge-blue',
  },
  CONSELHO: {
    label: 'Conselho fiscal',
    resumo: 'Fiscalização, leitura, validação e exportação de documentos, financeiro e relatórios.',
    badge: 'badge-yellow',
  },
  OPERADOR: {
    label: 'Operador',
    resumo: 'Operação cotidiana com criação e edição limitada, sem exclusões nem administração.',
    badge: 'badge-pink',
  },
  VISUALIZADOR: {
    label: 'Visualizador',
    resumo: 'Acesso somente leitura aos módulos liberados.',
    badge: 'badge-gray',
  },
}

const todasAcoes = ACOES.map((acao) => acao.id)
const semAdmin = todasAcoes.filter((acao) => acao !== 'administrar')
const leitura = ['visualizar']
const leituraExportacao = ['visualizar', 'exportar']
const operacao = ['visualizar', 'criar', 'editar', 'exportar']
const aprovacao = ['visualizar', 'validar', 'exportar']

export const ACESSOS_POR_PAPEL = {
  ADMIN: Object.fromEntries(MODULOS.map((modulo) => [modulo.id, todasAcoes])),
  DIRETORIA: {
    dashboard: leituraExportacao,
    institucional: ['visualizar', 'criar', 'editar', 'validar', 'exportar'],
    projetos: ['visualizar', 'criar', 'editar', 'validar', 'exportar'],
    beneficiarios: leituraExportacao,
    pessoas: leituraExportacao,
    documentos: aprovacao,
    financeiro: aprovacao,
    captacao: ['visualizar', 'criar', 'editar', 'validar', 'exportar'],
    relatorios: ['visualizar', 'criar', 'validar', 'exportar'],
    notasPaulista: leituraExportacao,
    comunicacao: operacao,
    usuarios: leitura,
    configuracoes: leitura,
  },
  FINANCEIRO: {
    dashboard: leitura,
    institucional: leitura,
    projetos: leitura,
    beneficiarios: [],
    pessoas: leitura,
    documentos: ['visualizar', 'criar', 'editar', 'validar', 'exportar'],
    financeiro: ['visualizar', 'criar', 'editar', 'validar', 'exportar'],
    captacao: leituraExportacao,
    relatorios: ['visualizar', 'criar', 'exportar'],
    notasPaulista: operacao,
    comunicacao: [],
    usuarios: [],
    configuracoes: [],
  },
  COORDENADOR: {
    dashboard: leitura,
    institucional: leitura,
    projetos: operacao,
    beneficiarios: operacao,
    pessoas: ['visualizar', 'criar', 'editar'],
    documentos: operacao,
    financeiro: leitura,
    captacao: ['visualizar', 'criar', 'editar'],
    relatorios: ['visualizar', 'criar', 'exportar'],
    notasPaulista: [],
    comunicacao: ['visualizar', 'criar'],
    usuarios: [],
    configuracoes: [],
  },
  CONSELHO: {
    dashboard: leitura,
    institucional: leituraExportacao,
    projetos: leituraExportacao,
    beneficiarios: [],
    pessoas: [],
    documentos: aprovacao,
    financeiro: aprovacao,
    captacao: leituraExportacao,
    relatorios: aprovacao,
    notasPaulista: leituraExportacao,
    comunicacao: [],
    usuarios: [],
    configuracoes: [],
  },
  OPERADOR: {
    dashboard: leitura,
    institucional: [],
    projetos: ['visualizar', 'criar', 'editar'],
    beneficiarios: ['visualizar', 'criar', 'editar'],
    pessoas: ['visualizar', 'criar'],
    documentos: ['visualizar', 'criar'],
    financeiro: [],
    captacao: [],
    relatorios: [],
    notasPaulista: [],
    comunicacao: ['visualizar'],
    usuarios: [],
    configuracoes: [],
  },
  VISUALIZADOR: {
    dashboard: leitura,
    institucional: leitura,
    projetos: leitura,
    beneficiarios: [],
    pessoas: [],
    documentos: leitura,
    financeiro: [],
    captacao: [],
    relatorios: leitura,
    notasPaulista: [],
    comunicacao: [],
    usuarios: [],
    configuracoes: [],
  },
}

function gerarId(prefixo = 'user') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `${prefixo}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function normalizarEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function iniciais(nome = '') {
  return String(nome || 'Usuário')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join('') || 'U'
}

function criarAdminPadrao() {
  return {
    id: 'admin-root',
    nome: 'Administrador',
    email: 'admin@suaong.org',
    senha: 'admin123456',
    role: 'ADMIN',
    ativo: true,
    cargo: 'Administrador do sistema',
    telefone: '',
    inicial: 'AD',
    cor: '#7c3aed',
    ultimoAcesso: '',
    criadoEm: new Date().toISOString(),
    acessosExtras: {},
    bloqueios: {},
    exigirTrocaSenha: true,
  }
}

function normalizarUsuario(usuario) {
  return {
    id: usuario.id || gerarId(),
    nome: usuario.nome || 'Usuário',
    email: normalizarEmail(usuario.email),
    senha: usuario.senha || '123456',
    role: usuario.role || 'VISUALIZADOR',
    ativo: usuario.ativo !== false,
    cargo: usuario.cargo || '',
    telefone: usuario.telefone || '',
    inicial: usuario.inicial || iniciais(usuario.nome),
    cor: usuario.cor || '#64748b',
    ultimoAcesso: usuario.ultimoAcesso || usuario.login || '',
    criadoEm: usuario.criadoEm || new Date().toISOString(),
    atualizadoEm: usuario.atualizadoEm || '',
    acessosExtras: usuario.acessosExtras || {},
    bloqueios: usuario.bloqueios || {},
    exigirTrocaSenha: Boolean(usuario.exigirTrocaSenha),
  }
}

export function listarUsuarios() {
  if (typeof localStorage === 'undefined') return [criarAdminPadrao()]
  try {
    const parsed = JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const seed = [criarAdminPadrao()]
      localStorage.setItem(USERS_KEY, JSON.stringify(seed))
      return seed
    }
    return parsed.map(normalizarUsuario)
  } catch {
    const seed = [criarAdminPadrao()]
    localStorage.setItem(USERS_KEY, JSON.stringify(seed))
    return seed
  }
}

export function salvarUsuarios(usuarios) {
  const normalizados = (Array.isArray(usuarios) ? usuarios : []).map(normalizarUsuario)
  localStorage.setItem(USERS_KEY, JSON.stringify(normalizados))
  return normalizados
}

export function upsertUsuario(usuario) {
  const atual = listarUsuarios()
  const normalizado = normalizarUsuario({ ...usuario, atualizadoEm: new Date().toISOString() })
  const existe = atual.some((item) => String(item.id) === String(normalizado.id))
  const next = existe
    ? atual.map((item) => String(item.id) === String(normalizado.id) ? { ...item, ...normalizado } : item)
    : [normalizado, ...atual]
  salvarUsuarios(next)
  return normalizado
}

export function excluirUsuario(id) {
  const atual = listarUsuarios()
  const next = atual.filter((usuario) => String(usuario.id) !== String(id))
  salvarUsuarios(next)
  return next
}

/* ── Hash de senha ──────────────────────────────────────────
   As senhas nunca mais são gravadas em texto puro. O formato é
   "sha256$<salt>$<hash-hex>". Senhas antigas em texto puro são
   migradas automaticamente para hash no primeiro login válido. */

const HASH_PREFIX = 'sha256$'

function gerarSalt() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

async function sha256Hex(texto) {
  const data = new TextEncoder().encode(texto)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

export async function hashSenha(senha, salt = gerarSalt()) {
  const hash = await sha256Hex(`${salt}:${String(senha || '')}`)
  return `${HASH_PREFIX}${salt}$${hash}`
}

export async function verificarSenha(senhaDigitada, senhaArmazenada) {
  const armazenada = String(senhaArmazenada || '')
  if (!armazenada.startsWith(HASH_PREFIX)) {
    // Legado: senha em texto puro
    return { valida: armazenada === String(senhaDigitada || ''), precisaMigrar: armazenada === String(senhaDigitada || '') }
  }
  const [, salt] = armazenada.split('$')
  const recalculada = await hashSenha(senhaDigitada, salt)
  return { valida: recalculada === armazenada, precisaMigrar: false }
}

export async function autenticarUsuario(email, senha) {
  const usuarios = listarUsuarios()
  const usuario = usuarios.find((item) => normalizarEmail(item.email) === normalizarEmail(email))
  if (!usuario) return { ok: false, erro: 'Usuário não encontrado.' }
  if (!usuario.ativo) return { ok: false, erro: 'Usuário inativo. Fale com um administrador.' }

  const { valida, precisaMigrar } = await verificarSenha(senha, usuario.senha)
  if (!valida) return { ok: false, erro: 'Senha incorreta.' }

  const senhaFinal = precisaMigrar ? await hashSenha(senha) : usuario.senha
  const atualizado = { ...usuario, senha: senhaFinal, ultimoAcesso: new Date().toISOString() }
  salvarUsuarios(usuarios.map((item) => String(item.id) === String(usuario.id) ? atualizado : item))

  const sessao = removerSenha(atualizado)
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessao))
  return { ok: true, usuario: sessao }
}

export function removerSenha(usuario) {
  if (!usuario) return null
  const { senha, ...safe } = usuario
  return safe
}

export function getUsuarioSessao() {
  try {
    const salvo = localStorage.getItem(AUTH_STORAGE_KEY)
    return salvo ? JSON.parse(salvo) : null
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export function salvarUsuarioSessao(usuario) {
  const safe = removerSenha(usuario)
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(safe))
  return safe
}

export function limparUsuarioSessao() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

export function mesclarAcessos(role, extras = {}, bloqueios = {}) {
  const base = ACESSOS_POR_PAPEL[role] || {}
  return MODULOS.reduce((acc, modulo) => {
    const permitidas = new Set([...(base[modulo.id] || []), ...(extras?.[modulo.id] || [])])
    ;(bloqueios?.[modulo.id] || []).forEach((acao) => permitidas.delete(acao))
    acc[modulo.id] = Array.from(permitidas)
    return acc
  }, {})
}

export function usuarioPode(usuario, moduloId, acao = 'visualizar') {
  if (!usuario) return false
  if (usuario.role === 'ADMIN') return true
  const acessos = mesclarAcessos(usuario.role, usuario.acessosExtras, usuario.bloqueios)
  return Boolean(acessos?.[moduloId]?.includes(acao))
}

export function moduloPorPath(pathname = '/') {
  if (pathname === '/') return 'dashboard'
  const match = MODULOS
    .filter((modulo) => modulo.path !== '/')
    .sort((a, b) => b.path.length - a.path.length)
    .find((modulo) => pathname.startsWith(modulo.path))
  return match?.id || 'dashboard'
}

export function usuarioPodePath(usuario, pathname, acao = 'visualizar') {
  return usuarioPode(usuario, moduloPorPath(pathname), acao)
}

export function primeiroPathPermitido(usuario) {
  const modulo = MODULOS.find((item) => usuarioPode(usuario, item.id, 'visualizar'))
  return modulo?.path || '/'
}

export function labelPapel(role) {
  return ROLE_CONFIG[role]?.label || role || 'Sem papel'
}
