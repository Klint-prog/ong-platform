import { ArrowLeft, Save } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function CadastroEntity({ titulo, subtitulo, campos, cor = 'var(--blue-500)', initialValues = {}, onSave }) {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialValues)

  const handleSave = () => {
    if (onSave) {
      onSave(form)
      return
    }
    navigate(-1)
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">{titulo}</h1>
          <p className="page-subtitle">{subtitulo}</p>
        </div>
        <button className="btn btn-outline" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Voltar
        </button>
      </div>

      <div className="card" style={{ maxWidth: 760 }}>
        <div style={{ display: 'grid', gap: 14 }}>
          {campos.map((campo) => (
            <label key={campo.name} style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>{campo.label}</span>
              {campo.type === 'textarea' ? (
                <textarea rows={4} placeholder={campo.placeholder} value={form[campo.name] || ''} onChange={e => setForm(prev => ({ ...prev, [campo.name]: e.target.value }))} />
              ) : (
                <input type={campo.type || 'text'} placeholder={campo.placeholder} value={form[campo.name] || ''} onChange={e => setForm(prev => ({ ...prev, [campo.name]: e.target.value }))} />
              )}
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
          <button className="btn btn-primary" style={{ '--mod-color': cor }} onClick={handleSave}>
            <Save size={15} /> Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
