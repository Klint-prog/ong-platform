import { useState } from 'react'
import { Leaf, Mail, Lock, ArrowRight, AlertTriangle } from 'lucide-react'
import { autenticarUsuario } from '../../services/authPermissions'

export default function LoginRbac({ onLogin }) {
  const [form, setForm] = useState({ email: '', senha: '' })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setErro('')
    const resultado = autenticarUsuario(form.email, form.senha)
    setLoading(false)
    if (!resultado.ok) return setErro(resultado.erro)
    onLogin?.(resultado.usuario)
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'var(--gray-50)' }}>
      <div style={{ background: 'var(--gray-900)', display: 'flex', flexDirection: 'column', padding: 48, position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #22c55e, #3b82f6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Leaf size={20} color="#fff" strokeWidth={2.5} /></div>
          <div><div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#fff' }}>ONGPlatform</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', letterSpacing: 1, textTransform: 'uppercase' }}>Gestão Social</div></div>
        </div>
        <div style={{ marginTop: 'auto', marginBottom: 'auto', position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 38, fontWeight: 800, color: '#fff', lineHeight: 1.15, letterSpacing: -.5, marginBottom: 20 }}>Gestão com acesso<br />controlado, rastreável<br />e segura.</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,.5)', lineHeight: 1.7, maxWidth: 360 }}>Usuários, papéis e permissões por módulo para operação, diretoria, financeiro e conselho fiscal.</p>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.2)', position: 'relative', zIndex: 1 }}>Open Source · MIT License</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <div style={{ width: '100%', maxWidth: 380 }} className="animate-fade-up">
          <div style={{ marginBottom: 40 }}><h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--gray-900)', letterSpacing: -.5, marginBottom: 8 }}>Entrar na plataforma</h1><p style={{ fontSize: 14, color: 'var(--gray-400)' }}>Use uma conta cadastrada em Usuários e Permissões.</p></div>
          {erro && <div className="badge badge-red" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 16, padding: 12 }}><AlertTriangle size={14} /> {erro}</div>}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="input-group"><label>E-mail</label><div style={{ position: 'relative' }}><Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} /><input type="email" required placeholder="seu@email.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} style={{ paddingLeft: 40, '--mod-color': 'var(--green-500)' }} /></div></div>
            <div className="input-group"><label>Senha</label><div style={{ position: 'relative' }}><Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} /><input type="password" required placeholder="••••••••" value={form.senha} onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))} style={{ paddingLeft: 40, '--mod-color': 'var(--green-500)' }} /></div></div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ '--mod-color': 'var(--green-500)', marginTop: 8, justifyContent: 'center', opacity: loading ? .7 : 1 }} disabled={loading}>{loading ? 'Entrando…' : <><ArrowRight size={16} /> Entrar</>}</button>
          </form>
        </div>
      </div>
    </div>
  )
}
