import { useEffect, useMemo, useRef, useState } from 'react'
import NfpService from '../../services/NfpService'
import { QrCode, Hand, Landmark, Send, Trash2, CheckCircle2 } from 'lucide-react'

// Chave com prefixo "ong_" para ser sincronizada com o PostgreSQL pela
// camada postgresLocalStorage (chaves fora do prefixo ficam só em memória).
const STORAGE_KEY = 'ong_nfp_scans'

// Tempo (ms) sem novos caracteres para considerar a leitura do scanner concluída.
// Leitoras HID "digitam" muito rápido; 300ms após o último caractere é seguro.
const SCANNER_DEBOUNCE_MS = 300

function safeParse(raw) {
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/*
  QR Code da NFC-e: URL com parâmetro `p` no formato pipe-separado.
  - Emissão online : chNFe|nVersao|tpAmb|cIdToken|cHashQRCode
  - Emissão offline: chNFe|nVersao|tpAmb|dhEmi|vNF|vICMS|digVal|cIdToken|cHash
  Quando o valor (vNF) vem no QR, usamos o valor real. Caso contrário fica
  null ("aguardando conciliação") — nunca inventamos valor.
*/
function parseNotaQr(raw) {
  const clean = String(raw || '').trim()
  if (!clean) return null

  let chaveAcesso = clean.replace(/\D/g, '').slice(0, 44)
  let valor = null

  if (/^https?:\/\//i.test(clean)) {
    try {
      const url = new URL(clean)
      const p = url.searchParams.get('p')
      if (p) {
        const partes = p.split('|')
        const primeira = partes[0]
        if (primeira) chaveAcesso = primeira.replace(/\D/g, '').slice(0, 44)
        // Formato offline traz vNF na 5ª posição (índice 4)
        const possivelValor = partes[4]
        if (possivelValor && /^\d+(\.\d{1,2})?$/.test(possivelValor)) {
          valor = Number(possivelValor)
        }
      }
    } catch {
      // URL malformada: mantém o fallback por dígitos
    }
  }

  if (chaveAcesso.length !== 44) return null

  return {
    chaveAcesso,
    codigo: chaveAcesso,
    estabelecimento: 'Aguardando conciliação',
    valor,
    enviado: true,
    dataHora: new Date().toISOString(),
  }
}

function formatarValor(valor) {
  if (valor == null) return '—'
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}

export default function NotasPaulista() {
  const [entradaScanner, setEntradaScanner] = useState('')
  const [scans, setScans] = useState(() => safeParse(localStorage.getItem(STORAGE_KEY)))
  const [erro, setErro] = useState('')
  const [ultimaRegistrada, setUltimaRegistrada] = useState('')
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  const nfpService = useMemo(() => new NfpService(), [])

  const persist = (next) => {
    setScans(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const registrarScan = (valorEntrada) => {
    const bruto = valorEntrada !== undefined ? valorEntrada : entradaScanner
    const parsed = parseNotaQr(bruto)
    if (!parsed) {
      if (String(bruto || '').trim()) {
        setErro('QR Code inválido. Use a URL/QR da NFC-e com chave de 44 dígitos.')
      }
      return false
    }

    let registrou = false
    setScans((atuais) => {
      const duplicada = atuais.some((s) => s.chaveAcesso === parsed.chaveAcesso)
      if (duplicada) {
        setErro('Esta nota já foi registrada no painel.')
        setUltimaRegistrada('')
        return atuais
      }
      const novaNota = { ...parsed, id: `${Date.now()}-${parsed.chaveAcesso.slice(-6)}` }
      const next = [novaNota, ...atuais]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      setErro('')
      setUltimaRegistrada(parsed.chaveAcesso)
      registrou = true
      return next
    })

    setEntradaScanner('')
    // Mantém o foco no campo para leituras consecutivas sem tocar no mouse
    inputRef.current?.focus()
    return registrou
  }

  // Registro automático: assim que a leitora terminar de "digitar" o QR
  // (nenhum caractere novo por SCANNER_DEBOUNCE_MS), a nota é registrada
  // sem precisar de Enter. Se a leitora enviar Enter como sufixo, o
  // onKeyDown registra imediatamente.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!entradaScanner.trim()) return undefined

    debounceRef.current = setTimeout(() => {
      if (parseNotaQr(entradaScanner)) registrarScan(entradaScanner)
    }, SCANNER_DEBOUNCE_MS)

    return () => clearTimeout(debounceRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entradaScanner])

  const aoTeclar = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      if (debounceRef.current) clearTimeout(debounceRef.current)
      registrarScan()
    }
  }

  const removerTudo = () => {
    const confirmado = window.confirm(`Remover todas as ${scans.length} notas registradas? Esta ação não pode ser desfeita.`)
    if (!confirmado) return
    persist([])
    setUltimaRegistrada('')
    setErro('')
  }

  const baixarLoteTxt = () => {
    try {
      const notas = scans.map((s) => ({
        chave: s.chaveAcesso,
        valor: s.valor || 0,
        dataEmissao: s.dataHora,
      }))

      const txt = nfpService.gerarArquivoLote(
        {
          cnpj: '12.345.678/0001-99',
          mesReferencia: new Date().toISOString().slice(0, 7).replace('-', ''),
        },
        notas,
      )

      const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' })
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `nfp-lote-${new Date().toISOString().slice(0, 10)}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
      setErro('')
    } catch (e) {
      setErro(e.message || 'Não foi possível gerar o arquivo posicional.')
    }
  }

  const resumo = useMemo(() => {
    const total = scans.length
    const enviadas = scans.filter((s) => s.enviado).length
    const valorNotas = scans.reduce((acc, s) => acc + (typeof s.valor === 'number' ? s.valor : 0), 0)
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
          <div><div className="stat-label">Valor identificado nas notas</div><div className="stat-value">R$ {resumo.valorNotas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div></div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Hand size={16} />
          <strong>Leitura do scanner de mão</strong>
        </div>
        <p style={{ color: 'var(--gray-500)', fontSize: 13, marginBottom: 12 }}>
          Conecte o scanner no modo teclado (HID), clique no campo abaixo e faça a leitura do QR Code.
          O registro é <strong>automático</strong> ao concluir a leitura — não é preciso apertar Enter.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            ref={inputRef}
            autoFocus
            value={entradaScanner}
            onChange={(e) => setEntradaScanner(e.target.value)}
            onKeyDown={aoTeclar}
            placeholder="Leia o QR da NFC-e aqui (ou cole a URL/chave de acesso)"
          />
          <button className="btn btn-primary" onClick={() => registrarScan()}>Registrar</button>
          <button className="btn btn-outline" onClick={removerTudo}><Trash2 size={15} /> Limpar</button>
          <button className="btn btn-primary" onClick={baixarLoteTxt}>Gerar .txt</button>
        </div>
        {erro && <div style={{ marginTop: 10, color: 'var(--red-600)', fontSize: 13 }}>{erro}</div>}
        {!erro && ultimaRegistrada && (
          <div style={{ marginTop: 10, color: 'var(--green-600, #16a34a)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={14} /> Nota <span style={{ fontFamily: 'monospace' }}>…{ultimaRegistrada.slice(-8)}</span> registrada automaticamente. Pode ler a próxima.
          </div>
        )}
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
              {scans.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 24 }}>Nenhuma nota registrada ainda. Faça a leitura de um QR Code acima.</td></tr>
              )}
              {scans.map((nota) => (
                <tr key={nota.id}>
                  <td>{new Date(nota.dataHora).toLocaleString('pt-BR')}</td>
                  <td style={{ fontFamily: 'monospace' }}>{nota.chaveAcesso}</td>
                  <td>{nota.estabelecimento}</td>
                  <td>{formatarValor(nota.valor)}</td>
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
