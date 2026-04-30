import { useMemo, useState } from 'react'
import { QrCode, Hand, Landmark, Send, Trash2 } from 'lucide-react'

const STORAGE_KEY = 'nfp_scans'

const seed = [
  {
    id: 1,
    codigo: '35260412345678000112550010001234567890123456',
    chaveAcesso: '35260412345678000112550010001234567890123456',
    estabelecimento: 'Supermercado Exemplo',
    valor: 187.34,
    enviado: true,
    dataHora: '2026-04-30T10:15:00.000Z',
  },
]

function parseNotaQr(raw) {
  const clean = raw.trim()
  if (!clean) return null

  let chaveAcesso = clean.replace(/\D/g, '').slice(0, 44)
  if (clean.startsWith('http')) {
    try {
      const url = new URL(clean)
      const p = url.searchParams.get('p')
      if (p) {
        const first = p.split('|')[0]
        if (first) chaveAcesso = first.replace(/\D/g, '').slice(0, 44)
      }
    } catch {
      // leitura manual inválida: mantemos fallback por dígitos
    }
  }

  if (chaveAcesso.length < 44) return null

  return {
    chaveAcesso,
    codigo: chaveAcesso,
    estabelecimento: 'Aguardando conciliação',
    valor: Number((Math.random() * 300 + 10).toFixed(2)),
    enviado: true,
    dataHora: new Date().toISOString(),
  }
}

export default function NotasPaulista() {
  const [entradaScanner, setEntradaScanner] = useState('')
  const [scans, setScans] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : seed
  })
  const [erro, setErro] = useState('')

  const persist = (next) => {
    setScans(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const registrarScan = () => {
    const parsed = parseNotaQr(entradaScanner)
    if (!parsed) {
      setErro('QR Code inválido. Use a URL/QR da NFC-e com chave de 44 dígitos.')
      return
    }

    const duplicada = scans.some((s) => s.chaveAcesso === parsed.chaveAcesso)
    if (duplicada) {
      setErro('Esta nota já foi registrada no painel.')
      return
    }

    const novaNota = { ...parsed, id: Date.now() }
    persist([novaNota, ...scans])
    setEntradaScanner('')
    setErro('')
  }

  const removerTudo = () => {
    persist([])
  }

  const resumo = useMemo(() => {
    const total = scans.length
    const enviadas = scans.filter((s) => s.enviado).length
    const valorNotas = scans.reduce((acc, s) => acc + (s.valor || 0), 0)

    return { total, enviadas, valorNotas }
  }, [scans])

  return (
    <div className="mod-financeiro animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Módulo Nota Fiscal Paulista</h1>
          <p className="page-subtitle">Integração com scanner de mão para envio e acompanhamento das notas fiscais</p>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="stat-card mod-financeiro">
          <div className="stat-icon"><QrCode size={20} /></div>
          <div><div className="stat-label">Notas escaneadas</div><div className="stat-value">{resumo.total}</div></div>
        </div>
        <div className="stat-card mod-dashboard">
          <div className="stat-icon"><Landmark size={20} /></div>
          <div><div className="stat-label">Enviadas ao sistema</div><div className="stat-value">{resumo.enviadas}</div></div>
        </div>
        <div className="stat-card mod-projetos">
          <div className="stat-icon"><Send size={20} /></div>
          <div><div className="stat-label">Valor estimado de notas</div><div className="stat-value">R$ {resumo.valorNotas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div></div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Hand size={16} />
          <strong>Leitura do scanner de mão</strong>
        </div>
        <p style={{ color: 'var(--gray-500)', fontSize: 13, marginBottom: 12 }}>
          Conecte o scanner no modo teclado (HID), leia o QR Code da nota e cole/insira abaixo para registrar.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={entradaScanner}
            onChange={(e) => setEntradaScanner(e.target.value)}
            placeholder="Cole a URL do QR da NFC-e ou a chave de acesso"
          />
          <button className="btn btn-primary" onClick={registrarScan}>Registrar</button>
          <button className="btn btn-outline" onClick={removerTudo}><Trash2 size={15} /> Limpar</button>
        </div>
        {erro && <div style={{ marginTop: 10, color: 'var(--red-600)', fontSize: 13 }}>{erro}</div>}
      </div>

      <div className="card">
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Painel de notas escaneadas</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Chave</th>
                <th>Estabelecimento</th>
                <th>Valor (R$)</th>
                <th>Status envio</th>
              </tr>
            </thead>
            <tbody>
              {scans.map((nota) => (
                <tr key={nota.id}>
                  <td>{new Date(nota.dataHora).toLocaleString('pt-BR')}</td>
                  <td style={{ fontFamily: 'monospace' }}>{nota.chaveAcesso}</td>
                  <td>{nota.estabelecimento}</td>
                  <td>{nota.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td><span className="badge badge-green">Enviada</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
