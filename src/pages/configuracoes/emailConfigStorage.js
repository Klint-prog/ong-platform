const STORAGE_KEY = 'ong_email_config'

const PADRAO = {
  protocolo: 'SMTP',
  host: '',
  porta: '587',
  usuario: '',
  senha: '',
  remetenteNome: '',
  remetenteEmail: '',
  usarSSL: true,
}

export function getEmailConfig() {
  if (typeof window === 'undefined') return PADRAO

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return PADRAO
    return { ...PADRAO, ...JSON.parse(raw) }
  } catch {
    return PADRAO
  }
}

export function saveEmailConfig(config) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export function getEmailConfigStatus() {
  const config = getEmailConfig()
  const conectado = Boolean(config.host && config.porta && config.usuario && config.remetenteEmail)
  return { conectado, config }
}
