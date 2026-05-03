import { useMemo, useState } from 'react'
import { CheckCircle2, MailWarning, Save } from 'lucide-react'
import { getEmailConfig, getEmailConfigStatus, saveEmailConfig } from './emailConfigStorage'

export default function Configuracoes() {
  const [form, setForm] = useState(() => getEmailConfig())
  const [salvo, setSalvo] = useState(false)
  const status = useMemo(() => getEmailConfigStatus(), [form, salvo])

  function handleChange(key, value) {
    setSalvo(false)
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function salvar(e) {
    e.preventDefault()
    saveEmailConfig(form)
    setSalvo(true)
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Configurações de e-mail</h1>
          <p className="page-subtitle">Configure SMTP, POP3 ou IMAP para integrar o envio da aba Comunicação.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18, borderLeft: `4px solid ${status.conectado ? 'var(--green-500)' : 'var(--yellow-500)'}` }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 600 }}>
          {status.conectado ? <CheckCircle2 size={16} color="var(--green-500)" /> : <MailWarning size={16} color="var(--yellow-500)" />}
          {status.conectado ? 'Conexão de e-mail pronta para uso' : 'Complete os dados para habilitar o envio de e-mail'}
        </div>
      </div>

      <form className="card" onSubmit={salvar} style={{ display: 'grid', gap: 14, maxWidth: 760 }}>
        <div>
          <label>Protocolo</label>
          <select value={form.protocolo} onChange={(e) => handleChange('protocolo', e.target.value)}>
            <option>SMTP</option>
            <option>POP3</option>
            <option>IMAP</option>
          </select>
        </div>
        <div className="grid-2">
          <div><label>Host</label><input value={form.host} onChange={(e) => handleChange('host', e.target.value)} placeholder="smtp.gmail.com" /></div>
          <div><label>Porta</label><input value={form.porta} onChange={(e) => handleChange('porta', e.target.value)} placeholder="587" /></div>
        </div>
        <div className="grid-2">
          <div><label>Usuário</label><input value={form.usuario} onChange={(e) => handleChange('usuario', e.target.value)} placeholder="usuario@email.com" /></div>
          <div><label>Senha</label><input type="password" value={form.senha} onChange={(e) => handleChange('senha', e.target.value)} placeholder="••••••••" /></div>
        </div>
        <div className="grid-2">
          <div><label>Nome do remetente</label><input value={form.remetenteNome} onChange={(e) => handleChange('remetenteNome', e.target.value)} placeholder="ONG Exemplo" /></div>
          <div><label>E-mail do remetente</label><input type="email" value={form.remetenteEmail} onChange={(e) => handleChange('remetenteEmail', e.target.value)} placeholder="contato@ong.org" /></div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
          <input type="checkbox" checked={form.usarSSL} onChange={(e) => handleChange('usarSSL', e.target.checked)} /> Usar SSL/TLS
        </label>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-primary" type="submit"><Save size={14} /> Salvar configurações</button>
          {salvo && <span style={{ fontSize: 13, color: 'var(--green-600)' }}>Configurações salvas com sucesso.</span>}
        </div>
      </form>
    </div>
  )
}
