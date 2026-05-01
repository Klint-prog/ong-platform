import { useMemo, useState } from 'react'
import {
  Users, Plus, Shield, UserCog, Eye, CheckCircle, XCircle,
  LockKeyhole, Save, Settings2, Search, Crown, ClipboardCheck,
  UserCheck, HandCoins, FileText, BarChart3, FolderKanban, Heart,
  DollarSign, Bell, Building2, ScanLine
} from 'lucide-react'

const MODULOS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, descricao: 'Indicadores gerais da organização' },
  { id: 'institucional', label: 'Institucional', icon: Building2, descricao: 'Dados da ONG, diretoria, certidões e conformidade' },
  { id: 'projetos', label: 'Projetos', icon: FolderKanban, descricao: 'Projetos, atividades, metas e cronogramas' },
  { id: 'beneficiarios', label: 'Beneficiários', icon: Heart, descricao: 'Famílias, pessoas atendidas e termos LGPD' },
  { id: 'pessoas', label: 'Pessoas', icon: Users, descricao: 'Membros, voluntários, doadores e equipe' },
  { id: 'financeiro', label: 'Financeiro', icon: DollarSign, descricao: 'Receitas, despesas, contas e comprovantes' },
  { id: 'captacao', label: 'Captação', icon: HandCoins, descricao: 'Editais, oportunidades e propostas' },
  { id: 'documentos', label: 'Documentos', icon: FileText, descricao: 'Arquivos, recibos, certidões e evidências' },
  { id: 'relatorios', label: 'Relatórios', icon: BarChart3, descricao: 'Relatórios gerenciais, impacto e prestação de contas' },
  { id: 'comunicacao', label: 'Comunicação', icon: Bell, descricao: 'Comunicados, e-mails e notificações' },
  { id: 'notasPaulista', label: 'Notas Paulista', icon: ScanLine, descricao: 'Scanner e registros de notas fiscais' },
  { id: 'usuarios', label: 'Usuários', icon: Shield, descricao: 'Contas, papéis e permissões de acesso' },
]

const ACOES = [
  { id: 'visualizar', label: 'Ver' },
  { id: 'criar', label: 'Criar' },
  { id: 'editar', label: 'Editar' },
  { id: 'excluir', label: 'Excluir' },
  { id: 'aprovar', label: 'Aprovar' },
  { id: 'exportar', label: 'Exportar' },
]

const roleConfig = {
  ADMIN: {
    label: 'Administrador',
    badge: 'badge-purple',
    icon: Shield,
    resumo: 'Acesso total, incluindo usuários, finanças, exclusões, aprovações e configurações.',
    permissoes: ['visualizar', 'criar', 'editar', 'excluir', 'aprovar', 'exportar'],
  },
  DIRETORIA: {
    label: 'Diretoria',
    badge: 'badge-blue',
    icon: Crown,
    resumo: 'Acesso amplo para acompanhamento, aprovação, relatórios e gestão institucional.',
    permissoes: ['visualizar', 'criar', 'editar', 'aprovar', 'exportar'],
  },
  FINANCEIRO: {
    label: 'Financeiro',
    badge: 'badge-green',
    icon: DollarSign,
    resumo: 'Acesso completo ao financeiro, prestação de contas, comprovantes e relatórios financeiros.',
    permissoes: ['visualizar', 'criar', 'editar', 'aprovar', 'exportar'],
  },
  COORDENADOR: {
    label: 'Coordenador',
    badge: 'badge-blue',
    icon: UserCog,
    resumo: 'Gerencia projetos, beneficiários, pessoas, documentos e relatórios dos projetos vinculados.',
    permissoes: ['visualizar', 'criar', 'editar', 'exportar'],
  },
  CONSELHO: {
    label: 'Conselho fiscal',
    badge: 'badge-yellow',
    icon: ClipboardCheck,
    resumo: 'Visualiza financeiro, documentos e relatórios; pode validar prestação de contas.',
    permissoes: ['visualizar', 'aprovar', 'exportar'],
  },
  VOLUNTARIO: {
    label: 'Voluntário',
    badge: 'badge-pink',
    icon: UserCheck,
    resumo: 'Acesso operacional restrito para registrar atividades, pessoas atendidas e evidências.',
    permissoes: ['visualizar', 'criar'],
  },
  VISUALIZADOR: {
    label: 'Visualizador',
    badge: 'badge-gray',
    icon: Eye,
    resumo: 'Somente leitura em módulos liberados, sem criar, editar, excluir ou aprovar registros.',
    permissoes: ['visualizar'],
  },
}

