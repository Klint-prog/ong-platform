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

function shouldPersistKey(key) {
  const normalized = String(key || '')

  // Arquivos grandes nunca devem voltar para o browser. Documentos críticos
  // já foram migrados para endpoint próprio com volume persistente.
  if (normalized === 'ong_institucional_documentos_criticos') return false

  return normalized.startsWith('ong_') || normalized.startsWith('ong_platform_')
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options)
  if (!response.ok) throw new Error(await response.text())
  return response.json()
}

async function flushWrites() {
  const writes = Array.from(pendingWrites.entries())
  const deletes = Array.from(pendingDeletes)
  pendingWrites = new Map()
  pendingDeletes = new Set()

  await Promise.all([
    ...writes.map(([key, value]) => requestJson(`${API_BASE}/storage/${encodeURIComponent(key)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    }).catch((error) => console.error('Falha ao salvar no PostgreSQL:', key, error))),
    ...deletes.map((key) => requestJson(`${API_BASE}/storage/${encodeURIComponent(key)}`, { method: 'DELETE' })
      .catch((error) => console.error('Falha ao remover do PostgreSQL:', key, error))),
  ])
}

function scheduleFlush() {
  if (writeTimer) clearTimeout(writeTimer)
  writeTimer = setTimeout(flushWrites, 120)
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

    if (pendingWrites.size) await flushWrites()
  } catch (error) {
    console.error('PostgreSQL storage indisponível. A aplicação continuará em memória nesta sessão.', error)
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
}

export function flushPostgresLocalStorage() {
  return flushWrites()
}
