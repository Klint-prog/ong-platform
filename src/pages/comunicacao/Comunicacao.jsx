import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Mail, FileText, Plus, Send, CheckCheck, Clock, AlertCircle, Info, Eye } from 'lucide-react'

const NOTIFICACOES = [
  { id: 1, titulo: 'Projeto concluído',      mensagem: 'O projeto "Saúde Rural" foi marcado como concluído.',      tipo: 'INFO',  lida: false, tempo: '5 min' },
  { id: 2, titulo: 'Meta atingida',           mensagem: 'Parabéns! A meta de 45 beneficiários do mês foi atingida.', tipo: 'INFO',  lida: false, tempo: '1h' },
  { id: 3, titulo: 'Pagamento vencendo',      mensagem: 'O aluguel da sede vence em 3 dias. Valor: R$ 1.800,00.',    tipo: 'AVISO', lida: true,  tempo: '3h' },
  { id: 4, titulo: 'Nova voluntária',         mensagem: 'Ana Beatriz foi cadastrada como voluntária.',                tipo: 'INFO',  lida: true,  tempo: '5h' },
  { id: 5, titulo: 'Relatório não enviado',   mensagem: 'O relatório mensal ao Ministério ainda não foi enviado.',   tipo: 'ALERTA',lida: false, tempo: '1d' },
]

const TEMPLATES = [
  { id: 1, nome: 'Boas-vindas',          assunto: 'Bem-vindo(a) à {{nomeOng}}!',       ativo: true,  usos: 34 },
  { id: 2, nome: 'Recibo de doação',     assunto: 'Recibo — doação de R$ {{valor}}',    ativo: true,  usos: 89 },
  { id: 3, nome: 'Convite para projeto', assunto: 'Você foi convidado(a): {{projeto}}',  ativo: true,  usos: 12 },
  { id: 4, nome: 'Lembrete de tarefa',   assunto: 'Tarefa pendente: {{tarefa}}',         ativo: false, usos: 7  },
]

const LOGS = [
  { id: 1, destinatario: 'maria@email.com',   assunto: 'Bem-vindo(a)!',         status: 'ENVIADO',  data: '12/06 14:22' },
  { id: 2, destinatario: 'joao@email.com',    assunto: 'Recibo — R$ 500,00',    status: 'ENVIADO',  data: '12/06 09:10' },
  { id: 3, destinatario: 'ana@email.com',     assunto: 'Bem-vindo(a)!',         status: 'ENVIADO',  data: '11/06 16:45' },
  { id: 4, destinatario: 'invalid@',          assunto: 'Lembrete de tarefa',    status: 'FALHOU',   data: '10/06 11:00' },
]

const tipoNotif = {
  INFO:   { icon: Info,         cor: 'var(--blue-500)',  badge: 'badge-blue' },
  AVISO:  { icon: AlertCircle,  cor: 'var(--yellow-500)',badge: 'badge-yellow' },
  ALERTA: { icon: AlertCircle,  cor: 'var(--red-500)',   badge: 'badge-red' },
}

