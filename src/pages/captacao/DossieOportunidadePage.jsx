import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getOportunidade, getOportunidades, getStatusList, saveOportunidades } from './captacaoStorage'

const gerarPdfSimples = (conteudoTexto) => {
  const esc = (t) => t.replace(/[()\\]/g, '\\$&')
  const lines = conteudoTexto.split('\n')
  const textOps = lines.map((line, i) => `1 0 0 1 40 ${800 - i * 18} Tm (${esc(line)}) Tj`).join('\n')
  const stream = `BT\n/F1 12 Tf\n${textOps}\nET`
  const pdf = `%PDF-1.3\n1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>endobj\n4 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n5 0 obj<< /Length ${stream.length} >>stream\n${stream}\nendstream endobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000062 00000 n \n0000000120 00000 n \n0000000246 00000 n \n0000000316 00000 n \ntrailer<< /Root 1 0 R /Size 6 >>\nstartxref\n${316 + stream.length}\n%%EOF`
  return new Blob([pdf], { type: 'application/pdf' })
}

export default function DossieOportunidadePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [statusList] = useState(getStatusList)
  const [arquivos, setArquivos] = useState([])
  const [form, setForm] = useState(() => getOportunidade(id) || null)
  const statusMap = useMemo(() => Object.fromEntries(statusList.map((s) => [s.id, s.label])), [statusList])

  if (!form) return <div className="card">Oportunidade não encontrada.</div>

  const salvar = (e) => {
    e.preventDefault()
    const list = getOportunidades().map((item) => (String(item.id) === String(form.id) ? form : item))
    saveOportunidades(list)
    navigate('/captacao')
  }

  const baixarPdf = () => {
    const texto = [`Instituição: ONG Plataforma`, `Oportunidade: ${form.nome}`, `Fonte: ${form.fonte}`, `Valor: R$ ${form.valor}`, `Prazo: ${form.prazo}`, `Responsável: ${form.responsavel}`, `Status: ${statusMap[form.status] || form.status}`, `Observações: ${form.observacoes || '-'}`, `Arquivos anexados: ${arquivos.map((a) => a.name).join(', ') || 'Nenhum'}`].join('\n')
    const blob = gerarPdfSimples(texto)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `dossie-${form.nome.toLowerCase().replace(/\s+/g, '-')}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  }

  return <form className="card" onSubmit={salvar} style={{ display: 'grid', gap: 12 }}><h2>Dossiê da oportunidade</h2><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }}>
    <input value={form.nome} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))} />
    <input value={form.fonte} onChange={(e) => setForm((p) => ({ ...p, fonte: e.target.value }))} />
    <input type="number" value={form.valor} onChange={(e) => setForm((p) => ({ ...p, valor: Number(e.target.value) || 0 }))} />
    <input type="date" value={form.prazo} onChange={(e) => setForm((p) => ({ ...p, prazo: e.target.value }))} />
    <input value={form.responsavel} onChange={(e) => setForm((p) => ({ ...p, responsavel: e.target.value }))} />
    <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>{statusList.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
  </div><textarea rows={4} placeholder="Observações" value={form.observacoes || ''} onChange={(e) => setForm((p) => ({ ...p, observacoes: e.target.value }))} />
  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><label className="btn btn-outline" style={{ cursor: 'pointer' }}>Importar arquivos<input multiple type="file" style={{ display: 'none' }} onChange={(e) => setArquivos(Array.from(e.target.files || []))} /></label><button type="button" className="btn btn-outline" onClick={baixarPdf}>Baixar dossiê em PDF</button><button type="submit" className="btn btn-primary">Salvar</button></div>
  {!!arquivos.length && <div><strong>Arquivos para download:</strong><ul>{arquivos.map((file) => <li key={file.name}><a href={URL.createObjectURL(file)} download={file.name}>{file.name}</a></li>)}</ul></div>}
  </form>
}
