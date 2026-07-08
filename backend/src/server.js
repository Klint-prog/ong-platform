import express from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { fileURLToPath } from 'url'
import pg from 'pg'

const { Pool } = pg
const execFileAsync = promisify(execFile)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = Number(process.env.PORT || 3498)
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.resolve(__dirname, '../uploads')
const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE || 50 * 1024 * 1024)
const DATABASE_URL = process.env.DATABASE_URL || `postgres://${process.env.DB_USER || 'ong'}:${process.env.DB_PASSWORD || 'ong123'}@${process.env.DB_HOST || 'db'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'ong_platform'}`

fs.mkdirSync(path.join(UPLOAD_DIR, 'institucional'), { recursive: true })
fs.mkdirSync(path.join(UPLOAD_DIR, 'documentos'), { recursive: true })
fs.mkdirSync(path.join(UPLOAD_DIR, 'previews'), { recursive: true })

const pool = new Pool({ connectionString: DATABASE_URL })

const OFFICE_EXTENSIONS = new Set([
  '.odt', '.ott', '.ods', '.ots', '.odp', '.otp', '.odg', '.odf',
  '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.rtf',
])

const OFFICE_MIME_TYPES = new Set([
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.text-template',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.spreadsheet-template',
  'application/vnd.oasis.opendocument.presentation',
  'application/vnd.oasis.opendocument.presentation-template',
  'application/vnd.oasis.opendocument.graphics',
  'application/vnd.oasis.opendocument.formula',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/rtf',
])

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_storage (
      chave TEXT PRIMARY KEY,
      valor TEXT NOT NULL DEFAULT '',
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS documentos_institucionais (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pendente de arquivo',
      badge TEXT NOT NULL DEFAULT 'badge-yellow',
      vencimento TEXT,
      nome_arquivo TEXT,
      mime_type TEXT,
      tamanho BIGINT DEFAULT 0,
      caminho_arquivo TEXT,
      hash_arquivo TEXT,
      possui_arquivo BOOLEAN DEFAULT FALSE,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS documentos (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      nome_original TEXT,
      mime_type TEXT,
      tamanho BIGINT DEFAULT 0,
      caminho_arquivo TEXT NOT NULL,
      hash_arquivo TEXT,
      folder_id TEXT DEFAULT 'root',
      modulo TEXT DEFAULT 'GERAL',
      categoria TEXT DEFAULT 'Documento',
      projeto TEXT DEFAULT '',
      validade TEXT DEFAULT '',
      status TEXT DEFAULT 'PENDENTE_REVISAO',
      tags JSONB DEFAULT '[]'::jsonb,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  const defaults = [
    ['estatuto-social', 'Estatuto social', 'Pendente de arquivo', 'badge-yellow', 'Sem vencimento'],
    ['ata-eleicao-diretoria', 'Ata de eleição da diretoria', 'Pendente de arquivo', 'badge-yellow', '31/12/2027'],
    ['certidao-negativa-federal', 'Certidão negativa federal', 'Pendente de arquivo', 'badge-yellow', '20/06/2026'],
    ['comprovante-endereco', 'Comprovante de endereço', 'Pendente de arquivo', 'badge-yellow', '12/2026'],
  ]

  for (const item of defaults) {
    await pool.query(
      `INSERT INTO documentos_institucionais (id, nome, status, badge, vencimento)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      item,
    )
  }
}

function isOfficeDocument(filename = '', mime = '') {
  return OFFICE_EXTENSIONS.has(path.extname(filename || '').toLowerCase()) || OFFICE_MIME_TYPES.has(mime || '')
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags.map(String).filter(Boolean)
  if (typeof tags === 'string') {
    try {
      const parsed = JSON.parse(tags)
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean)
    } catch {}
    return tags.split(',').map((tag) => tag.trim()).filter(Boolean)
  }
  return []
}

function mapDocumento(row) {
  const originalName = row.nome_arquivo || row.nome || ''
  const officePreview = Boolean(row.possui_arquivo) && isOfficeDocument(originalName, row.mime_type)
  return {
    id: row.id,
    nome: row.nome,
    status: row.status,
    badge: row.badge,
    vencimento: row.vencimento,
    possuiArquivo: row.possui_arquivo,
    nomeArquivo: row.nome_arquivo || '',
    mimeType: row.mime_type || '',
    tamanho: Number(row.tamanho || 0),
    hashArquivo: row.hash_arquivo || '',
    atualizadoEm: row.atualizado_em,
    libreOfficePreview: officePreview,
    url: row.possui_arquivo ? `/api/institucional/documentos/${row.id}/arquivo` : '',
    previewUrl: row.possui_arquivo && officePreview ? `/api/institucional/documentos/${row.id}/preview.pdf` : '',
  }
}

function mapDocumentoCentral(row) {
  const originalName = row.nome_original || row.nome || ''
  const officePreview = isOfficeDocument(originalName, row.mime_type)
  const mimeType = row.mime_type || 'application/octet-stream'
  const isNativePreview = mimeType.startsWith('image/') || mimeType === 'application/pdf'
  return {
    id: row.id,
    nome: row.nome,
    nomeOriginal: originalName,
    mimeType,
    tamanho: Number(row.tamanho || 0),
    folderId: row.folder_id || 'root',
    modulo: row.modulo || 'GERAL',
    categoria: row.categoria || 'Documento',
    projeto: row.projeto || '',
    validade: row.validade || '',
    status: row.status || 'PENDENTE_REVISAO',
    tags: normalizeTags(row.tags),
    hashArquivo: row.hash_arquivo || '',
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
    possuiArquivo: Boolean(row.caminho_arquivo),
    libreOfficePreview: officePreview,
    url: `/api/documentos/${row.id}/arquivo`,
    previewUrl: officePreview ? `/api/documentos/${row.id}/preview.pdf` : (isNativePreview ? `/api/documentos/${row.id}/arquivo` : ''),
  }
}

function safeFilename(name = 'arquivo') {
  return String(name)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 160) || 'arquivo'
}

async function converterParaPdf(absolutePath, cacheKey) {
  const previewDir = path.join(UPLOAD_DIR, 'previews')
  const outputPath = path.join(previewDir, `${cacheKey}.pdf`)
  if (fs.existsSync(outputPath)) return outputPath

  const tempDir = path.join(previewDir, `tmp-${cacheKey}`)
  fs.rmSync(tempDir, { recursive: true, force: true })
  fs.mkdirSync(tempDir, { recursive: true })

  try {
    await execFileAsync('soffice', [
      '--headless',
      '--nologo',
      '--nofirststartwizard',
      '--convert-to',
      'pdf',
      '--outdir',
      tempDir,
      absolutePath,
    ], { timeout: 120000 })

    const generated = fs.readdirSync(tempDir).find((item) => item.toLowerCase().endsWith('.pdf'))
    if (!generated) throw new Error('LibreOffice não gerou o PDF de pré-visualização.')

    fs.renameSync(path.join(tempDir, generated), outputPath)
    return outputPath
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(UPLOAD_DIR, 'institucional')),
  filename: (req, file, cb) => {
    const id = req.params.id
    const ext = path.extname(file.originalname || '')
    cb(null, `${id}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`)
  },
})

const documentosStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(UPLOAD_DIR, 'documentos')),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '')
    cb(null, `${crypto.randomUUID()}-${Date.now()}${ext}`)
  },
})

const upload = multer({ storage, limits: { fileSize: MAX_FILE_SIZE } })
const uploadDocumentoCentral = multer({ storage: documentosStorage, limits: { fileSize: MAX_FILE_SIZE } })

const app = express()

// Em produção a API só é acessada pelo Nginx (mesma origem), então CORS
// aberto é desnecessário e perigoso. Habilite apenas se precisar acessar
// a API de outra origem, definindo CORS_ORIGIN (ex.: http://localhost:5173).
if (process.env.CORS_ORIGIN) {
  app.use(cors({ origin: process.env.CORS_ORIGIN.split(',').map((o) => o.trim()) }))
}

// 25mb: o módulo Institucional grava a logo como data URL dentro do JSON.
app.use(express.json({ limit: '25mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'ong-platform-backend' })
})

app.get('/api/storage', async (_req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT chave, valor FROM app_storage ORDER BY chave ASC')
    res.json(Object.fromEntries(rows.map((row) => [row.chave, row.valor])))
  } catch (error) {
    next(error)
  }
})

app.get('/api/storage/:key', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT valor FROM app_storage WHERE chave = $1', [req.params.key])
    if (!rows.length) return res.status(404).json({ error: 'Chave não encontrada.' })
    res.json({ key: req.params.key, value: rows[0].valor })
  } catch (error) {
    next(error)
  }
})

app.put('/api/storage/:key', async (req, res, next) => {
  try {
    const value = typeof req.body?.value === 'string' ? req.body.value : String(req.body?.value ?? '')
    const { rows } = await pool.query(
      `INSERT INTO app_storage (chave, valor, atualizado_em)
       VALUES ($1, $2, NOW())
       ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, atualizado_em = NOW()
       RETURNING chave, valor, atualizado_em`,
      [req.params.key, value],
    )
    res.json({ key: rows[0].chave, value: rows[0].valor, updatedAt: rows[0].atualizado_em })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/storage/:key', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM app_storage WHERE chave = $1', [req.params.key])
    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/storage', async (_req, res, next) => {
  try {
    await pool.query('DELETE FROM app_storage')
    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

app.get('/api/documentos', async (_req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM documentos ORDER BY criado_em DESC')
    res.json(rows.map(mapDocumentoCentral))
  } catch (error) {
    next(error)
  }
})

app.post('/api/documentos/upload', uploadDocumentoCentral.single('arquivo'), async (req, res, next) => {
  try {
    const file = req.file
    if (!file) return res.status(400).json({ error: 'Arquivo não enviado.' })

    const buffer = await fs.promises.readFile(file.path)
    const hash = crypto.createHash('sha256').update(buffer).digest('hex')
    const id = crypto.randomUUID()
    const relativePath = path.join('documentos', path.basename(file.path)).replace(/\\/g, '/')
    const tags = normalizeTags(req.body.tags)

    const { rows } = await pool.query(
      `INSERT INTO documentos (
        id, nome, nome_original, mime_type, tamanho, caminho_arquivo,
        hash_arquivo, folder_id, modulo, categoria, projeto, validade, status, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb)
      RETURNING *`,
      [
        id,
        req.body.nome || file.originalname,
        safeFilename(file.originalname || req.body.nome || 'documento'),
        file.mimetype || req.body.mimeType || 'application/octet-stream',
        file.size,
        relativePath,
        hash,
        req.body.folderId || 'root',
        req.body.modulo || 'GERAL',
        req.body.categoria || 'Documento',
        req.body.projeto || '',
        req.body.validade || '',
        req.body.status || 'PENDENTE_REVISAO',
        JSON.stringify(tags),
      ],
    )

    res.status(201).json(mapDocumentoCentral(rows[0]))
  } catch (error) {
    if (req.file?.path) fs.unlink(req.file.path, () => {})
    next(error)
  }
})

app.patch('/api/documentos/:id', async (req, res, next) => {
  try {
    const tags = req.body.tags === undefined ? undefined : normalizeTags(req.body.tags)
    const { rows } = await pool.query(
      `UPDATE documentos
       SET nome = COALESCE($2, nome),
           folder_id = COALESCE($3, folder_id),
           modulo = COALESCE($4, modulo),
           categoria = COALESCE($5, categoria),
           projeto = COALESCE($6, projeto),
           validade = COALESCE($7, validade),
           status = COALESCE($8, status),
           tags = COALESCE($9::jsonb, tags),
           atualizado_em = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        req.params.id,
        req.body.nome ?? null,
        req.body.folderId ?? null,
        req.body.modulo ?? null,
        req.body.categoria ?? null,
        req.body.projeto ?? null,
        req.body.validade ?? null,
        req.body.status ?? null,
        tags === undefined ? null : JSON.stringify(tags),
      ],
    )

    if (!rows.length) return res.status(404).json({ error: 'Documento não encontrado.' })
    res.json(mapDocumentoCentral(rows[0]))
  } catch (error) {
    next(error)
  }
})

