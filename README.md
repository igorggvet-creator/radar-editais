# 🎮 Radar de Editais — GameJam+ & Indie Hero

App que **monitora, analisa e escreve** editais para o ecossistema
GameJam+ / Indie Hero / Plug and Plus, seguindo o fluxograma interno:

```
📡 Monitoramento semanal ──► 🔍 Mapeamento ──► 📑 Leitura do regulamento
        │                                              │
        ▼                                              ▼
🎯 Filtro de Elegibilidade e Match (4 critérios) ──► 🗄️ Recuperação de histórico
        │                                              │
        ▼                                              ▼
   (incompatível → descarte)                    ✍️ Escrita e adaptação
```

## O que ele faz

- **Varredura semanal automática** (segunda 9h, configurável) na Central de
  Editais da **Prosas** (API oficial do widget público) + qualquer **feed RSS**
  cadastrado. Sempre que alguém pedir, roda sob demanda pelo **Telegram**
  (`/buscar games`) ou pelo botão *Varrer agora* no dashboard.
- **Análise de match** de cada edital com os 4 critérios do fluxo
  (localização do CNPJ, competências, histórico, pasta da secretaria) +
  viabilidade de prazo (mínimo 10 dias) → score 0-100, pilar e empresa
  executora recomendada. Com `ANTHROPIC_API_KEY` usa **Claude**; sem chave,
  usa heurística local de keywords.
- **Escrita de proposta**: rascunho completo moldando o **banco de textos**
  oficial (apresentações, métricas, cases) ao objeto da chamada, com
  marcadores `[PREENCHER: ...]` no que faltar. Exporta **.docx**.
- **Pipeline kanban**: radar → triagem → match → escrita → submetido.
- **Fichas das empresas** com CNPJs, CNAEs e métricas prontas para colar em
  formulários (incluindo o alerta da divergência de endereço da Acelera:
  cartão CNPJ = RJ, ficha técnica = DF).

## Rodando

```bash
npm install
npm run dev        # http://localhost:3000
```

Produção local: `npm run build && npm start`.

## Modos de IA (análise + escrita)

O app escolhe automaticamente o melhor caminho disponível (configurável em
**Configurações → Modo de IA**):

| Modo | Como liga | Custo |
|---|---|---|
| 🎟️ **Assinatura** | Claude Code (`claude`) instalado e logado na máquina que roda o app | Coberto pela assinatura Pro/Max. A partir de **15/06/2026** consome o crédito mensal dedicado do plano (Pro US$20 · Max 5x US$100 · Max 20x US$200) |
| 🔌 **API** | `ANTHROPIC_API_KEY` no `.env.local` | Créditos de API (indicado p/ serverless/produção compartilhada) |
| 📐 **Heurística** | nada — sempre disponível | Grátis (keywords + regras; menos precisa) |

Nas varreduras, a triagem é em 2 fases: a heurística analisa **todos** os
novos de graça e a IA aprofunda só os top-N promissores
(`Máx. de análises com IA por varredura`, padrão 10) — pra caber sempre no
crédito. Há também o botão **"Reanalisar top 10 com IA"** em Configurações.

## Configuração (.env.local)

Copie `.env.example` para `.env.local`:

| Variável | O que liga |
|---|---|
| `ANTHROPIC_API_KEY` | (opcional) caminho API do modo de IA |
| `CLAUDE_CLI_MODEL` | (opcional) fixa o modelo do caminho assinatura |
| `TELEGRAM_BOT_TOKEN` | Bot de alertas + busca sob demanda (crie com o [@BotFather](https://t.me/BotFather)) |

Sem chave nenhuma o app continua 100% funcional (assinatura ou heurística).

### Telegram

1. No Telegram, fale com o **@BotFather** → `/newbot` → copie o token.
2. Cole no `.env.local` e reinicie o app.
3. No chat do bot (ou num grupo da equipe), mande `/start` — o chat fica
   registrado para receber os alertas da varredura semanal.
4. Comandos: `/buscar [termo]`, `/editais`, `/edital N`, `/status`, `/ajuda`.

### Agenda semanal

Cron padrão `0 9 * * 1` (segunda 9h). Ajustável em **Configurações** no app.
O processo do `npm run dev`/`npm start` precisa estar rodando para o
agendador disparar (deixe numa máquina ligada, num PM2, ou num servidor).

## Fontes de editais

- **Prosas (Central de Editais)** — integração via OAuth2 público do widget
  oficial (`prosas.com.br/selecao/api/v2/third_party/...`), com busca por
  keyword, detalhe com descrição e valores. Keywords configuráveis.
- **RSS/Atom** — adicione qualquer feed em Configurações (newsletters de
  fomento, diários com feed etc.).
- **Coda (banco de textos)** — espaço reservado para sincronizar o doc
  *GJ Editais / Banco de textos*; falta só um token de API do Coda.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind 4 · SQLite (better-sqlite3,
arquivo em `data/radar.db`) · grammY (Telegram) · node-cron · Anthropic SDK
(`claude-opus-4-8`) · docx.

Dados das empresas e o banco de textos vivem em `lib/seed-data.ts`
(seed automático na primeira execução).
