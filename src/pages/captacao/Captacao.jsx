import { useMemo, useState } from 'react'
import { CalendarClock, CircleDollarSign, FilePlus2, Send, Trophy, XCircle } from 'lucide-react'

const oportunidadesIniciais = [
  { id: 1, nome: 'Edital Segurança Alimentar 2026', fonte: 'Instituto Parceiro', valor: 75000, prazo: '2026-05-20', status: 'EM_ELABORACAO', responsavel: 'Coordenação de Projetos' },
  { id: 2, nome: 'Chamada Empoderamento Rural', fonte: 'Empresa patrocinadora', valor: 120000, prazo: '2026-06-15', status: 'PROSPECCAO', responsavel: 'Diretoria' },
  { id: 3, nome: 'Projeto Escola Digital', fonte: 'Fundo Municipal', valor: 35000, prazo: '2026-04-10', status: 'ENVIADO', responsavel: 'Equipe técnica' },
  { id: 4, nome: 'Programa Hortas Comunitárias', fonte: 'Fundação privada', valor: 50000, prazo: '2026-03-30', status: 'APROVADO', responsavel: 'Coordenação Geral' },
]

const statusPadrao = [
  { id: 'PROSPECCAO', label: 'Prospecção', color: '#6B7280', icon: FilePlus2 },
  { id: 'EM_ELABORACAO', label: 'Em elaboração', color: '#D97706', icon: CalendarClock },
  { id: 'ENVIADO', label: 'Enviado', color: '#2563EB', icon: Send },
  { id: 'APROVADO', label: 'Aprovado', color: '#16A34A', icon: Trophy },
  { id: 'REPROVADO', label: 'Reprovado', color: '#DC2626', icon: XCircle },
]

