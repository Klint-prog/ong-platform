/* ================================================================
   ONG Platform — localStorage compatível com PostgreSQL
   ================================================================

   Esta camada substitui o uso direto do localStorage por uma implementação
   compatível que persiste as chaves no backend/PostgreSQL.

   Observação técnica:
   - A API Web Storage é síncrona.
   - O PostgreSQL/API é assíncrono.
   - Por isso, mantemos um espelho em memória para leitura imediata e
     enviamos cada escrita para o backend. No bootstrap, as chaves são
     hidratadas do banco antes do React renderizar.
*/

const API_BASE = '/api'
const nativeLocalStorage = window.localStorage
const memory = new Map()
let hydrated = false
let writeTimer = null
let pendingWrites = new Map()
let pendingDeletes = new Set()

// Chaves antigas gravadas fora do prefixo "ong" (não eram persistidas).
// No bootstrap, migramos o que existir no localStorage nativo para a
// chave nova, que passa a ser sincronizada com o banco.
const LEGACY_KEY_MIGRATIONS = {
  nfp_scans: 'ong_nfp_scans',
}

function shouldPersistKey(key) {
  const normalized = String(key || '')

  // Arquivos grandes nunca devem voltar para o browser. Documentos críticos
  // já foram migrados para endpoint próprio com volume persistente.
  if (normalized === 'ong_institucional_documentos_criticos') return false

  // O projeto possui chaves legadas com ponto, dois-pontos e underline.
  // Ex.: ong.documentos, ong:institucional, ong_financeiro_transacoes.
  return normalized.startsWith('ong_') || normalized.startsWith('ong.') || normalized.startsWith('ong:') || normalized.startsWith('ong_platform_')
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options)
  if (!response.ok) throw new Error(await response.text())
  return response.json()
}

function notifyStorageFailure() {
  // Avisa o app uma única vez que a persistência está indisponível,
  // para que a UI possa alertar o usuário em vez de falhar em silêncio.
  window.dispatchEvent(new CustomEvent('ong:storage-offline'))
}

async function flushWrites({ keepalive = false } = {}) {
  const writes = Array.from(pendingWrites.entries())
  const deletes = Array.from(pendingDeletes)
  pendingWrites = new Map()
  pendingDeletes = new Set()

  await Promise.all([
    ...writes.map(([key, value]) => requestJson(`${API_BASE}/storage/${encodeURIComponent(key)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
      keepalive,
    }).catch((error) => {
      console.error('Falha ao salvar no PostgreSQL:', key, error)
      // Recoloca na fila para nova tentativa no próximo flush
      if (!pendingWrites.has(key)) pendingWrites.set(key, value)
      notifyStorageFailure()
    })),
    ...deletes.map((key) => requestJson(`${API_BASE}/storage/${encodeURIComponent(key)}`, { method: 'DELETE', keepalive })
      .catch((error) => {
        console.error('Falha ao remover do PostgreSQL:', key, error)
        pendingDeletes.add(key)
        notifyStorageFailure()
      })),
  ])
}

function scheduleFlush() {
  if (writeTimer) clearTimeout(writeTimer)
  writeTimer = setTimeout(flushWrites, 30)
}

function migrarChavesLegadas() {
  Object.entries(LEGACY_KEY_MIGRATIONS).forEach(([antiga, nova]) => {
    const value = nativeLocalStorage.getItem(antiga)
    if (value == null) return
    if (!memory.has(nova)) {
      memory.set(nova, value)
      pendingWrites.set(nova, value)
    }
    nativeLocalStorage.removeItem(antiga)
  })
}

export async function hydratePostgresLocalStorage() {
  if (hydrated) return

  try {
    const data = await requestJson(`${API_BASE}/storage`)
    Object.entries(data || {}).forEach(([key, value]) => {
      memory.set(key, String(value ?? ''))
    })

    // Migração de dados antigos do browser para o banco. Depois de migrar,
    // remove do localStorage nativo para aliviar o navegador.
    for (let i = 0; i < nativeLocalStorage.length; i += 1) {
      const key = nativeLocalStorage.key(i)
      if (!shouldPersistKey(key)) continue
      if (memory.has(key)) continue
      const value = nativeLocalStorage.getItem(key)
      if (value == null) continue
      memory.set(key, value)
      pendingWrites.set(key, value)
    }

    Array.from({ length: nativeLocalStorage.length }, (_, index) => nativeLocalStorage.key(index))
      .filter(shouldPersistKey)
      .forEach((key) => nativeLocalStorage.removeItem(key))

    migrarChavesLegadas()

    if (pendingWrites.size) await flushWrites()
  } catch (error) {
    console.error('PostgreSQL storage indisponível. A aplicação continuará em memória nesta sessão.', error)
    notifyStorageFailure()
  } finally {
    hydrated = true
  }
}

export function installPostgresLocalStorage() {
  const postgresStorage = {
    get length() {
      return memory.size
    },
    key(index) {
      return Array.from(memory.keys())[index] || null
    },
    getItem(key) {
      const normalized = String(key)
      return memory.has(normalized) ? memory.get(normalized) : null
    },
    setItem(key, value) {
      const normalized = String(key)
      const stringValue = String(value)
      memory.set(normalized, stringValue)
      if (shouldPersistKey(normalized)) {
        pendingDeletes.delete(normalized)
        pendingWrites.set(normalized, stringValue)
        scheduleFlush()
      }
    },
    removeItem(key) {
      const normalized = String(key)
      memory.delete(normalized)
      if (shouldPersistKey(normalized)) {
        pendingWrites.delete(normalized)
        pendingDeletes.add(normalized)
        scheduleFlush()
      }
    },
    clear() {
      Array.from(memory.keys()).forEach((key) => this.removeItem(key))
    },
  }

  Object.defineProperty(window, 'localStorage', {
    value: postgresStorage,
    configurable: true,
    writable: false,
  })

  // Garante que escritas pendentes (debounce de 30ms) não se percam quando
  // o usuário fecha a aba, o navegador ou desliga o computador.
  // `keepalive: true` permite que o fetch complete mesmo com a página fechando.
  window.addEventListener('pagehide', () => {
    if (pendingWrites.size || pendingDeletes.size) flushWrites({ keepalive: true })
  })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && (pendingWrites.size || pendingDeletes.size)) {
      flushWrites({ keepalive: true })
    }
  })
}

export function flushPostgresLocalStorage() {
  return flushWrites()
}
