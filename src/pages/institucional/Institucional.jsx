import { Building2, FileCheck2, ShieldCheck, Users, MapPin, Upload, Eye, Download, ExternalLink, FileText, X, Trash2 } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadInstitucional, saveInstitucional } from './institucionalStorage'
import { AV_VADAI_LOGO_DATA_URL } from '../financeiro/financeiroLogo'

const DOCS_KEY = 'ong_institucional_documentos_criticos'
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024

const documentosPadrao = [
  { id: 'estatuto-social', nome: 'Estatuto social', status: 'Pendente de arquivo', vencimento: 'Sem vencimento', badge: 'badge-yellow' },
  { id: 'ata-eleicao-diretoria', nome: 'Ata de eleição da diretoria', status: 'Pendente de arquivo', vencimento: '31/12/2027', badge: 'badge-yellow' },
  { id: 'certidao-negativa-federal', nome: 'Certidão negativa federal', status: 'Pendente de arquivo', vencimento: '20/06/2026', badge: 'badge-yellow' },
  { id: 'comprovante-endereco', nome: 'Comprovante de endereço', status: 'Pendente de arquivo', vencimento: '12/2026', badge: 'badge-yellow' },
]

function documentoSemArquivo(doc) {
  const base = documentosPadrao.find((item) => item.id === doc.id) || doc
  return {
    ...base,
    possuiArquivo: false,
    nomeArquivo: '',
    mimeType: '',
    tamanho: 0,
    conteudo: '',
    atualizadoEm: '',
    status: 'Pendente de arquivo',
    badge: 'badge-yellow',
  }
}

function carregarDocumentosCriticos() {
  if (typeof window === 'undefined') return documentosPadrao
  try {
    const saved = JSON.parse(localStorage.getItem(DOCS_KEY) || '[]')
    if (!Array.isArray(saved) || !saved.length) return documentosPadrao
    const mapa = new Map(saved.map((doc) => [doc.id, doc]))
    return documentosPadrao.map((doc) => ({ ...doc, ...(mapa.get(doc.id) || {}) }))
  } catch {
    return documentosPadrao
  }
}

function salvarDocumentosCriticos(documentos) {
  if (typeof window === 'undefined') return documentos
  try {
    localStorage.setItem(DOCS_KEY, JSON.stringify(documentos))
    return documentos
  } catch (error) {
    window.alert('Não foi possível salvar este arquivo no navegador. O limite local foi atingido. Tente remover documentos antigos ou usar um PDF menor. Quando houver backend, o ideal é salvar esses arquivos no servidor ou storage.')
    return carregarDocumentosCriticos()
  }
}

function arquivoParaDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function formatBytes(bytes = 0) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

function dataURLtoBlob(dataUrl) {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] || 'application/octet-stream'
  const binary = atob(base64 || '')
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