app.get('/api/documentos/:id/arquivo', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM documentos WHERE id = $1', [req.params.id])
    const doc = rows[0]
    if (!doc?.caminho_arquivo) return res.status(404).send('Arquivo não encontrado.')

    const absolutePath = path.join(UPLOAD_DIR, doc.caminho_arquivo)
    if (!fs.existsSync(absolutePath)) return res.status(404).send('Arquivo físico não encontrado.')

    res.setHeader('Content-Type', doc.mime_type || 'application/octet-stream')
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.nome_original || doc.nome)}"`)
    res.sendFile(absolutePath)
  } catch (error) {
    next(error)
  }
})

app.get('/api/documentos/:id/preview.pdf', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM documentos WHERE id = $1', [req.params.id])
    const doc = rows[0]
    if (!doc?.caminho_arquivo) return res.status(404).send('Arquivo não encontrado.')
    if (!isOfficeDocument(doc.nome_original || doc.nome, doc.mime_type)) return res.status(415).send('Este tipo de arquivo não precisa de conversão LibreOffice.')

    const absolutePath = path.join(UPLOAD_DIR, doc.caminho_arquivo)
    if (!fs.existsSync(absolutePath)) return res.status(404).send('Arquivo físico não encontrado.')

    const previewPath = await converterParaPdf(absolutePath, doc.hash_arquivo || crypto.createHash('sha256').update(doc.caminho_arquivo).digest('hex'))
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent((doc.nome_original || doc.nome).replace(/\.[^.]+$/, '.pdf'))}"`)
    res.sendFile(previewPath)
  } catch (error) {
    next(error)
  }
})