const acessosPorPapel = {
  ADMIN: MODULOS.reduce((acc, modulo) => ({ ...acc, [modulo.id]: roleConfig.ADMIN.permissoes }), {}),
  DIRETORIA: {
    dashboard: ['visualizar', 'exportar'],
    institucional: ['visualizar', 'criar', 'editar', 'aprovar', 'exportar'],
    projetos: ['visualizar', 'criar', 'editar', 'aprovar', 'exportar'],
    beneficiarios: ['visualizar', 'exportar'],
    pessoas: ['visualizar', 'exportar'],
    financeiro: ['visualizar', 'aprovar', 'exportar'],
    captacao: ['visualizar', 'criar', 'editar', 'aprovar', 'exportar'],
    documentos: ['visualizar', 'aprovar', 'exportar'],
    relatorios: ['visualizar', 'criar', 'exportar'],
    comunicacao: ['visualizar', 'criar', 'editar'],
    notasPaulista: ['visualizar', 'exportar'],
    usuarios: ['visualizar'],
  },
  FINANCEIRO: {
    dashboard: ['visualizar'],
    institucional: ['visualizar'],
    projetos: ['visualizar'],
    beneficiarios: [],
    pessoas: ['visualizar'],
    financeiro: ['visualizar', 'criar', 'editar', 'aprovar', 'exportar'],
    captacao: ['visualizar', 'exportar'],
    documentos: ['visualizar', 'criar', 'editar', 'aprovar', 'exportar'],
    relatorios: ['visualizar', 'criar', 'exportar'],
    comunicacao: [],
    notasPaulista: ['visualizar', 'criar', 'editar', 'exportar'],
    usuarios: [],
  },
  COORDENADOR: {
    dashboard: ['visualizar'],
    institucional: ['visualizar'],
    projetos: ['visualizar', 'criar', 'editar', 'exportar'],
    beneficiarios: ['visualizar', 'criar', 'editar', 'exportar'],
    pessoas: ['visualizar', 'criar', 'editar'],
    financeiro: ['visualizar'],
    captacao: ['visualizar', 'criar', 'editar'],
    documentos: ['visualizar', 'criar', 'editar', 'exportar'],
    relatorios: ['visualizar', 'criar', 'exportar'],
    comunicacao: ['visualizar', 'criar'],
    notasPaulista: [],
    usuarios: [],
  },
  CONSELHO: {
    dashboard: ['visualizar'],
    institucional: ['visualizar', 'exportar'],
    projetos: ['visualizar', 'exportar'],
    beneficiarios: [],
    pessoas: [],
    financeiro: ['visualizar', 'aprovar', 'exportar'],
    captacao: ['visualizar', 'exportar'],
    documentos: ['visualizar', 'aprovar', 'exportar'],
    relatorios: ['visualizar', 'aprovar', 'exportar'],
    comunicacao: [],
    notasPaulista: ['visualizar', 'exportar'],
    usuarios: [],
  },
  VOLUNTARIO: {
    dashboard: ['visualizar'],
    institucional: [],
    projetos: ['visualizar'],
    beneficiarios: ['visualizar', 'criar'],
    pessoas: ['visualizar'],
    financeiro: [],
    captacao: [],
    documentos: ['visualizar', 'criar'],
    relatorios: [],
    comunicacao: ['visualizar'],
    notasPaulista: [],
    usuarios: [],
  },
  VISUALIZADOR: {
    dashboard: ['visualizar'],
    institucional: ['visualizar'],
    projetos: ['visualizar'],
    beneficiarios: [],
    pessoas: [],
    financeiro: [],
    captacao: [],
    documentos: ['visualizar'],
    relatorios: ['visualizar'],
    comunicacao: [],
    notasPaulista: [],
    usuarios: [],
  },
}

