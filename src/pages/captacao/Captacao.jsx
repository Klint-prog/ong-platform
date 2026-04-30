import { CalendarClock, CircleDollarSign, FilePlus2, Send, Trophy, XCircle } from 'lucide-react'

const oportunidades = [
  { id: 1, nome: 'Edital Segurança Alimentar 2026', fonte: 'Instituto Parceiro', valor: 75000, prazo: '2026-05-20', status: 'EM_ELABORACAO', responsavel: 'Coordenação de Projetos' },
  { id: 2, nome: 'Chamada Empoderamento Rural', fonte: 'Empresa patrocinadora', valor: 120000, prazo: '2026-06-15', status: 'PROSPECCAO', responsavel: 'Diretoria' },
  { id: 3, nome: 'Projeto Escola Digital', fonte: 'Fundo Municipal', valor: 35000, prazo: '2026-04-10', status: 'ENVIADO', responsavel: 'Equipe técnica' },
  { id: 4, nome: 'Programa Hortas Comunitárias', fonte: 'Fundação privada', valor: 50000, prazo: '2026-03-30', status: 'APROVADO', responsavel: 'Coordenação Geral' },
]

const statusMap = {
  PROSPECCAO: { label: 'Prospecção', badge: 'badge-gray', icon: FilePlus2 },
  EM_ELABORACAO: { label: 'Em elaboração', badge: 'badge-yellow', icon: CalendarClock },
  ENVIADO: { label: 'Enviado', badge: 'badge-blue', icon: Send },
  APROVADO: { label: 'Aprovado', badge: 'badge-green', icon: Trophy },
  REPROVADO: { label: 'Reprovado', badge: 'badge-red', icon: XCircle },
}

const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Captacao() {
  const totalProspectado = oportunidades.reduce((acc, item) => acc + item.valor, 0)
  const aprovado = oportunidades.filter((item) => item.status === 'APROVADO').reduce((acc, item) => acc + item.valor, 0)

  return (
    <div className="mod-captacao animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Captação de Recursos</h1>
          <p className="page-subtitle">Controle de editais, propostas, prazos, fontes financiadoras e oportunidades</p>
        </div>
        <button className="btn btn-primary"><FilePlus2 size={16} /> Nova oportunidade</button>
      </div>

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
                const Icon = cfg.icon
                return (
                  <tr key={item.id}>
                    <td><strong>{item.nome}</strong></td>
                    <td>{item.fonte}</td>
                    <td>{fmt(item.valor)}</td>
                    <td>{new Date(`${item.prazo}T12:00:00`).toLocaleDateString('pt-BR')}</td>
                    <td>{item.responsavel}</td>
                    <td><span className={`badge ${cfg.badge}`}><Icon size={11} /> {cfg.label}</span></td>
                    <td><button className="btn btn-sm btn-outline">Abrir dossiê</button></td>
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
