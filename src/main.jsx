import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/global.css'
import './styles/print.css'
import './styles/financeiro-print.css'
import './styles/financeiro-overview.css'
import { hydratePostgresLocalStorage, installPostgresLocalStorage } from './services/postgresLocalStorage.js'
import './pages/financeiro/orcamentoTipoPatch.js'
import './pages/financeiro/contaTagsPatch.js'
import './pages/financeiro/financeiroActionsPatch.js'
import App from './App.jsx'

async function bootstrap() {
  await hydratePostgresLocalStorage()
  installPostgresLocalStorage()

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}

bootstrap()