const usuariosSeed = [
  { id: 1, nome: 'Admin Geral', email: 'admin@suaong.org', role: 'ADMIN', ativo: true, login: 'Hoje, 09:12', inicial: 'AG', cor: '#7c3aed', acessosExtras: {} },
  { id: 2, nome: 'Clara Andrade', email: 'clara@ong.org', role: 'COORDENADOR', ativo: true, login: 'Hoje, 08:45', inicial: 'CA', cor: '#3b82f6', acessosExtras: { financeiro: ['visualizar', 'exportar'] } },
  { id: 3, nome: 'Paulo Ferreira', email: 'paulo@ong.org', role: 'VOLUNTARIO', ativo: true, login: 'Ontem, 17:30', inicial: 'PF', cor: '#ec4899', acessosExtras: { projetos: ['visualizar', 'criar'], documentos: ['visualizar', 'criar', 'editar'] } },
  { id: 4, nome: 'Beatriz Souza', email: 'bea@ong.org', role: 'FINANCEIRO', ativo: true, login: 'Ontem, 14:00', inicial: 'BS', cor: '#22c55e', acessosExtras: {} },
  { id: 5, nome: 'Marcos Lima', email: 'marcos@ong.org', role: 'VISUALIZADOR', ativo: false, login: 'Há 15 dias', inicial: 'ML', cor: '#9d9a8e', acessosExtras: {} },
  { id: 6, nome: 'Sofia Ramos', email: 'sofia@ong.org', role: 'CONSELHO', ativo: true, login: 'Há 2 dias', inicial: 'SR', cor: '#eab308', acessosExtras: {} },
]

