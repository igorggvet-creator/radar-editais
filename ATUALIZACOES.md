# 📋 Atualizações do Radar de Editais

Registro de tudo que cada pessoa (através do seu Claude) altera no projeto, para que **ambos saibam
o que o outro mudou**.

**Regra:** toda alteração ganha uma entrada nova **no topo** desta lista, no formato abaixo.

```
## AAAA-MM-DD — [Seu nome]
**O que mudou:** (resumo em 1–3 frases)
**Por quê:** (motivo)
**Arquivos:** (principais arquivos tocados)
**Deploy:** (automático via push na main / não se aplica)
```

---

## 2026-07-01 — Igor (via Claude)
**O que mudou:** Configurada a colaboração no repositório — criados `CLAUDE.md` (guia do projeto +
regras de colaboração), este `ATUALIZACOES.md` (registro de mudanças) e `PROMPT-COLABORADOR.md`
(instruções prontas para quem for ajudar).
**Por quê:** Permitir que duas pessoas trabalhem no projeto com clareza, cada uma sabendo o que a
outra alterou.
**Arquivos:** `CLAUDE.md`, `ATUALIZACOES.md`, `PROMPT-COLABORADOR.md`
**Deploy:** automático via push na main

## 2026-07-01 — Igor (via Claude) — estado inicial
**O que já existia:** App publicado no GitHub (repositório privado) e conectado à Vercel para deploy
automático a cada push. Antes disso: banco migrado para o Supabase; varredura completa de editais
(+35 novos, 396 no total, 333 com prazo aberto) e reanálise de qualidade de 100 editais, limpando
~66 falsos positivos do pipeline (ficaram 24 "match" confiáveis).
**Arquivos:** projeto inteiro (commit inicial `cffb321`)
**Deploy:** produção em https://radar-editais-nine.vercel.app
