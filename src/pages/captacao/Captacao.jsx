import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarClock, CircleDollarSign, FilePlus2, Send, Trophy } from 'lucide-react'
import { getOportunidades, saveOportunidades, getStatusList } from './captacaoStorage'

const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Captacao() {
  const navigate = useNavigate()
  const [oportunidades, setOportunidades] = useState(getOportunidades)
  const statusMap = useMemo(() => Object.fromEntries(getStatusList().map((s) => [s.id, s])), [])

  const excluirOportunidade = (id) => {
    const novaLista = oportunidades.filter((item) => item.id !== id)
    setOportunidades(novaLista)
    saveOportunidades(novaLista)
  }

  const totalProspectado = oportunidades.reduce((acc, item) => acc + item.valor, 0)
  const aprovado = oportunidades.filter((item) => item.status === 'APROVADO').reduce((acc, item) => acc + item.valor, 0)

  return (
    <div className="mod-captacao animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Captação de Recursos</h1>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/captacao/nova')}><FilePlus2 size={16} /> Nova oportunidade</button>
      </div>
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card mod-captacao"><div className="stat-icon"><CircleDollarSign size={20} /></div><div><div className="stat-label">Prospectado</div><div className="stat-value" style={{ fontSize: 22 }}>{fmt(totalProspectado)}</div></div></div>
        <div className="stat-card mod-financeiro"><div className="stat-icon"><Trophy size={20} /></div><div><div className="stat-label">Aprovado</div><div className="stat-value" style={{ fontSize: 22 }}>{fmt(aprovado)}</div></div></div>
        <div className="stat-card mod-dashboard"><div className="stat-icon"><Send size={20} /></div><div><div className="stat-label">Propostas</div><div className="stat-value">{oportunidades.length}</div></div></div>
        <div className="stat-card mod-alertas"><div className="stat-icon"><CalendarClock size={20} /></div><div><div className="stat-label">Prazos críticos</div><div className="stat-value">2</div></div></div>
      </div>

      <div className="card"><div className="table-wrap"><table><thead><tr><th>Oportunidade</th><th>Fonte</th><th>Valor</th><th>Prazo</th><th>Responsável</th><th>Status</th><th>Ações</th></tr></thead><tbody>
        {oportunidades.map((item) => {
          const cfg = statusMap[item.status] || { label: item.status, color: '#6B7280' }
          return <tr key={item.id}><td><strong>{item.nome}</strong></td><td>{item.fonte}</td><td>{fmt(item.valor)}</td><td>{new Date(`${item.prazo}T12:00:00`).toLocaleDateString('pt-BR')}</td><td>{item.responsavel}</td><td><span className="badge" style={{ background: `${cfg.color}22`, color: cfg.color }}>{cfg.label}</span></td><td style={{ display: 'flex', gap: 8 }}><button className="btn btn-sm btn-outline" onClick={() => navigate(`/captacao/${item.id}/dossie`)}>Abrir dossiê</button><button className="btn btn-sm btn-outline" onClick={() => excluirOportunidade(item.id)}>Excluir</button></td></tr>
        })}
      </tbody></table></div></div>
    </div>
  )
}
