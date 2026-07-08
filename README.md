<div align="center">

<img width="120" src="https://img.shields.io/badge/-ONGPlatform-22c55e?style=for-the-badge&logoColor=white" />

# 🌱 ONG Platform

### Plataforma open source de gestão para organizações sem fins lucrativos

<p>Gerencie pessoas, finanças, projetos e comunicação em uma única plataforma — gratuita, modular e pronta para rodar com Docker.</p>

<br/>

![Dashboard](screenshots/dashboard.png)

<br/>

<img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white" />
<img src="https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white" />
<img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white" />
<img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white" />
<img src="https://img.shields.io/badge/Nginx-1.27-009639?style=flat-square&logo=nginx&logoColor=white" />
<img src="https://img.shields.io/badge/Licença-MIT-22c55e?style=flat-square" />
<img src="https://img.shields.io/badge/PRs-bem--vindos-a855f7?style=flat-square" />

</div>

---

## 📸 Interface

<table>
  <tr>
    <td align="center">
      <img src="screenshots/dashboard.png" alt="Dashboard" /><br/>
      <sub><b>📊 Dashboard</b> — visão geral com indicadores e gráficos em tempo real</sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="screenshots/financeiro.png" alt="Financeiro" /><br/>
      <sub><b>💚 Financeiro</b> — controle de receitas, despesas, doações e saldo</sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="screenshots/projetos.png" alt="Projetos" /><br/>
      <sub><b>💛 Projetos</b> — gestão de projetos com progresso de tarefas e orçamento</sub>
    </td>
  </tr>
</table>

---

## ✨ Sobre o projeto

Muitas ONGs brasileiras ainda dependem de planilhas desconexas, cadernos físicos ou sistemas pagos para gerir suas operações. O **ONG Platform** nasceu para mudar isso.

Uma plataforma profissional, open source e gratuita que qualquer organização pode instalar com um único comando — seja num servidor próprio, numa VPS ou localmente com Docker.

---

## 🎨 Módulos

| Módulo | O que faz |
|---|---|
| 📊 **Dashboard** | Indicadores, fluxo financeiro, atividades e tarefas pendentes |
| 🏛️ **Institucional** | Dados oficiais da ONG, diretoria, logo e documentos críticos (com upload e pré-visualização) |
| 💛 **Projetos** | Projetos com tarefas, progresso, orçamento e indicadores de impacto |
| 🧡 **Beneficiários** | Famílias, pessoas atendidas e termos LGPD |
| 🩷 **Pessoas** | Membros, voluntários, doadores e equipe |
| 📁 **Documentos** | Central de documentos e evidências, com conversão de pré-visualização via LibreOffice |
| 💚 **Financeiro** | Receitas, despesas, contas, orçamento, comprovantes e gráficos |
| 🤝 **Captação** | Editais, oportunidades e propostas |
| 📈 **Relatórios** | Relatórios gerenciais, impacto e prestação de contas |
| 🧾 **Notas Paulista** | Registro automático de NFC-e com scanner de mão (QR Code) e geração de lote .txt |
| 💜 **Comunicação** | Notificações, templates de e-mail e logs de envio |
| 🟣 **Usuários** | Controle de acesso com 7 papéis via RBAC |
| ⚙️ **Configurações** | Parâmetros gerais da plataforma |

---

## 🚀 Rodando com Docker

