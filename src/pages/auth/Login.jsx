import { useState } from 'react'
import { Leaf, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'

export default function Login({ onLogin }) {
  const [showSenha, setShowSenha] = useState(false)
  const [form, setForm] = useState({ email: '', senha: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    // Simula login
    await new Promise(r => setTimeout(r, 900))
    setLoading(false)
    onLogin?.({ nome: 'Administrador', role: 'ADMIN', email: form.email })
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      background: 'var(--gray-50)',
    }}>
      {/* Painel esquerdo — visual */}
      <div style={{
        background: 'var(--gray-900)',
        display: 'flex',
        flexDirection: 'column',
        padding: '48px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Círculos decorativos */}
        {[
          { size: 340, top: -80,  left: -80,  color: 'var(--green-500)' },
          { size: 220, top: 200,  left: 180,  color: 'var(--blue-500)' },
          { size: 180, bottom: 40,right: -40, color: 'var(--lilac-500)' },
          { size: 130, bottom: 160,left: 60,  color: 'var(--pink-500)' },
        ].map((c, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: c.size, height: c.size,
            borderRadius: '50%',
            background: c.color,
            opacity: .12,
            top: c.top, left: c.left, bottom: c.bottom, right: c.right,
            filter: 'blur(40px)',
          }} />
        ))}

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #22c55e, #3b82f6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Leaf size={20} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#fff' }}>ONGPlatform</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', letterSpacing: 1, textTransform: 'uppercase' }}>Gestão Social</div>
          </div>
        </div>

        {/* Texto central */}
        <div style={{ marginTop: 'auto', marginBottom: 'auto', position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 38, fontWeight: 800, color: '#fff', lineHeight: 1.15, letterSpacing: -.5, marginBottom: 20 }}>
            Gerencie sua ONG<br />com eficiência<br />e transparência.
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,.5)', lineHeight: 1.7, maxWidth: 340 }}>
            Pessoas, projetos, financeiro e comunicação em uma plataforma única, open source e gratuita.
          </p>

          {/* Paleta de módulos */}
          <div style={{ display: 'flex', gap: 8, marginTop: 36 }}>
            {[
              { label: 'Pessoas',    cor: '#ec4899' },
              { label: 'Financeiro', cor: '#22c55e' },
              { label: 'Projetos',   cor: '#eab308' },
              { label: 'Comunic.',   cor: '#a855f7' },
              { label: 'Usuários',   cor: '#8b5cf6' },
            ].map(m => (
              <div key={m.label} style={{ background: m.cor + '22', border: `1px solid ${m.cor}44`, borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 600, color: m.cor }}>
                {m.label}
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé */}
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.2)', position: 'relative', zIndex: 1 }}>
          Open Source · MIT License
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <div style={{ width: '100%', maxWidth: 380 }} className="animate-fade-up">
          <div style={{ marginBottom: 40 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--gray-900)', letterSpacing: -.5, marginBottom: 8 }}>
              Entrar na plataforma
            </h1>
            <p style={{ fontSize: 14, color: 'var(--gray-400)' }}>
              Digite suas credenciais para acessar o painel
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="input-group">
              <label>E-mail</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                <input
                  type="email" required placeholder="seu@email.com"
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  style={{ paddingLeft: 40, '--mod-color': 'var(--green-500)' }}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Senha</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                <input
                  type={showSenha ? 'text' : 'password'} required placeholder="••••••••"
                  value={form.senha} onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                  style={{ paddingLeft: 40, paddingRight: 44, '--mod-color': 'var(--green-500)' }}
                />
                <button type="button" onClick={() => setShowSenha(s => !s)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)' }}>
                  {showSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg"
              style={{ '--mod-color': 'var(--green-500)', marginTop: 8, justifyContent: 'center', opacity: loading ? .7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
              disabled={loading}>
              {loading ? 'Entrando…' : <><ArrowRight size={16} /> Entrar</>}
            </button>
          </form>

          <div style={{ marginTop: 32, padding: 16, background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-100)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', marginBottom: 6 }}>Credenciais de teste</div>
            <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
              admin@suaong.org / admin123456
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
