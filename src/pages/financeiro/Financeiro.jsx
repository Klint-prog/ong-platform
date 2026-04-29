import { useState } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Plus, ArrowUpRight, ArrowDownRight, MoreHorizontal, Search } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts'

const TRANSACOES = [
  { id: 1, descricao: 'Doação — Maria Silva',         tipo: 'RECEITA',  valor: 500,   categoria: 'Doações',            data: '12/06/2025', status: 'CONFIRMADA' },
  { id: 2, descricao: 'Aluguel da sede — Junho',       tipo: 'DESPESA',  valor: 1800,  categoria: 'Aluguel',            data: '05/06/2025', status: 'CONFIRMADA' },
  { id: 3, descricao: 'Edital SETAS — Projeto Horta',  tipo: 'RECEITA',  valor: 8000,  categoria: 'Editais e Projetos', data: '01/06/2025', status: 'CONFIRMADA' },
  { id: 4, descricao: 'Material didático',             tipo: 'DESPESA',  valor: 340,   categoria: 'Materiais',          data: '10/06/2025', status: 'CONFIRMADA' },
  { id: 5, descricao: 'Patrocínio Empresa XYZ',        tipo: 'RECEITA',  valor: 3000,  categoria: 'Patrocínio',         data: '08/06/2025', status: 'PENDENTE' },
  { id: 6, descricao: 'Conta de energia',              tipo: 'DESPESA',  valor: 420,   categoria: 'Serviços',           data: '07/06/2025', status: 'CONFIRMADA' },
  { id: 7, descricao: 'Doação anônima',                tipo: 'RECEITA',  valor: 200,   categoria: 'Doações',            data: '06/06/2025', status: 'CONFIRMADA' },
]

const pizza = [
  { name: 'Doações',         value: 4200, cor: '#22c55e' },
  { name: 'Editais',         value: 8000, cor: '#3b82f6' },
  { name: 'Patrocínio',      value: 3000, cor: '#a855f7' },
  { name: 'Outros',          value: 600,  cor: '#eab308' },
]

const fluxo = [
  { mes: 'Jan', v: 3200 }, { mes: 'Fev', v: 4100 }, { mes: 'Mar', v: 1700 },
  { mes: 'Abr', v: 6500 }, { mes: 'Mai', v: 4000 }, { mes: 'Jun', v: 7400 },
]

export default function Financeiro() {
  const [filtro, setFiltro] = useState('TODOS')

  const filtradas = TRANSACOES.filter(t => filtro === 'TODOS' || t.tipo === filtro)
  const receitas = TRANSACOES.filter(t => t.tipo === 'RECEITA' && t.status === 'CONFIRMADA').reduce((s, t) => s + t.valor, 0)
  const despesas = TRANSACOES.filter(t => t.tipo === 'DESPESA' && t.status === 'CONFIRMADA').reduce((s, t) => s + t.valor, 0)

  const fmt = v => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

  return (
    <div className="mod-financeiro animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Financeiro</h1>
          <p className="page-subtitle">Receitas, despesas, doações e prestação de contas</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={16} /> Nova transação
        </button>
      </div>

      {/* Stats */}
      <div className="grid-3 animate-fade-up" style={{ marginBottom: 24 }}>
        <div className="stat-card mod-financeiro">
          <div className="stat-icon"><TrendingUp size={20} /></div>
          <div>
            <div className="stat-label">Receitas do mês</div>
            <div className="stat-value" style={{ fontSize: 22 }}>{fmt(receitas)}</div>
          </div>
          <div className="stat-trend up"><TrendingUp size={13} /> +18% vs maio</div>
        </div>
        <div className="stat-card mod-pessoas">
          <div className="stat-icon"><TrendingDown size={20} /></div>
          <div>
            <div className="stat-label">Despesas do mês</div>
            <div className="stat-value" style={{ fontSize: 22 }}>{fmt(despesas)}</div>
          </div>
          <div className="stat-trend down"><TrendingDown size={13} /> +5% vs maio</div>
        </div>
        <div className="stat-card mod-dashboard">
          <div className="stat-icon"><DollarSign size={20} /></div>
          <div>
            <div className="stat-label">Saldo atual</div>
            <div className="stat-value" style={{ fontSize: 22, color: receitas - despesas >= 0 ? 'var(--green-600)' : 'var(--red-600)' }}>
              {fmt(receitas - despesas)}
            </div>
          </div>
          <div className="stat-trend up"><TrendingUp size={13} /> Positivo</div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid-2 animate-fade-up delay-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--gray-800)', marginBottom: 4 }}>
            Saldo mensal
          </div>
          <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 20 }}>Resultado líquido — 2025</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={fluxo}>
              <defs>
                <linearGradient id="gSaldo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: 'var(--gray-400)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--gray-400)' }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => [fmt(v), 'Saldo']} contentStyle={{ borderRadius: 10, border: '1px solid var(--gray-100)', fontSize: 13 }} />
              <Area type="monotone" dataKey="v" stroke="#22c55e" strokeWidth={2.5} fill="url(#gSaldo)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--gray-800)', marginBottom: 4 }}>
            Receitas por origem
          </div>
          <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 20 }}>Distribuição — junho/2025</div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <ResponsiveContainer width={150} height={150}>
              <PieChart>
                <Pie data={pizza} cx="50%" cy="50%" innerRadius={42} outerRadius={65} dataKey="value" strokeWidth={0}>
                  {pizza.map((entry, i) => <Cell key={i} fill={entry.cor} />)}
                </Pie>
                <Tooltip formatter={v => [fmt(v)]} contentStyle={{ borderRadius: 10, fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              {pizza.map(p => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: p.cor, flexShrink: 0 }}/>
                  <span style={{ fontSize: 13, color: 'var(--gray-600)', flex: 1 }}>{p.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-800)' }}>{fmt(p.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Transações */}
      <div className="card animate-fade-up delay-3">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>Transações recentes</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['TODOS', 'RECEITA', 'DESPESA'].map(f => (
              <button key={f} onClick={() => setFiltro(f)}
                className={`btn btn-sm ${filtro === f ? 'btn-primary' : 'btn-outline'}`}
                style={filtro === f ? { '--mod-color': 'var(--green-500)' } : {}}>
                {f === 'TODOS' ? 'Todos' : f === 'RECEITA' ? 'Receitas' : 'Despesas'}
              </button>
            ))}
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Data</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map(t => (
                <tr key={t.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: t.tipo === 'RECEITA' ? 'var(--green-50)' : 'var(--red-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {t.tipo === 'RECEITA'
                          ? <ArrowUpRight size={15} color="var(--green-600)" />
                          : <ArrowDownRight size={15} color="var(--red-600)" />}
                      </div>
                      <span style={{ fontWeight: 500 }}>{t.descricao}</span>
                    </div>
                  </td>
                  <td><span className="badge badge-gray">{t.categoria}</span></td>
                  <td style={{ color: 'var(--gray-500)', fontSize: 13 }}>{t.data}</td>
                  <td>
                    <span className={`badge ${t.status === 'CONFIRMADA' ? 'badge-green' : 'badge-yellow'}`}>
                      {t.status === 'CONFIRMADA' ? 'Confirmada' : 'Pendente'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 14, color: t.tipo === 'RECEITA' ? 'var(--green-600)' : 'var(--red-600)' }}>
                    {t.tipo === 'RECEITA' ? '+' : '-'}{fmt(t.valor)}
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-icon btn-sm"><MoreHorizontal size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