app.delete('/api/documentos/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query('DELETE FROM documentos WHERE id = $1 RETURNING caminho_arquivo, hash_arquivo', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Documento não encontrado.' })

    const doc = rows[0]
    if (doc.caminho_arquivo) fs.unlink(path.join(UPLOAD_DIR, doc.caminho_arquivo), () => {})
    if (doc.hash_arquivo) fs.unlink(path.join(UPLOAD_DIR, 'previews', `${doc.hash_arquivo}.pdf`), () => {})

    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

app.get('/api/institucional/documentos', async (_req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM documentos_institucionais ORDER BY criado_em ASC')
    res.json(rows.map(mapDocumento))
  } catch (error) {
    next(error)
  }
})

app.post('/api/institucional/documentos/:id/upload', upload.single('arquivo'), async (req, res, next) => {
  try {
    const { id } = req.params
    const file = req.file
    if (!file) return res.status(400).json({ error: 'Arquivo não enviado.' })

    const existing = await pool.query('SELECT caminho_arquivo, hash_arquivo FROM documentos_institucionais WHERE id = $1', [id])
    if (!existing.rowCount) {
      fs.unlink(file.path, () => {})
      return res.status(404).json({ error: 'Documento institucional não encontrado.' })
    }

    const antigo = existing.rows[0]?.caminho_arquivo
    const antigoHash = existing.rows[0]?.hash_arquivo
    if (antigo) fs.unlink(path.join(UPLOAD_DIR, antigo), () => {})
    if (antigoHash) fs.unlink(path.join(UPLOAD_DIR, 'previews', `${antigoHash}.pdf`), () => {})

    const buffer = await fs.promises.readFile(file.path)
    const hash = crypto.createHash('sha256').update(buffer).digest('hex')
    const relativePath = path.join('institucional', path.basename(file.path)).replace(/\\/g, '/')

    const { rows } = await pool.query(
      `UPDATE documentos_institucionais
       SET status = 'Atualizado', badge = 'badge-green', possui_arquivo = TRUE,
           nome_arquivo = $2, mime_type = $3, tamanho = $4, caminho_arquivo = $5,
           hash_arquivo = $6, atualizado_em = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, safeFilename(file.originalname), file.mimetype || 'application/octet-stream', file.size, relativePath, hash],
    )

    res.json(mapDocumento(rows[0]))
  } catch (error) {
    next(error)
  }
})

app.get('/api/institucional/documentos/:id/preview.pdf', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM documentos_institucionais WHERE id = $1', [req.params.id])
    const doc = rows[0]
    if (!doc?.possui_arquivo || !doc.caminho_arquivo) return res.status(404).send('Arquivo não encontrado.')
    if (!isOfficeDocument(doc.nome_arquivo, doc.mime_type)) return res.status(415).send('Este tipo de arquivo não precisa de conversão LibreOffice.')

    const absolutePath = path.join(UPLOAD_DIR, doc.caminho_arquivo)
    if (!fs.existsSync(absolutePath)) return res.status(404).send('Arquivo físico não encontrado.')

    const previewPath = await converterParaPdf(absolutePath, doc.hash_arquivo || crypto.createHash('sha256').update(doc.caminho_arquivo).digest('hex'))
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent((doc.nome_arquivo || doc.nome).replace(/\.[^.]+$/, '.pdf'))}"`)
    res.sendFile(previewPath)
  } catch (error) {
    next(error)
  }
})