const mesclarAcessos = (role, extras = {}) => {
  const base = acessosPorPapel[role] || {}
  return MODULOS.reduce((acc, modulo) => {
    const permissoes = new Set([...(base[modulo.id] || []), ...(extras[modulo.id] || [])])
    acc[modulo.id] = Array.from(permissoes)
    return acc
  }, {})
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState(usuariosSeed)
  const [filtro, setFiltro] = useState('TODOS')
  const [busca, setBusca] = useState('')
  const [selecionadoId, setSelecionadoId] = useState(usuariosSeed[0].id)

  const selecionado = usuarios.find((u) => u.id === selecionadoId) || usuarios[0]
  const acessosEfetivos = mesclarAcessos(selecionado.role, selecionado.acessosExtras)

  const filtrados = useMemo(() => usuarios.filter((u) => {
    const matchFiltro = filtro === 'TODOS' || u.role === filtro
    const termo = busca.toLowerCase()
    const matchBusca = u.nome.toLowerCase().includes(termo) || u.email.toLowerCase().includes(termo)
    return matchFiltro && matchBusca
  }), [usuarios, filtro, busca])

  const trocarPapel = (role) => {
    setUsuarios((atuais) => atuais.map((u) => (
      u.id === selecionado.id ? { ...u, role, acessosExtras: {} } : u
    )))
  }

  const alternarPermissaoExtra = (moduloId, acaoId) => {
    const baseTem = (acessosPorPapel[selecionado.role]?.[moduloId] || []).includes(acaoId)
    if (baseTem) return

    setUsuarios((atuais) => atuais.map((u) => {
      if (u.id !== selecionado.id) return u

      const atuaisModulo = new Set(u.acessosExtras?.[moduloId] || [])
      if (atuaisModulo.has(acaoId)) atuaisModulo.delete(acaoId)
      else atuaisModulo.add(acaoId)

      return {
        ...u,
        acessosExtras: {
          ...u.acessosExtras,
          [moduloId]: Array.from(atuaisModulo),
        },
      }
    }))
  }

  const totalModulosLiberados = Object.values(acessosEfetivos).filter((permissoes) => permissoes.length > 0).length
  const totalExtras = Object.values(selecionado.acessosExtras || {}).reduce((acc, permissoes) => acc + permissoes.length, 0)

  return (
    <div className="mod-usuarios animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Usuários e Permissões</h1>
          <p className="page-subtitle">Defina o que cada usuário acessa e eleve permissões específicas quando necessário</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={16} /> Novo usuário
        </button>
      </div>

      <div className="grid-4 animate-fade-up" style={{ marginBottom: 24 }}>
        <Stat label="Total de usuários" value={String(usuarios.length)} mod="mod-usuarios" icon={Users} />
        <Stat label="Administradores" value={String(usuarios.filter((u) => u.role === 'ADMIN').length)} mod="mod-comunicacao" icon={Shield} />
        <Stat label="Usuários ativos" value={String(usuarios.filter((u) => u.ativo).length)} mod="mod-financeiro" icon={CheckCircle} />
        <Stat label="Permissões elevadas" value={String(usuarios.reduce((acc, u) => acc + Object.values(u.acessosExtras || {}).reduce((s, p) => s + p.length, 0), 0))} mod="mod-projetos" icon={LockKeyhole} />
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <section className="card animate-fade-up delay-2">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 18 }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>Lista de usuários</h2>
              <p style={{ fontSize: 13, color: 'var(--gray-400)' }}>Selecione um usuário para editar acessos</p>
            </div>
            <select value={filtro} onChange={(e) => setFiltro(e.target.value)} style={{ maxWidth: 190 }}>
              {['TODOS', ...Object.keys(roleConfig)].map((role) => (
                <option key={role} value={role}>{role === 'TODOS' ? 'Todos os papéis' : roleConfig[role].label}</option>
              ))}
            </select>
          </div>

          <div style={{ position: 'relative', marginBottom: 16 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou e-mail…" style={{ paddingLeft: 38 }} />
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            {filtrados.map((u) => {
              const cfg = roleConfig[u.role]
              const Icon = cfg.icon
              const active = u.id === selecionado.id
              const extras = Object.values(u.acessosExtras || {}).reduce((acc, permissoes) => acc + permissoes.length, 0)

              return (
                <button
                  key={u.id}
                  onClick={() => setSelecionadoId(u.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
                    padding: 12, borderRadius: 'var(--radius-md)', border: `1.5px solid ${active ? 'var(--purple-500)' : 'var(--gray-100)'}`,
                    background: active ? 'var(--purple-50)' : 'var(--gray-0)', cursor: 'pointer'
                  }}
                >
                  <div className="avatar avatar-md" style={{ background: u.cor }}>{u.inicial}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <strong style={{ color: 'var(--gray-800)' }}>{u.nome}</strong>
                      <span className={`badge ${cfg.badge}`}><Icon size={11} /> {cfg.label}</span>
                      {extras > 0 && <span className="badge badge-yellow">+{extras} extras</span>}
                    </div>
                    <div style={{ color: 'var(--gray-400)', fontSize: 12 }}>{u.email} • último acesso: {u.login}</div>
                  </div>
                  <span className={`badge ${u.ativo ? 'badge-green' : 'badge-gray'}`}>
                    {u.ativo ? <CheckCircle size={10} /> : <XCircle size={10} />}
                    {u.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="card animate-fade-up delay-3">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 18 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div className="avatar avatar-lg" style={{ background: selecionado.cor }}>{selecionado.inicial}</div>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>{selecionado.nome}</h2>
                <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>{selecionado.email}</p>
              </div>
            </div>
            <button className="btn btn-primary"><Save size={15} /> Salvar acessos</button>
          </div>

          <div className="grid-3" style={{ marginBottom: 18 }}>
            <MiniInfo label="Papel atual" value={roleConfig[selecionado.role].label} />
            <MiniInfo label="Módulos liberados" value={`${totalModulosLiberados}/${MODULOS.length}`} />
            <MiniInfo label="Acessos extras" value={String(totalExtras)} />
          </div>

          <div className="card-sm" style={{ background: 'var(--purple-50)', border: '1px solid var(--purple-100)', marginBottom: 18 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <Settings2 size={18} color="var(--purple-600)" />
              <div>
                <strong style={{ color: 'var(--purple-700)' }}>Perfil de acesso</strong>
                <p style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 4 }}>{roleConfig[selecionado.role].resumo}</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
            <label>Elevar ou alterar papel do usuário</label>
            <select value={selecionado.role} onChange={(e) => trocarPapel(e.target.value)}>
              {Object.entries(roleConfig).map(([role, cfg]) => <option key={role} value={role}>{cfg.label}</option>)}
            </select>
            <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>Ao trocar o papel, os acessos extras são limpos para evitar permissões herdadas indevidas.</p>
          </div>

          <PermissionMatrix usuario={selecionado} acessosEfetivos={acessosEfetivos} onToggle={alternarPermissaoExtra} />
        </section>
      </div>
    </div>
  )
}

function Stat({ label, value, mod, icon: Icon }) {
  return (
    <div className={`stat-card ${mod}`}>
      <div className="stat-icon"><Icon size={20} /></div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
      </div>
    </div>
  )
}

function MiniInfo({ label, value }) {
  return (
    <div className="card-sm" style={{ background: 'var(--gray-50)' }}>
      <div style={{ fontSize: 11, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '.6px', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--gray-900)', marginTop: 2 }}>{value}</div>
    </div>
  )
}

function PermissionMatrix({ usuario, acessosEfetivos, onToggle }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17 }}>Matriz de acesso</h3>
          <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>Campos marcados em roxo são permissões extras elevadas para este usuário.</p>
        </div>
        <span className="badge badge-purple"><LockKeyhole size={11} /> RBAC</span>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Módulo</th>
              {ACOES.map((acao) => <th key={acao.id} style={{ textAlign: 'center' }}>{acao.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {MODULOS.map((modulo) => {
              const Icon = modulo.icon
              const base = acessosPorPapel[usuario.role]?.[modulo.id] || []
              const extras = usuario.acessosExtras?.[modulo.id] || []
              const efetivas = acessosEfetivos[modulo.id] || []

              return (
                <tr key={modulo.id}>
                  <td style={{ minWidth: 220 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--purple-50)', color: 'var(--purple-600)' }}>
                        <Icon size={15} />
                      </div>
                      <div>
                        <strong>{modulo.label}</strong>
                        <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{modulo.descricao}</div>
                      </div>
                    </div>
                  </td>
                  {ACOES.map((acao) => {
                    const checked = efetivas.includes(acao.id)
                    const isBase = base.includes(acao.id)
                    const isExtra = extras.includes(acao.id)

                    return (
                      <td key={acao.id} style={{ textAlign: 'center' }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: isBase ? 'not-allowed' : 'pointer' }} title={isBase ? 'Permissão herdada do papel' : 'Permissão extra individual'}>
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={isBase}
                            onChange={() => onToggle(modulo.id, acao.id)}
                            style={{ width: 16, height: 16, accentColor: isExtra ? 'var(--purple-500)' : 'var(--green-500)' }}
                          />
                        </label>
                        {isBase && <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>perfil</div>}
                        {isExtra && <div style={{ fontSize: 10, color: 'var(--purple-600)', fontWeight: 700 }}>extra</div>}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
