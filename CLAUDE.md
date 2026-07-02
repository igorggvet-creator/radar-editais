# CLAUDE.md — Radar de Editais

Guia para o Claude Code trabalhar neste projeto. **Leia antes de mexer em qualquer coisa.**

## O que é este projeto
App web que **monitora, analisa e ajuda a escrever propostas** para editais públicos (chamadas de
financiamento) do ecossistema **GameJam+ / Indie Hero / Plug and Plus**. Ele busca editais na Central
de Editais da Prosas, avalia quais fazem sentido para o ecossistema e organiza tudo num painel.

Stack: **Next.js 15** (App Router, TypeScript) + **Tailwind** + **Supabase (Postgres)**. Hospedado na **Vercel**.

## Como rodar localmente
1. `npm install`
2. Crie o arquivo `.env.local` na raiz (peça o conteúdo ao **Igor** — ele tem a chave do banco;
   **não está no repositório por segurança**).
3. `npm run dev` e abra http://localhost:3000

> Para só **editar código e subir**, você nem precisa rodar localmente: é só dar `git push` que a
> Vercel publica sozinha. Rodar local só é necessário se quiser testar antes.

## Estrutura (onde fica o quê)
- `app/` — páginas e rotas de API (Next.js App Router)
- `lib/` — lógica principal: `sources/` (coleta na Prosas), `analysis/` (análise e match),
  `proposals/` (gera propostas .docx), `db.ts` / `sql.ts` (banco), `telegram/` (bot)
- `components/` — componentes de interface
- `scripts/` — utilitários rodados à mão (varredura, diagnóstico do acervo)
- `db/schema.sql` — estrutura do banco

## 🤝 Regras de colaboração (SEMPRE seguir)
Este repositório é compartilhado por **duas pessoas** (Igor e a colaboradora), cada uma usando seu
próprio Claude Code. Siga isto para ninguém sobrescrever o trabalho do outro e todos saberem o que mudou:

### ⬇️ Primeiro passo ao atender um pedido — sincronizar
**Sempre que for fazer uma alteração, comece puxando o que a equipe publicou:**

    git pull --rebase --autostash

Isso traz do GitHub as mudanças da outra pessoa antes de você mexer em algo (evita sobrescrever o
trabalho dela). Se aparecer conflito, **pare** e peça ajuda ao Igor — não force.

### ⬆️ Ao fazer QUALQUER alteração (sempre, sem precisar ser lembrado)
1. Faça a alteração pedida.
2. **Registre no `ATUALIZACOES.md`**: entrada nova **no topo** (data, quem fez, o que mudou, por quê,
   arquivos — siga o formato do arquivo).
3. **Commit e push** na branch `main`, com mensagem clara em português.
4. **Explique em texto** para a pessoa o que mudou.

### 🔒 Sempre
- **Nunca** commite segredos (`.env.local`, tokens `ghp_`/`vcp_`/`sbp_`, senhas). Não use `git add -f`.
- Se houver **conflito de git**, não force: pare e peça ajuda ao Igor.

> Vale para os **dois lados** — o Claude do Igor também segue isto.

## Deploy e dados
- **Código:** todo `git push` na `main` → a **Vercel** publica automaticamente.
  Produção: https://radar-editais-nine.vercel.app
- **Dados** (editais e análises): ficam no **Supabase** e aparecem na hora, sem precisar de deploy.
  As varreduras/análises de editais são feitas pelo Igor.

## Segurança
- Nunca subir `.env*`, tokens, senhas ou banco local.
- O acesso ao app é protegido por senha (`APP_PASSWORD`).

## ⚠️ Se um deploy aparecer como "BLOCKED" na Vercel
A Vercel bloqueia deploys cujo **autor do commit não está vinculado a uma conta do GitHub**.
Isso quase sempre é o e-mail do git errado. Configure o git com o **e-mail da sua conta do GitHub**:

```
git config user.email "SEU-EMAIL-DA-CONTA-GITHUB"
git config user.name "SEU-USUARIO-GITHUB"
```

(Pode usar o e-mail *noreply* do GitHub, no formato `ID+usuario@users.noreply.github.com`, que fica
em GitHub → Settings → Emails.) Depois faça um novo commit e push, e o deploy sai do BLOCKED.