app.get('/api/institucional/documentos/:id/arquivo', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM documentos_institucionais WHERE id = $1', [req.params.id])
    const doc = rows[0]
    if (!doc?.possui_arquivo || !doc.caminho_arquivo) return res.status(404).send('Arquivo não encontrado.')

    const absolutePath = path.join(UPLOAD_DIR, doc.caminho_arquivo)
    if (!fs.existsSync(absolutePath)) return res.status(404).send('Arquivo físico não encontrado.')

    res.setHeader('Content-Type', doc.mime_type || 'application/octet-stream')
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.nome_arquivo || doc.nome)}"`)
    res.sendFile(absolutePath)
  } catch (error) {
    next(error)
  }
})

app.delete('/api/institucional/documentos/:id/arquivo', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT caminho_arquivo, hash_arquivo FROM documentos_institucionais WHERE id = $1', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Documento institucional não encontrado.' })
    const antigo = rows[0]?.caminho_arquivo
    const antigoHash = rows[0]?.hash_arquivo
    if (antigo) fs.unlink(path.join(UPLOAD_DIR, antigo), () => {})
    if (antigoHash) fs.unlink(path.join(UPLOAD_DIR, 'previews', `${antigoHash}.pdf`), () => {})

    const updated = await pool.query(
      `UPDATE documentos_institucionais
       SET status = 'Pendente de arquivo', badge = 'badge-yellow', possui_arquivo = FALSE,
           nome_arquivo = NULL, mime_type = NULL, tamanho = 0, caminho_arquivo = NULL,
           hash_arquivo = NULL, atualizado_em = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id],
    )

    res.json(mapDocumento(updated.rows[0]))
  } catch (error) {
    next(error)
  }
})

app.use((error, _req, res, _next) => {
  console.error(error)
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: `Arquivo excede o limite de ${Math.round(MAX_FILE_SIZE / 1024 / 1024)} MB.` })
  }
  if (error.killed || /LibreOffice|soffice|convert/i.test(error.message || '')) {
    return res.status(500).json({ error: 'Falha ao converter o documento para pré-visualização.' })
  }
  res.status(500).json({ error: 'Erro interno no servidor.' })
})

initDb()
  .then(() => app.listen(PORT, () => console.log(`ONG backend ouvindo na porta ${PORT}`)))
  .catch((error) => {
    console.error('Falha ao inicializar banco:', error)
    process.exit(1)
  })