export default function Comunicacao() {
  const [aba, setAba] = useState('notificacoes')
  const [templateVisualizando, setTemplateVisualizando] = useState(null)
  const navigate = useNavigate()

  const usarTemplate = (template) => {
    navigate('/comunicacao/novo', { state: { template } })
  }

  const criarTemplate = () => {
    navigate('/comunicacao/novo', { state: { criarTemplate: true } })
  }

  return (
    <div className="mod-comunicacao animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Comunicação</h1>
          <p className="page-subtitle">Notificações, e-mails e templates da plataforma</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/comunicacao/novo')}>
          <Plus size={16} /> Novo envio
        </button>
      </div>

      {/* Stats */}
      <div className="grid-3 animate-fade-up" style={{ marginBottom: 24 }}>
        {[
          { label: 'Notificações não lidas', value: '3',   mod: 'mod-comunicacao', icon: Bell },
          { label: 'E-mails enviados (mês)', value: '142', mod: 'mod-dashboard',   icon: Mail },
          { label: 'Templates ativos',       value: '3',   mod: 'mod-projetos',    icon: FileText },
        ].map(({ label, value, mod, icon: Icon }, i) => (
          <div key={label} className={`stat-card ${mod} delay-${i + 1}`}>
            <div className="stat-icon"><Icon size={20} /></div>
            <div>
              <div className="stat-label">{label}</div>
              <div className="stat-value">{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--gray-100)', padding: 4, borderRadius: 'var(--radius-md)', width: 'fit-content' }} className="animate-fade-up delay-2">
        {[
          { key: 'notificacoes', label: 'Notificações', icon: Bell },
          { key: 'templates',    label: 'Templates',    icon: FileText },
          { key: 'logs',         label: 'Logs de envio',icon: Mail },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setAba(key)}
            className={`btn btn-sm ${aba === key ? 'btn-primary' : 'btn-ghost'}`}
            style={aba === key ? { '--mod-color': 'var(--lilac-500)' } : {}}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Notificações */}
      {aba === 'notificacoes' && (
        <div className="card animate-fade-up delay-3">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>Notificações</div>
            <button className="btn btn-ghost btn-sm"><CheckCheck size={14} /> Marcar todas como lidas</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {NOTIFICACOES.map(n => {
              const cfg = tipoNotif[n.tipo]
              const Icon = cfg.icon
              return (
                <div key={n.id} style={{ display: 'flex', gap: 14, padding: '14px 16px', borderRadius: 'var(--radius-md)', background: n.lida ? 'transparent' : 'var(--lilac-50)', border: `1px solid ${n.lida ? 'var(--gray-100)' : 'var(--lilac-100)'}`, alignItems: 'flex-start' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: cfg.cor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={16} color={cfg.cor} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--gray-800)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {n.titulo}
                      {!n.lida && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--lilac-500)', display: 'inline-block' }} />}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 3 }}>{n.mensagem}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                    <span className={`badge ${cfg.badge}`} style={{ fontSize: 10 }}>{n.tipo}</span>
                    <span style={{ fontSize: 11, color: 'var(--gray-400)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={10} /> {n.tempo} atrás
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Templates */}
      {aba === 'templates' && (
        <div className="grid-2 animate-fade-up delay-3">
          {TEMPLATES.map(t => (
            <div key={t.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--gray-800)' }}>{t.nome}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>{t.assunto}</div>
                </div>
                <span className={`badge ${t.ativo ? 'badge-green' : 'badge-gray'}`}>
                  {t.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{t.usos} envios realizados</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-outline btn-sm" onClick={() => setTemplateVisualizando(t)}><Eye size={13} /> Visualizar</button>
                <button className="btn btn-primary btn-sm" style={{ '--mod-color': 'var(--lilac-500)' }} onClick={() => usarTemplate(t)}>
                  <Send size={13} /> Usar template
                </button>
              </div>
            </div>
          ))}
          <div className="card" onClick={criarTemplate} style={{ border: '2px dashed var(--gray-200)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 140, cursor: 'pointer' }}>
            <div style={{ textAlign: 'center', color: 'var(--gray-400)' }}>
              <Plus size={24} style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: 14, fontWeight: 500 }}>Novo template</div>
            </div>
          </div>
        </div>
      )}

      {templateVisualizando && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(17, 24, 39, 0.45)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card" style={{ width: 'min(560px, 100%)', display: 'grid', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, margin: 0 }}>{templateVisualizando.nome}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setTemplateVisualizando(null)}>Fechar</button>
            </div>
            <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
              <strong>Assunto:</strong> {templateVisualizando.assunto}
            </div>
            <div style={{ fontSize: 13, color: 'var(--gray-600)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', padding: 14 }}>
              Corpo sugerido do template <strong>{templateVisualizando.nome}</strong>. Use as variáveis no conteúdo da mensagem durante a edição.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-outline btn-sm" onClick={() => setTemplateVisualizando(null)}>Cancelar</button>
              <button className="btn btn-primary btn-sm" style={{ '--mod-color': 'var(--lilac-500)' }} onClick={() => usarTemplate(templateVisualizando)}>
                <Send size={13} /> Usar template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logs */}
      {aba === 'logs' && (
        <div className="card animate-fade-up delay-3">
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Logs de envio de e-mail</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Destinatário</th>
                  <th>Assunto</th>
                  <th>Data</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {LOGS.map(l => (
                  <tr key={l.id}>
                    <td style={{ fontWeight: 500 }}>{l.destinatario}</td>
                    <td style={{ color: 'var(--gray-500)' }}>{l.assunto}</td>
                    <td style={{ color: 'var(--gray-400)', fontSize: 13 }}>{l.data}</td>
                    <td>
                      <span className={`badge ${l.status === 'ENVIADO' ? 'badge-green' : 'badge-red'}`}>
                        {l.status === 'ENVIADO' ? <CheckCheck size={10} /> : <AlertCircle size={10} />}
                        {l.status === 'ENVIADO' ? 'Enviado' : 'Falhou'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
