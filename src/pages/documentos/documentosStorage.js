const DOCS_KEY = 'ong.documentos'
const FOLDERS_KEY = 'ong.documentos.folders'

export const pastasPadrao = [
  { id: 'root', nome: 'Documentos', parentId: null, modulo: 'GERAL', sistema: true },
  { id: 'institucional', nome: 'Institucional', parentId: 'root', modulo: 'INSTITUCIONAL', sistema: true },
  { id: 'financeiro', nome: 'Financeiro', parentId: 'root', modulo: 'FINANCEIRO', sistema: true },
  { id: 'projetos', nome: 'Projetos', parentId: 'root', modulo: 'PROJETOS', sistema: true },
  { id: 'beneficiarios', nome: 'Beneficiários', parentId: 'root', modulo: 'BENEFICIARIOS', sistema: true },
  { id: 'captacao', nome: 'Captação', parentId: 'root', modulo: 'CAPTACAO', sistema: true },
]

function safeParseArray(value, fallback = []) {
  try {
    const parsed = JSON.parse(value || '[]')
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

function gerarId(prefixo = 'item') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `${prefixo}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function listarPastas() {
  if (typeof localStorage === 'undefined') return pastasPadrao
  const salvas = safeParseArray(localStorage.getItem(FOLDERS_KEY), [])
  const mapa = new Map([...pastasPadrao, ...salvas].map((pasta) => [String(pasta.id), pasta]))
  return Array.from(mapa.values())
}

export function salvarPastas(pastas) {
  const personalizadas = (Array.isArray(pastas) ? pastas : []).filter((pasta) => !pasta.sistema)
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(personalizadas))
  return listarPastas()
}

export function criarPasta({ nome, parentId = 'root', modulo = 'GERAL' }) {
  const pasta = { id: gerarId('pasta'), nome, parentId, modulo, sistema: false, criadaEm: new Date().toISOString() }
  salvarPastas([...listarPastas(), pasta])
  return pasta
}

export function excluirPasta(id) {
  const pastas = listarPastas()
  const alvo = pastas.find((pasta) => String(pasta.id) === String(id))
  if (!alvo || alvo.sistema) return pastas
  const filhos = new Set([String(id)])
  let mudou = true
  while (mudou) {
    mudou = false
    pastas.forEach((pasta) => {
      if (filhos.has(String(pasta.parentId)) && !filhos.has(String(pasta.id))) {
        filhos.add(String(pasta.id))
        mudou = true
      }
    })
  }
  salvarPastas(pastas.filter((pasta) => !filhos.has(String(pasta.id))))
  salvarDocumentos(listarDocumentos().filter((doc) => !filhos.has(String(doc.folderId))))
  return listarPastas()
}

export function listarDocumentos() {
  if (typeof localStorage === 'undefined') return []
  return safeParseArray(localStorage.getItem(DOCS_KEY), [])
}

export function salvarDocumentos(documentos) {
  const normalized = Array.isArray(documentos) ? documentos : []
  localStorage.setItem(DOCS_KEY, JSON.stringify(normalized))
  return normalized
}

export function adicionarDocumento(documento) {
  const novo = {
    id: documento.id || gerarId('doc'),
    nome: documento.nome,
    nomeOriginal: documento.nomeOriginal || documento.nome,
    mimeType: documento.mimeType || 'application/octet-stream',
    tamanho: Number(documento.tamanho || 0),
    folderId: documento.folderId || 'root',
    modulo: documento.modulo || 'GERAL',
    categoria: documento.categoria || 'Documento',
    status: documento.status || 'PENDENTE_REVISAO',
    projeto: documento.projeto || '',
    relacionadoTipo: documento.relacionadoTipo || '',
    relacionadoId: documento.relacionadoId || '',
    validade: documento.validade || '',
    tags: Array.isArray(documento.tags) ? documento.tags : [],
    conteudo: documento.conteudo || '',
    criadoEm: documento.criadoEm || new Date().toISOString(),
    enviadoPor: documento.enviadoPor || 'Usuário local',
    validadoPor: documento.validadoPor || '',
    validadoEm: documento.validadoEm || '',
  }
  salvarDocumentos([novo, ...listarDocumentos().filter((doc) => String(doc.id) !== String(novo.id))])
  return novo
}

export function atualizarDocumento(documento) {
  const docs = listarDocumentos().map((doc) => String(doc.id) === String(documento.id) ? { ...doc, ...documento } : doc)
  salvarDocumentos(docs)
  return documento
}

export function excluirDocumentoStorage(id) {
  const docs = listarDocumentos().filter((doc) => String(doc.id) !== String(id))
  salvarDocumentos(docs)
  return docs
}

export function moverDocumentoStorage(id, folderId) {
  const docs = listarDocumentos().map((doc) => String(doc.id) === String(id) ? { ...doc, folderId } : doc)
  salvarDocumentos(docs)
  return docs
}
