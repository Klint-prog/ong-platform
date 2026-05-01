import { useState } from 'react'
import { ArrowLeft, Save, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function TagInput({ label, placeholder, defaultTags = [] }) {
  const [tagValue, setTagValue] = useState('')
  const [tags, setTags] = useState(defaultTags)

  const addTag = () => {
    const novaTag = tagValue.trim()
    if (!novaTag || tags.includes(novaTag)) return
    setTags([...tags, novaTag])
    setTagValue('')
  }

  const removeTag = (tag) => setTags(tags.filter(t => t !== tag))

  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>{label}</span>
      <div style={{ border: '1.5px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', padding: 8, background: '#fff' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: tags.length ? 8 : 0 }}>
          {tags.map(tag => (
            <span key={tag} className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="btn btn-ghost btn-icon btn-sm" style={{ padding: 0, width: 14, height: 14 }}>
                <X size={10} />
              </button>
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={tagValue}
            placeholder={placeholder || 'Digite uma tag e pressione Enter'}
            onChange={(e) => setTagValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addTag()
              }
            }}
          />
          <button type="button" className="btn btn-outline btn-sm" onClick={addTag}>Adicionar</button>
        </div>
      </div>
    </label>
  )
}

export default function CadastroEntity({ titulo, subtitulo, campos, cor = 'var(--blue-500)' }) {
  const navigate = useNavigate()

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
            campo.type === 'tags' ? (
              <TagInput key={campo.name} label={campo.label} placeholder={campo.placeholder} defaultTags={campo.defaultTags || []} />
            ) : (
              <label key={campo.name} style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>{campo.label}</span>
                {campo.type === 'textarea' ? (
                  <textarea rows={4} placeholder={campo.placeholder} />
                ) : (
                  <input type={campo.type || 'text'} placeholder={campo.placeholder} defaultValue={campo.defaultValue} />
                )}
              </label>
            )
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
          <button className="btn btn-primary" style={{ '--mod-color': cor }}>
            <Save size={15} /> Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
