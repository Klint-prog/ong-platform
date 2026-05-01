const KEY = 'ong.documentos'

function safeParseArray(value) {
  try {
    const parsed = JSON.parse(value || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function listarDocumentos() {
  if (typeof localStorage === 'undefined') return []
  return safeParseArray(localStorage.getItem(KEY))
}

export function salvarDocumentos(documentos) {
  localStorage.setItem(KEY, JSON.stringify(Array.isArray(documentos) ? documentos : []))
}