### Pré-requisitos
- [Docker](https://docs.docker.com/get-docker/) instalado
- [Docker Compose](https://docs.docker.com/compose/) (já incluso no Docker Desktop)

### 1. Clone o repositório

```bash
git clone https://github.com/Klint-prog/ong-platform.git
cd ong-platform
```

### 2. Configure o ambiente

```bash
cp .env.example .env
# Edite o .env se quiser trocar senhas e portas
```

### 3. Suba os containers

```bash
docker compose up -d --build
```

### 4. Acesse

```
http://localhost:8977
```

> 🔑 Login padrão: `admin@suaong.org` / `admin123456`

---

## 🐳 Arquitetura Docker

```
Browser
   │
   ▼ porta 8977
┌─────────────────────┐
│   ong-frontend      │
│   React + Nginx     │  ← build multi-stage (node → nginx:alpine)
└─────────────────────┘
         │ proxy /api (rede interna ong_net)
         ▼
┌─────────────────────┐
│   ong-backend       │
│   Node + Express    │  ← API de storage, documentos e conversão
│   porta interna 3498│     de pré-visualizações (LibreOffice)
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│   ong-postgres      │
│   PostgreSQL 16     │  ← dados persistidos em volume Docker
└─────────────────────┘
```

| Container | Imagem | Porta exposta no host |
|---|---|---|
| `ong-frontend` | `nginx:1.27-alpine` | `8977` |
| `ong-backend` | `node:20-alpine` | — (apenas rede interna, via proxy do Nginx) |
| `ong-postgres` | `postgres:16-alpine` | `5433` (interna: 5432) |

> ⚠️ **Segurança:** a API do backend ainda não possui autenticação própria — por isso ela **não** é exposta ao host e só responde através do Nginx. Não adicione um mapeamento de porta ao serviço `backend` em ambientes acessíveis pela internet.

---

## ⚙️ Variáveis de ambiente

Copie `.env.example` para `.env` e ajuste conforme necessário:

```env
# Porta de acesso ao frontend
FRONTEND_PORT=8977

# Banco de dados
DB_NAME=ong_platform
DB_USER=ong
DB_PASSWORD=ong123
POSTGRES_PORT=5433
```

---

## 📁 Estrutura do projeto

```
ong-platform/
├── src/                           # Frontend (React + Vite)
│   ├── components/layout/         # Sidebar e navegação
│   ├── pages/
│   │   ├── auth/                  # Login (RBAC)
│   │   ├── dashboard/             # Dashboard principal
│   │   ├── institucional/         # Dados da ONG e documentos críticos
│   │   ├── projetos/              # Gestão de projetos
│   │   ├── beneficiarios/         # Beneficiários e termos LGPD
│   │   ├── pessoas/               # Gestão de pessoas
│   │   ├── documentos/            # Central de documentos
│   │   ├── financeiro/            # Controle financeiro
│   │   ├── captacao/              # Editais e oportunidades
│   │   ├── relatorios/            # Relatórios gerenciais
│   │   ├── notas/                 # Nota Fiscal Paulista (scanner QR)
│   │   ├── comunicacao/           # Notificações e e-mails
│   │   ├── usuarios/              # Controle de acesso
│   │   ├── cadastros/             # Formulários compartilhados
│   │   └── configuracoes/         # Configurações gerais
│   ├── services/                  # Autenticação/RBAC e storage↔PostgreSQL
│   └── styles/                    # Design system e CSS
├── backend/                       # API (Node + Express)
│   └── src/server.js              # Storage chave-valor, documentos e previews
├── screenshots/                   # Prints da interface
├── Dockerfile                     # Build multi-stage do frontend
├── docker-compose.yml             # Orquestração: frontend + backend + db
├── nginx.conf                     # Nginx (SPA + proxy /api + gzip + cache)
├── .env.example                   # Modelo de variáveis de ambiente
├── vite.config.js                 # Config do Vite (proxy de dev na porta 3498)
└── package.json                   # Dependências do frontend
```

---

## 🔑 Controle de acesso (RBAC)

| Papel | Permissões |
|---|---|
| `ADMIN` | Acesso total — usuários, configurações, exclusões e validações em todos os módulos |
| `DIRETORIA` | Gestão institucional, projetos, captação, relatórios e aprovações estratégicas |
| `FINANCEIRO` | Operação financeira, comprovantes, prestação de contas, notas e relatórios financeiros |
| `COORDENADOR` | Gestão operacional de projetos, beneficiários, pessoas, documentos e comunicação básica |
| `CONSELHO` | Conselho fiscal — leitura, validação e exportação de documentos, financeiro e relatórios |
| `OPERADOR` | Operação cotidiana com criação e edição limitada, sem exclusões nem administração |
| `VISUALIZADOR` | Somente leitura nos módulos liberados |

> 🔑 A conta inicial é `admin@suaong.org` / `admin123456`. **Troque a senha no primeiro acesso.** As senhas são armazenadas com hash (SHA-256 + salt); contas antigas em texto puro são migradas automaticamente no primeiro login.

---

## 🌐 Deploy em produção

A plataforma roda em qualquer serviço que suporte Docker:

| Plataforma | Tipo | Custo estimado |
|---|---|---|
| [Railway](https://railway.app) | PaaS | Gratuito (free tier) |
| [Render](https://render.com) | PaaS | Gratuito (free tier) |
| [Fly.io](https://fly.io) | Containers | Gratuito (free tier) |
| VPS (DigitalOcean, Linode…) | Self-hosted | ~R$ 20–50/mês |

---

## 🛠️ Desenvolvimento local (sem Docker)

O frontend precisa do backend e do PostgreSQL para persistir dados. Suba-os com Docker e rode só o frontend localmente:

```bash
# 1. Sobe apenas banco e API (a API fica interna; exponha só em dev se precisar)
docker compose up -d db backend

# 2. Instala dependências e inicia o Vite (proxy /api → backend na porta 3498)
npm ci
npm run dev

# Acesse: http://localhost:5173
```

> 💡 O proxy de desenvolvimento do Vite espera o backend em `http://localhost:3498`.
> Para o Vite alcançar o backend do Docker em dev, adicione temporariamente
> `ports: ["3498:3498"]` ao serviço `backend` — e remova antes de ir para produção.

---

## 🤝 Contribuindo

Contribuições são muito bem-vindas! Este é um projeto para a comunidade.

1. Faça um fork do repositório
2. Crie uma branch: `git checkout -b feature/minha-feature`
3. Commit suas mudanças: `git commit -m 'feat: descrição da feature'`
4. Push: `git push origin feature/minha-feature`
5. Abra um Pull Request

### Roadmap

- [x] Backend com API REST (Node.js + Express)
- [ ] Autenticação real com JWT no backend (hoje o RBAC roda no cliente)
- [ ] Integração com PIX para doações
- [ ] Relatórios exportáveis em PDF
- [ ] Modo escuro
- [ ] App mobile (React Native)
- [ ] Importação de dados via planilha Excel

---

## 📄 Licença

Este projeto está sob a licença **MIT** — use, modifique e distribua livremente, inclusive para fins comerciais.

---

<div align="center">

Feito com 💚 para as ONGs do Brasil

⭐ Se este projeto te ajudou, deixe uma estrela no repositório!

**[github.com/Klint-prog/ong-platform](https://github.com/Klint-prog/ong-platform)**

</div>