const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Captacao() {
  const [oportunidades, setOportunidades] = useState(oportunidadesIniciais)
  const [statusList, setStatusList] = useState(statusPadrao)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [novoStatusNome, setNovoStatusNome] = useState('')
  const [novoStatusCor, setNovoStatusCor] = useState('#7C3AED')
  const [form, setForm] = useState({
    nome: '', fonte: '', valor: '', prazo: '', responsavel: '', status: statusPadrao[0].id,
  })
  const [dossieAberto, setDossieAberto] = useState(null)

  const statusMap = useMemo(() => Object.fromEntries(statusList.map((s) => [s.id, s])), [statusList])

  const totalProspectado = oportunidades.reduce((acc, item) => acc + item.valor, 0)
  const aprovado = oportunidades.filter((item) => item.status === 'APROVADO').reduce((acc, item) => acc + item.valor, 0)

  const criarStatusPersonalizado = () => {
    const nome = novoStatusNome.trim()
    if (!nome) return
    const id = `CUSTOM_${Date.now()}`
    const novoStatus = { id, label: nome, color: novoStatusCor, icon: FilePlus2 }
    setStatusList((prev) => [...prev, novoStatus])
    setForm((prev) => ({ ...prev, status: id }))
    setNovoStatusNome('')
  }

  const abrirDossie = (oportunidade) => {
    setDossieAberto({ ...oportunidade, observacoes: oportunidade.observacoes || '' })
  }

  const salvarDossie = (e) => {
    e.preventDefault()
    if (!dossieAberto) return
    const atualizado = {
      ...dossieAberto,
      nome: dossieAberto.nome.trim(),
      fonte: dossieAberto.fonte.trim(),
      valor: Number(dossieAberto.valor) || 0,
      responsavel: dossieAberto.responsavel.trim(),
    }
    if (!atualizado.nome || !atualizado.fonte || !atualizado.prazo || !atualizado.responsavel) return
    setOportunidades((prev) => prev.map((item) => (item.id === atualizado.id ? atualizado : item)))
    setDossieAberto(null)
  }


  const importarArquivoDossie = (e) => {
    const arquivo = e.target.files?.[0]
    if (!arquivo || !dossieAberto) return
    setDossieAberto((prev) => ({ ...prev, observacoes: `${prev.observacoes || ''}
[Arquivo anexado] ${arquivo.name}`.trim() }))
    e.target.value = ''
  }

  const baixarDossie = () => {
    if (!dossieAberto) return
    const conteudo = JSON.stringify(dossieAberto, null, 2)
    const blob = new Blob([conteudo], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `dossie-${dossieAberto.nome.toLowerCase().replace(/\s+/g, '-') || 'oportunidade'}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }


  const excluirOportunidade = (id) => {
    setOportunidades((prev) => prev.filter((item) => item.id !== id))
    setDossieAberto((prev) => (prev?.id === id ? null : prev))
  }

  const cadastrarOportunidade = (e) => {
    e.preventDefault()
    const nova = {
      id: Date.now(),
      nome: form.nome.trim(),
      fonte: form.fonte.trim(),
      valor: Number(form.valor) || 0,
      prazo: form.prazo,
      responsavel: form.responsavel.trim(),
      status: form.status,
    }
    if (!nova.nome || !nova.fonte || !nova.prazo || !nova.responsavel) return
    setOportunidades((prev) => [nova, ...prev])
    setForm({ nome: '', fonte: '', valor: '', prazo: '', responsavel: '', status: statusList[0]?.id || '' })
    setMostrarForm(false)
  }

  return (
    <div className="mod-captacao animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Captação de Recursos</h1>
          <p className="page-subtitle">Controle de editais, propostas, prazos, fontes financiadoras e oportunidades</p>
        </div>
        <button className="btn btn-primary" onClick={() => setMostrarForm((prev) => !prev)}>
          <FilePlus2 size={16} /> Nova oportunidade
        </button>
      </div>

      {mostrarForm && (
        <form className="card" onSubmit={cadastrarOportunidade} style={{ marginBottom: 24, padding: 16, display: 'grid', gap: 12 }}>
          <strong>Cadastrar oportunidade</strong>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
            <input placeholder="Nome" value={form.nome} onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))} />
            <input placeholder="Fonte" value={form.fonte} onChange={(e) => setForm((prev) => ({ ...prev, fonte: e.target.value }))} />
            <input type="number" min="0" placeholder="Valor" value={form.valor} onChange={(e) => setForm((prev) => ({ ...prev, valor: e.target.value }))} />
            <input type="date" value={form.prazo} onChange={(e) => setForm((prev) => ({ ...prev, prazo: e.target.value }))} />
            <input placeholder="Responsável" value={form.responsavel} onChange={(e) => setForm((prev) => ({ ...prev, responsavel: e.target.value }))} />
            <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}>
              {statusList.map((status) => <option key={status.id} value={status.id}>{status.label}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input placeholder="Novo status (tag)" value={novoStatusNome} onChange={(e) => setNovoStatusNome(e.target.value)} style={{ maxWidth: 240 }} />
            <input type="color" value={novoStatusCor} onChange={(e) => setNovoStatusCor(e.target.value)} />
            <button type="button" className="btn btn-outline btn-sm" onClick={criarStatusPersonalizado}>Adicionar tag de status</button>
            <button type="submit" className="btn btn-primary btn-sm">Salvar oportunidade</button>
          </div>
        </form>
      )}

      {dossieAberto && (
        <form className="card" onSubmit={salvarDossie} style={{ marginBottom: 24, padding: 16, display: 'grid', gap: 12 }}>
          <strong>Dossiê da oportunidade (edição)</strong>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
            <input placeholder="Nome" value={dossieAberto.nome} onChange={(e) => setDossieAberto((prev) => ({ ...prev, nome: e.target.value }))} />
            <input placeholder="Fonte" value={dossieAberto.fonte} onChange={(e) => setDossieAberto((prev) => ({ ...prev, fonte: e.target.value }))} />
            <input type="number" min="0" placeholder="Valor" value={dossieAberto.valor} onChange={(e) => setDossieAberto((prev) => ({ ...prev, valor: e.target.value }))} />
            <input type="date" value={dossieAberto.prazo} onChange={(e) => setDossieAberto((prev) => ({ ...prev, prazo: e.target.value }))} />
            <input placeholder="Responsável" value={dossieAberto.responsavel} onChange={(e) => setDossieAberto((prev) => ({ ...prev, responsavel: e.target.value }))} />
            <select value={dossieAberto.status} onChange={(e) => setDossieAberto((prev) => ({ ...prev, status: e.target.value }))}>
              {statusList.map((status) => <option key={status.id} value={status.id}>{status.label}</option>)}
            </select>
          </div>
          <textarea placeholder="Observações do dossiê" value={dossieAberto.observacoes || ''} onChange={(e) => setDossieAberto((prev) => ({ ...prev, observacoes: e.target.value }))} rows={3} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
              Importar arquivo
              <input type="file" onChange={importarArquivoDossie} style={{ display: 'none' }} />
            </label>
            <button type="button" className="btn btn-outline btn-sm" onClick={baixarDossie}>Baixar dossiê</button>
            <button type="submit" className="btn btn-primary btn-sm">Salvar dossiê</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setDossieAberto(null)}>Fechar</button>
          </div>
        </form>
      )}

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card mod-captacao"><div className="stat-icon"><CircleDollarSign size={20} /></div><div><div className="stat-label">Prospectado</div><div className="stat-value" style={{ fontSize: 22 }}>{fmt(totalProspectado)}</div></div></div>
        <div className="stat-card mod-financeiro"><div className="stat-icon"><Trophy size={20} /></div><div><div className="stat-label">Aprovado</div><div className="stat-value" style={{ fontSize: 22 }}>{fmt(aprovado)}</div></div></div>
        <div className="stat-card mod-dashboard"><div className="stat-icon"><Send size={20} /></div><div><div className="stat-label">Propostas</div><div className="stat-value">{oportunidades.length}</div></div></div>
        <div className="stat-card mod-alertas"><div className="stat-icon"><CalendarClock size={20} /></div><div><div className="stat-label">Prazos críticos</div><div className="stat-value">2</div></div></div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Oportunidade</th><th>Fonte</th><th>Valor</th><th>Prazo</th><th>Responsável</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {oportunidades.map((item) => {
                const cfg = statusMap[item.status]
                const Icon = cfg?.icon || FilePlus2
                return (
                  <tr key={item.id}>
                    <td><strong>{item.nome}</strong></td>
                    <td>{item.fonte}</td>
                    <td>{fmt(item.valor)}</td>
                    <td>{new Date(`${item.prazo}T12:00:00`).toLocaleDateString('pt-BR')}</td>
                    <td>{item.responsavel}</td>
                    <td>
                      <span className="badge" style={{ background: `${cfg?.color || '#6B7280'}22`, color: cfg?.color || '#6B7280' }}>
                        <Icon size={11} /> {cfg?.label || item.status}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-sm btn-outline" onClick={() => abrirDossie(item)}>Abrir dossiê</button>
                      <button className="btn btn-sm btn-outline" onClick={() => excluirOportunidade(item.id)}>Excluir</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
