const KEY = 'ong.beneficiarios'

function safeParseArray(value) {
  try {
    const parsed = JSON.parse(value || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function listarBeneficiarios() {
  if (typeof localStorage === 'undefined') return []
  return safeParseArray(localStorage.getItem(KEY))
}

export function salvarBeneficiarios(beneficiarios) {
  localStorage.setItem(KEY, JSON.stringify(Array.isArray(beneficiarios) ? beneficiarios : []))
}
