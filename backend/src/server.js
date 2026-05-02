import express from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import pg from 'pg'

const { Pool } = pg
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = Number(process.env.PORT || 3498)
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.resolve(__dirname, '../uploads')
const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE || 50 * 1024 * 1024)
const DATABASE_URL = process.env.DATABASE_URL || `postgres://${process.env.DB_USER || 'ong'}:${process.env.DB_PASSWORD || 'ong123'}@${process.env.DB_HOST || 'db'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'ong_platform'}`

fs.mkdirSync(path.join(UPLOAD_DIR, 'institucional'), { recursive: true })

const pool = new Pool({ connectionString: DATABASE_URL })

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

function mapDocumento(row) {
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
    url: row.possui_arquivo ? `/api/institucional/documentos/${row.id}/arquivo` : '',
  }
}

function safeFilename(name = 'arquivo') {
  return String(name)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 160)
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(UPLOAD_DIR, 'institucional')),
  filename: (req, file, cb) => {
    const id = req.params.id
    const ext = path.extname(file.originalname || '')
    cb(null, `${id}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
})

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

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

    const existing = await pool.query('SELECT caminho_arquivo FROM documentos_institucionais WHERE id = $1', [id])
    if (!existing.rowCount) {
      fs.unlink(file.path, () => {})
      return res.status(404).json({ error: 'Documento institucional não encontrado.' })
    }

    const antigo = existing.rows[0]?.caminho_arquivo
    if (antigo) fs.unlink(path.join(UPLOAD_DIR, antigo), () => {})

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
    const { rows } = await pool.query('SELECT caminho_arquivo FROM documentos_institucionais WHERE id = $1', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Documento institucional não encontrado.' })
    const antigo = rows[0]?.caminho_arquivo
    if (antigo) fs.unlink(path.join(UPLOAD_DIR, antigo), () => {})

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
  res.status(500).json({ error: 'Erro interno no servidor.' })
})

initDb()
  .then(() => app.listen(PORT, () => console.log(`ONG backend ouvindo na porta ${PORT}`)))
  .catch((error) => {
    console.error('Falha ao inicializar banco:', error)
    process.exit(1)
  })
