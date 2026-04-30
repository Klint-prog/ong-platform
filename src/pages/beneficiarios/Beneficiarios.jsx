import { useMemo, useState } from 'react'
import { UsersRound, Plus, Search, MapPin, FileSignature, HeartHandshake, Trash2 } from 'lucide-react'

const seedBeneficiarios = [
  { id: 1, nome: 'Família Silva', tipo: 'FAMILIA', comunidade: 'Engenho Sirigi', projeto: 'Horta Solidária', telefone: '(81) 98888-1111', status: 'ATIVO', termoLgpd: true, atendimentos: 7 },
  { id: 2, nome: 'Maria José dos Santos', tipo: 'MULHER_RURAL', comunidade: 'Assentamento Mariano Sales', projeto: 'Mulheres Empreendedoras', telefone: '(81) 97777-2222', status: 'ATIVO', termoLgpd: true, atendimentos: 4 },
  { id: 3, nome: 'João Pedro Lima', tipo: 'JOVEM', comunidade: 'Vila Rural', projeto: 'Escola Digital', telefone: '(81) 96666-3333', status: 'ACOMPANHAMENTO', termoLgpd: false, atendimentos: 2 },
  { id: 4, nome: 'Coletivo de Agricultores Sirigi', tipo: 'GRUPO', comunidade: 'Engenho Sirigi', projeto: 'Saúde Rural', telefone: '(81) 95555-4444', status: 'ATIVO', termoLgpd: true, atendimentos: 11 },
]

const tipoLabel = {
  FAMILIA: 'Família',
  MULHER_RURAL: 'Mulher rural',
  JOVEM: 'Jovem',
  GRUPO: 'Grupo comunitário',
}

export default function Beneficiarios() {
  const [beneficiarios, setBeneficiarios] = useState(seedBeneficiarios)
  const [busca, setBusca] = useState('')

  const filtrados = useMemo(() => beneficiarios.filter((b) => {
    const termo = busca.toLowerCase()
    return b.nome.toLowerCase().includes(termo) || b.comunidade.toLowerCase().includes(termo) || b.projeto.toLowerCase().includes(termo)
  }), [beneficiarios, busca])

  const remover = (id) => {
    if (confirm('Deseja remover este beneficiário da listagem?')) {
      setBeneficiarios((atual) => atual.filter((b) => b.id !== id))
    }
  }

  return (
    <div className="mod-beneficiarios animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Beneficiários</h1>
          <p className="page-subtitle">Cadastro de famílias, grupos e pessoas atendidas pelos projetos sociais</p>
        </div>
        <button className="btn btn-primary"><Plus size={16} /> Novo beneficiário</button>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card mod-beneficiarios"><div className="stat-icon"><UsersRound size={20} /></div><div><div className="stat-label">Beneficiários</div><div className="stat-value">{beneficiarios.length}</div></div></div>
        <div className="stat-card mod-projetos"><div className="stat-icon"><HeartHandshake size={20} /></div><div><div className="stat-label">Atendimentos</div><div className="stat-value">{beneficiarios.reduce((acc, b) => acc + b.atendimentos, 0)}</div></div></div>
        <div className="stat-card mod-documentos"><div className="stat-icon"><FileSignature size={20} /></div><div><div className="stat-label">Termos LGPD</div><div className="stat-value">{beneficiarios.filter((b) => b.termoLgpd).length}</div></div></div>
        <div className="stat-card mod-dashboard"><div className="stat-icon"><MapPin size={20} /></div><div><div className="stat-label">Comunidades</div><div className="stat-value">3</div></div></div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, comunidade ou projeto…" style={{ paddingLeft: 38 }} />
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Beneficiário</th><th>Tipo</th><th>Comunidade</th><th>Projeto</th><th>Atendimentos</th><th>LGPD</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filtrados.map((b) => (
                <tr key={b.id}>
                  <td><strong>{b.nome}</strong><div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{b.telefone}</div></td>
                  <td><span className="badge badge-blue">{tipoLabel[b.tipo]}</span></td>
                  <td>{b.comunidade}</td>
                  <td>{b.projeto}</td>
                  <td><strong>{b.atendimentos}</strong></td>
                  <td><span className={`badge ${b.termoLgpd ? 'badge-green' : 'badge-yellow'}`}>{b.termoLgpd ? 'Assinado' : 'Pendente'}</span></td>
                  <td><span className="badge badge-green">{b.status === 'ATIVO' ? 'Ativo' : 'Acompanhamento'}</span></td>
                  <td><button className="btn btn-ghost btn-icon btn-sm" onClick={() => remover(b.id)} title="Remover beneficiário"><Trash2 size={15} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