function baixarArquivo(doc) {
  if (!doc?.conteudo) return
  const blob = dataURLtoBlob(doc.conteudo)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = doc.nomeArquivo || doc.nome
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function abrirNovaAba(doc) {
  if (!doc?.conteudo) return
  const blob = dataURLtoBlob(doc.conteudo)
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank', 'noopener,noreferrer')
  if (!win) window.alert('O navegador bloqueou a nova aba. Libere pop-ups para esta página.')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export default function Institucional() {
  const navigate = useNavigate()
  const [dados, setDados] = useState(() => loadInstitucional())
  const [documentosCriticos, setDocumentosCriticos] = useState(() => carregarDocumentosCriticos())
  const [previewDoc, setPreviewDoc] = useState(null)
  const [previewMaximizado, setPreviewMaximizado] = useState(false)
  const fileInputs = useRef({})
  const logoSrc = dados.logoUrl || AV_VADAI_LOGO_DATA_URL

  const diretoria = useMemo(() => [
    { cargo: 'Presidente', nome: dados.presidente },
    { cargo: 'Vice-presidente', nome: dados.vicePresidente },
    { cargo: 'Diretor de Operações', nome: dados.diretorOperacoes },
    { cargo: 'Vice-diretor de Operações', nome: dados.viceDiretorOperacoes },
    { cargo: 'Secretária', nome: dados.secretaria },
    { cargo: 'Diretor Financeiro', nome: dados.diretorFinanceiro },
    { cargo: 'Vice-diretor Financeiro', nome: dados.viceDiretorFinanceiro },
    { cargo: 'Conselheiros', nome: [dados.conselheiro1, dados.conselheiro2, dados.conselheiro3].filter((nome) => nome && nome !== 'A definir').length ? `${[dados.conselheiro1, dados.conselheiro2, dados.conselheiro3].filter((nome) => nome && nome !== 'A definir').length} membros cadastrados` : 'A definir' },
  ], [dados])

  const atualizarLogo = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const logoUrl = await arquivoParaDataUrl(file)
    const next = { ...dados, logoUrl }
    saveInstitucional(next)
    setDados(next)
    event.target.value = ''
  }

  const removerLogo = () => {
    const next = { ...dados, logoUrl: '' }
    saveInstitucional(next)
    setDados(next)
  }

  const atualizarDocumento = async (doc, event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE_BYTES) {
      window.alert(`Arquivo muito grande para armazenamento local. Limite atual: ${formatBytes(MAX_FILE_SIZE_BYTES)}. Arquivo selecionado: ${formatBytes(file.size)}.`)
      event.target.value = ''
      return
    }

    const conteudo = await arquivoParaDataUrl(file)
    const atualizado = {
      ...doc,
      possuiArquivo: true,
      nomeArquivo: file.name,
      mimeType: file.type || 'application/octet-stream',
      tamanho: file.size,
      conteudo,
      status: 'Atualizado',
      badge: 'badge-green',
      atualizadoEm: new Date().toISOString(),
    }
    const tentativa = documentosCriticos.map((item) => item.id === doc.id ? atualizado : item)
    const next = salvarDocumentosCriticos(tentativa)
    setDocumentosCriticos(next)
    event.target.value = ''
  }

  const removerDocumento = (doc) => {
    if (!doc.conteudo) return
    if (!window.confirm(`Remover o arquivo anexado em "${doc.nome}"? O tipo do documento continuará na lista para novo upload.`)) return
    const next = documentosCriticos.map((item) => item.id === doc.id ? documentoSemArquivo(doc) : item)
    setDocumentosCriticos(salvarDocumentosCriticos(next))
    setPreviewDoc((atual) => atual?.id === doc.id ? null : atual)
  }

  const abrirPreview = (doc) => {
    if (!doc.conteudo) return window.alert('Nenhum arquivo foi inserido para este documento.')
    setPreviewDoc(doc)
    setPreviewMaximizado(false)
  }

  return (
    <div className="mod-institucional animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Institucional</h1>
          <p className="page-subtitle">Dados oficiais da ONG, diretoria, certidões e identidade institucional</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/institucional/editar')}><Building2 size={16} /> Editar cadastro</button>
      </div>

      <section className="card" style={{ marginBottom: 24, display: 'grid', gridTemplateColumns: '240px 1fr', gap: 22, alignItems: 'center' }}>
        <div style={{ border: '1px solid var(--gray-100)', borderRadius: 16, padding: 14, background: '#fff', display: 'grid', placeItems: 'center', minHeight: 145 }}>
          <img src={logoSrc} alt="Logo institucional" style={{ maxWidth: '100%', maxHeight: 130, objectFit: 'contain' }} />
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          <div>
            <div className="badge badge-blue" style={{ marginBottom: 8 }}>Identidade visual</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 4 }}>{dados.nomeFantasia || dados.nome}</h2>
            <p style={{ color: 'var(--gray-500)' }}>{dados.slogan || dados.atuacao}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <label className="btn btn-outline" style={{ width: 'fit-content', cursor: 'pointer' }}>
              <Upload size={15} /> Inserir/alterar logo
              <input type="file" accept="image/*" onChange={atualizarLogo} style={{ display: 'none' }} />
            </label>
            {dados.logoUrl && <button className="btn btn-outline" onClick={removerLogo}>Restaurar logo padrão</button>}
          </div>
          <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>Este logo passa a ser usado nos documentos financeiros, relatórios e identidade da plataforma.</p>
        </div>
      </section>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card mod-institucional"><div className="stat-icon"><Building2 size={20} /></div><div><div className="stat-label">CNPJ</div><div className="stat-value" style={{ fontSize: 20 }}>{dados.cnpj || 'Não informado'}</div></div></div>
        <div className="stat-card mod-documentos"><div className="stat-icon"><FileCheck2 size={20} /></div><div><div className="stat-label">Documentos</div><div className="stat-value">{documentosCriticos.filter((doc) => doc.conteudo).length}/{documentosCriticos.length}</div></div></div>
        <div className="stat-card mod-beneficiarios"><div className="stat-icon"><Users size={20} /></div><div><div className="stat-label">Diretoria</div><div className="stat-value">10</div></div></div>
        <div className="stat-card mod-captacao"><div className="stat-icon"><ShieldCheck size={20} /></div><div><div className="stat-label">Conformidade</div><div className="stat-value">92%</div></div></div>
      </div>

      <div className="grid-2">
        <section className="card">
          <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 14 }}>Dados da organização</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            <Info label="Nome" value={dados.nome || 'Não informado'} />
            <Info label="Nome fantasia" value={dados.nomeFantasia || 'Não informado'} />
            <Info label="Área de atuação" value={dados.atuacao || 'Não informado'} />
            <Info label="Endereço" value={dados.endereco || 'Não informado'} icon={<MapPin size={14} />} />
            <Info label="E-mail" value={dados.email || 'Não informado'} />
            <Info label="Telefone" value={dados.telefone || 'Não informado'} />
            <Info label="Missão" value={dados.missao || 'Não informado'} />
            <Info label="Visão" value={dados.visao || 'Não informado'} />
          </div>
        </section>

        <section className="card">
          <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 14 }}>Diretoria e conselho</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {diretoria.map((item) => (
              <div key={item.cargo} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '12px 0', borderBottom: '1px solid var(--gray-100)' }}>
                <span style={{ color: 'var(--gray-400)', fontSize: 13 }}>{item.cargo}</span>
                <strong style={{ textAlign: 'right', color: 'var(--gray-800)' }}>{item.nome}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card" style={{ marginTop: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 14 }}>Documentos institucionais críticos</h2>
        <p style={{ marginBottom: 14, color: 'var(--gray-500)', fontSize: 13 }}>Use Alterar documento para substituir arquivo errado ou atualizar uma versão. Use Remover arquivo para limpar o anexo e enviar outro depois.</p>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Documento</th><th>Status</th><th>Vencimento</th><th>Arquivo</th><th>Ação</th></tr></thead>
            <tbody>
              {documentosCriticos.map((doc) => (
                <tr key={doc.id}>
                  <td>{doc.nome}</td>
                  <td><span className={`badge ${doc.badge}`}>{doc.status}</span></td>
                  <td>{doc.vencimento}</td>
                  <td>{doc.conteudo ? <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>{doc.nomeArquivo} • {formatBytes(doc.tamanho)}</span> : <span style={{ color: 'var(--gray-400)', fontSize: 12 }}>Nenhum arquivo</span>}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button className="btn btn-sm btn-outline" onClick={() => abrirPreview(doc)}><Eye size={13} /> Ver arquivo</button>
                      {doc.conteudo && <button className="btn btn-sm btn-outline" onClick={() => baixarArquivo(doc)}><Download size={13} /> Baixar</button>}
                      <button className="btn btn-sm btn-primary" style={{ '--mod-color': 'var(--slate-500)' }} onClick={() => fileInputs.current[doc.id]?.click()}>
                        <Upload size={13} /> {doc.conteudo ? 'Alterar documento' : 'Inserir documento'}
                      </button>
                      {doc.conteudo && <button className="btn btn-sm btn-outline" onClick={() => removerDocumento(doc)}><Trash2 size={13} /> Remover arquivo</button>}
                      <input ref={(el) => { fileInputs.current[doc.id] = el }} type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt" style={{ display: 'none' }} onChange={(event) => atualizarDocumento(doc, event)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {previewDoc && <InstitucionalPreviewModal doc={previewDoc} maximizado={previewMaximizado} onToggleMaximizado={() => setPreviewMaximizado((v) => !v)} onClose={() => setPreviewDoc(null)} onReplace={() => fileInputs.current[previewDoc.id]?.click()} onRemove={() => removerDocumento(previewDoc)} />}
    </div>
  )
}

function InstitucionalPreviewModal({ doc, maximizado, onToggleMaximizado, onClose, onReplace, onRemove }) {
  const podePreview = doc.conteudo && (doc.mimeType?.startsWith('image/') || doc.mimeType === 'application/pdf')
  const largura = maximizado ? 'calc(100vw - 40px)' : 'min(1380px, calc(100vw - 56px))'
  const altura = maximizado ? 'calc(100vh - 40px)' : 'min(86vh, 920px)'
  const alturaPreview = maximizado ? 'calc(100vh - 140px)' : 'min(72vh, 760px)'

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.62)', zIndex: 50, display: 'grid', placeItems: 'center', padding: maximizado ? 20 : 28 }}>
      <div className="card" style={{ width: largura, height: altura, maxHeight: 'calc(100vh - 40px)', resize: maximizado ? 'none' : 'both', overflow: 'auto', display: 'grid', gridTemplateRows: 'auto 1fr', gap: 14, minWidth: 980, minHeight: 620 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>Pré-visualização do documento</h2>
            <p style={{ marginTop: 4, color: 'var(--gray-400)', fontSize: 12 }}>Janela ampliada e redimensionável. Para leitura completa, use Abrir em nova aba.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {podePreview && <button className="btn btn-sm btn-outline" onClick={() => abrirNovaAba(doc)}><ExternalLink size={13} /> Abrir em nova aba</button>}
            <button className="btn btn-sm btn-outline" onClick={onToggleMaximizado}>{maximizado ? 'Restaurar' : 'Maximizar'}</button>
            <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: maximizado ? 'minmax(0, 1fr) 320px' : 'minmax(0, 1fr) 360px', gap: 18, minHeight: 0 }}>
          <div style={{ border: '1px solid var(--gray-100)', borderRadius: 12, overflow: 'hidden', display: 'grid', placeItems: 'center', background: 'var(--gray-50)', minHeight: 480 }}>
            {podePreview ? (
              <iframe title={doc.nome} src={doc.conteudo} style={{ width: '100%', height: alturaPreview, border: 0, background: '#fff' }} />
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--gray-500)' }}><FileText size={64} /><div style={{ marginTop: 10 }}>Preview indisponível para este formato.</div><button className="btn btn-outline" style={{ marginTop: 14 }} onClick={() => baixarArquivo(doc)}><Download size={14} /> Baixar arquivo</button></div>
            )}
          </div>

          <aside style={{ display: 'grid', gap: 10, alignContent: 'start', overflowY: 'auto', paddingRight: 4 }}>
            <h3 style={{ lineHeight: 1.35 }}>{doc.nome}</h3>
            <span className={`badge ${doc.badge}`} style={{ width: 'fit-content' }}>{doc.status}</span>
            <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>Arquivo: <strong>{doc.nomeArquivo}</strong></div>
            <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>Tamanho: <strong>{formatBytes(doc.tamanho)}</strong></div>
            <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>Validade: <strong>{doc.vencimento || 'Sem validade'}</strong></div>
            <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>Atualizado em: <strong>{doc.atualizadoEm ? new Date(doc.atualizadoEm).toLocaleString('pt-BR') : '-'}</strong></div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {podePreview && <button className="btn btn-outline" onClick={() => abrirNovaAba(doc)}><ExternalLink size={14} /> Nova aba</button>}
              <button className="btn btn-outline" onClick={() => baixarArquivo(doc)}><Download size={14} /> Baixar</button>
              <button className="btn btn-outline" onClick={onReplace}><Upload size={14} /> Substituir</button>
              <button className="btn btn-outline" onClick={onRemove}><Trash2 size={14} /> Remover</button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function Info({ label, value, icon }) {
  return (
    <div>
      <div style={{ color: 'var(--gray-400)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.6px', display: 'flex', gap: 6, alignItems: 'center' }}>{icon}{label}</div>
      <div style={{ color: 'var(--gray-800)', fontWeight: 600, marginTop: 3 }}>{value}</div>
    </div>
  )
}
