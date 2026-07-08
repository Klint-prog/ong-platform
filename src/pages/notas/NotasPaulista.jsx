import { useEffect, useMemo, useRef, useState } from 'react'
import NfpService from '../../services/NfpService'
import { QrCode, Hand, Landmark, Send, Trash2, CheckCircle2, MonitorCheck, Power, Volume2 } from 'lucide-react'

// Chave com prefixo "ong_" para ser sincronizada com o PostgreSQL pela
// camada postgresLocalStorage (chaves fora do prefixo ficam só em memória).
const STORAGE_KEY = 'ong_nfp_scans'
const MODO_MESA_KEY = 'ong_nfp_modo_mesa'

// Tempo (ms) sem novos caracteres para considerar a leitura do scanner concluída.
// Leitoras HID "digitam" muito rápido; 300ms após o último caractere é seguro.
const SCANNER_DEBOUNCE_MS = 300

// No modo mesa, intervalo entre teclas acima disso indica digitação humana
// (scanners emitem caracteres com ~10–30ms de intervalo; pessoas, 150ms+).
const INTERVALO_MAX_SCANNER_MS = 100

// Silêncio após o último caractere que encerra uma leitura no modo mesa.
const FINALIZACAO_MODO_MESA_MS = 250

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
  const [modoMesa, setModoMesa] = useState(() => localStorage.getItem(MODO_MESA_KEY) === 'true')
  const [registrosSessao, setRegistrosSessao] = useState(0)

  const inputRef = useRef(null)
  const debounceRef = useRef(null)
  const scansRef = useRef(scans)
  const audioCtxRef = useRef(null)
  const registrarRef = useRef(null)

  const nfpService = useMemo(() => new NfpService(), [])

  useEffect(() => { scansRef.current = scans }, [scans])

  /* ── Feedback sonoro (como um caixa de mercado) ─────────────── */
  const garantirAudio = () => {
    if (!audioCtxRef.current) {
      const Ctor = window.AudioContext || window.webkitAudioContext
      if (Ctor) audioCtxRef.current = new Ctor()
    }
    audioCtxRef.current?.resume?.()
    return audioCtxRef.current
  }

  const tocarBeep = (tipo) => {
    const ctx = audioCtxRef.current
    if (!ctx) return
    const tons = tipo === 'ok' ? [[880, 0, 0.09], [1318, 0.09, 0.12]] : [[220, 0, 0.28]]
    tons.forEach(([freq, inicio, duracao]) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.value = 0.08
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime + inicio)
      osc.stop(ctx.currentTime + inicio + duracao)
    })
  }

  /* ── Registro ────────────────────────────────────────────────
     Retorna 'ok' | 'duplicada' | 'invalida'. Usa scansRef para a
     checagem de duplicidade ser confiável mesmo quando chamado de
     listeners globais (modo mesa), fora do ciclo de render. */
  const registrarScan = (valorEntrada) => {
    const bruto = valorEntrada !== undefined ? valorEntrada : entradaScanner
    const parsed = parseNotaQr(bruto)
    if (!parsed) {
      if (String(bruto || '').trim()) {
        setErro('QR Code inválido. Use a URL/QR da NFC-e com chave de 44 dígitos.')
      }
      return 'invalida'
    }

    if (scansRef.current.some((s) => s.chaveAcesso === parsed.chaveAcesso)) {
      setErro('Esta nota já foi registrada no painel.')
      setUltimaRegistrada('')
      setEntradaScanner('')
      return 'duplicada'
    }

    const novaNota = { ...parsed, id: `${Date.now()}-${parsed.chaveAcesso.slice(-6)}` }
    const next = [novaNota, ...scansRef.current]
    scansRef.current = next
    setScans(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))

    setErro('')
    setUltimaRegistrada(parsed.chaveAcesso)
    setEntradaScanner('')
    setRegistrosSessao((n) => n + 1)
    return 'ok'
  }
  registrarRef.current = registrarScan

  /* ── Scanner de mão: registro automático no campo ────────────
     Assim que a leitora terminar de "digitar" o QR no campo
     (nenhum caractere novo por SCANNER_DEBOUNCE_MS), registra sem
     precisar de Enter. Enter, se enviado pela leitora, registra
     na hora. */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!entradaScanner.trim()) return undefined

    debounceRef.current = setTimeout(() => {
      if (parseNotaQr(entradaScanner)) {
        const resultado = registrarRef.current(entradaScanner)
        if (resultado === 'ok') tocarBeep('ok')
        inputRef.current?.focus()
      }
    }, SCANNER_DEBOUNCE_MS)

    return () => clearTimeout(debounceRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entradaScanner])

  const aoTeclar = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      if (debounceRef.current) clearTimeout(debounceRef.current)
      const resultado = registrarRef.current()
      if (resultado === 'ok') tocarBeep('ok')
      else if (resultado === 'duplicada') tocarBeep('erro')
      inputRef.current?.focus()
    }
  }

  /* ── Scanner de mesa (mãos livres) ───────────────────────────
     Captura o teclado da página inteira: não é preciso clicar em
     campo nenhum. Caracteres que chegam em rajada (< 100ms entre
     eles) são tratados como leitura do scanner; digitação humana
     é descartada pelo intervalo. A leitura finaliza no Enter da
     leitora ou após 250ms de silêncio. */
  useEffect(() => {
    if (!modoMesa) return undefined

    const buffer = { texto: '', ultimoTs: 0 }
    let timerFinalizacao = null

    const finalizarLeitura = () => {
      const texto = buffer.texto
      buffer.texto = ''
      buffer.ultimoTs = 0
      if (!texto) return

      const resultado = registrarRef.current(texto)
      if (resultado === 'ok') {
        tocarBeep('ok')
      } else if (texto.length >= 20) {
        // Só sinaliza erro quando parece uma tentativa real de leitura;
        // teclas soltas de digitação humana são ignoradas em silêncio.
        tocarBeep('erro')
      }
    }

    const aoTeclarGlobal = (event) => {
      const alvo = event.target
      const emCampoEditavel = alvo && (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA' || alvo.isContentEditable)
      if (emCampoEditavel) return // o fluxo do campo manual cuida dessa leitura

      if (event.key === 'Enter') {
        if (!buffer.texto) return
        event.preventDefault()
        if (timerFinalizacao) clearTimeout(timerFinalizacao)
        finalizarLeitura()
        return
      }

      if (event.key.length !== 1) return // ignora Shift, F5, setas etc.
      event.preventDefault() // evita atalhos do navegador durante a rajada

      const agora = performance.now()
      const intervalo = agora - buffer.ultimoTs

      // Intervalo longo = novo evento (leitura nova ou tecla humana solta):
      // descarta o buffer anterior e recomeça.
      if (buffer.texto && intervalo > INTERVALO_MAX_SCANNER_MS) buffer.texto = ''

      buffer.texto += event.key
      buffer.ultimoTs = agora

      if (timerFinalizacao) clearTimeout(timerFinalizacao)
      timerFinalizacao = setTimeout(finalizarLeitura, FINALIZACAO_MODO_MESA_MS)
    }

    document.addEventListener('keydown', aoTeclarGlobal, true)
    return () => {
      document.removeEventListener('keydown', aoTeclarGlobal, true)
      if (timerFinalizacao) clearTimeout(timerFinalizacao)
    }
  }, [modoMesa])

  const alternarModoMesa = () => {
    garantirAudio() // AudioContext precisa nascer num gesto do usuário
    setModoMesa((atual) => {
      const proximo = !atual
      localStorage.setItem(MODO_MESA_KEY, String(proximo))
      if (proximo) {
        setRegistrosSessao(0)
        // Tira o foco de qualquer campo para a captura global assumir
        document.activeElement?.blur?.()
      }
      return proximo
    })
  }

  const removerTudo = () => {
    const confirmado = window.confirm(`Remover todas as ${scans.length} notas registradas? Esta ação não pode ser desfeita.`)
    if (!confirmado) return
    scansRef.current = []
    setScans([])
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]))
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
      <style>{'@keyframes nfpPulse { 0%,100% { opacity: 1; transform: scale(1) } 50% { opacity: .45; transform: scale(.8) } }'}</style>

      <div className="page-header">
        <div>
          <h1 className="page-title">Módulo Nota Fiscal Paulista</h1>
          <p className="page-subtitle">Integração com scanner de mão ou de mesa para envio e acompanhamento das notas fiscais</p>
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

      {/* ── Scanner de mesa (mãos livres) ─────────────────────── */}
      <div className="card" style={{ marginBottom: 16, borderColor: modoMesa ? 'var(--green-500, #22c55e)' : undefined, borderWidth: modoMesa ? 1.5 : undefined, borderStyle: modoMesa ? 'solid' : undefined }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MonitorCheck size={16} />
            <strong>Scanner de mesa — modo mãos livres</strong>
          </div>

          {modoMesa && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, color: 'var(--green-600, #16a34a)' }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--green-500, #22c55e)', animation: 'nfpPulse 1.2s ease-in-out infinite' }} />
              Escutando leituras — aproxime a nota do scanner
            </span>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            {modoMesa && registrosSessao > 0 && (
              <span className="badge badge-green">{registrosSessao} nota{registrosSessao > 1 ? 's' : ''} nesta sessão</span>
            )}
            <button className={modoMesa ? 'btn btn-outline' : 'btn btn-primary'} onClick={alternarModoMesa}>
              <Power size={15} /> {modoMesa ? 'Desativar' : 'Ativar modo mesa'}
            </button>
          </div>
        </div>

        <p style={{ color: 'var(--gray-500)', fontSize: 13, marginTop: 10, marginBottom: 0 }}>
          Para scanners de mesa/balcão em modo apresentação (leitura contínua): com o modo ativo, <strong>não é preciso clicar em campo nenhum</strong> — basta passar o QR Code da nota na frente do leitor que o registro acontece sozinho, com aviso sonoro <Volume2 size={12} style={{ verticalAlign: -2 }} /> de confirmação (2 toques agudos) ou de nota repetida/inválida (1 tom grave). Deixe esta tela aberta e vá passando as notas.
        </p>
      </div>

      {/* ── Scanner de mão ────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Hand size={16} />
          <strong>Leitura com scanner de mão ou entrada manual</strong>
        </div>
        <p style={{ color: 'var(--gray-500)', fontSize: 13, marginBottom: 12 }}>
          Conecte o scanner no modo teclado (HID), clique no campo abaixo e faça a leitura do QR Code.
          O registro é <strong>automático</strong> ao concluir a leitura — não é preciso apertar Enter.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            ref={inputRef}
            autoFocus={!modoMesa}
            value={entradaScanner}
            onChange={(e) => setEntradaScanner(e.target.value)}
            onKeyDown={aoTeclar}
            onFocus={garantirAudio}
            placeholder="Leia o QR da NFC-e aqui (ou cole a URL/chave de acesso)"
          />
          <button className="btn btn-primary" onClick={() => { garantirAudio(); const r = registrarRef.current(); if (r === 'ok') tocarBeep('ok') }}>Registrar</button>
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
