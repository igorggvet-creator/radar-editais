# 🧭 Como colaborar no Radar de Editais (guia rápido)

Textos prontos para usar com o **Claude Code**. É só copiar, colar e trocar o que está entre [colchetes].

---

## 1) Primeira vez (configurar o projeto)

Abra o Claude Code numa pasta vazia e cole:

```
Quero configurar o projeto "Radar de Editais" para trabalhar nele.
1. Clone o repositório: https://github.com/igorggvet-creator/radar-editais.git
2. Entre na pasta do projeto e leia os arquivos CLAUDE.md e ATUALIZACOES.md para entender
   o que é o projeto e quais são as regras de colaboração.
3. Me explique, de forma simples, o que é o projeto e como vou trabalhar nele.

(Se em algum momento eu precisar rodar o app no meu computador, vou pedir ao Igor o arquivo
.env.local. Para só editar e publicar, isso não é necessário.)
```

---

## 2) Para fazer uma mudança — é só descrever!

Você **não precisa** mandar puxar as novidades, registrar no histórico, nem dar "push": isso já
acontece **sozinho**, porque está nas regras do projeto (o `CLAUDE.md`, que o Claude Code lê
automaticamente ao abrir o projeto). Basta descrever o que quer e assinar com seu nome. Exemplo:

```
[DESCREVA O QUE QUER MUDAR — ex.: "no painel, quero uma coluna mostrando o valor de cada edital"].
Pode publicar quando terminar. (assino: [SEU NOME])
```

Só isso. O Claude vai, nesta ordem: **sincronizar** com a equipe → **fazer** a mudança →
**registrar** no ATUALIZACOES.md → **publicar** (push). Em 1–2 min a versão online
(https://radar-editais-nine.vercel.app) atualiza sozinha.

---

## Dicas
- **Descreva como se explicasse para uma pessoa:** "quero o botão X azul", "quero uma coluna com Y".
  O Claude cuida do código.
- Na dúvida se algo pode quebrar, peça: **"me explica o que vai mudar antes de fazer"**.
- Se ele pedir para instalar algo ou apagar arquivos que você não reconhece, **pare e pergunte ao Igor**.
- Quer conferir o que já foi mexido? Abra o **ATUALIZACOES.md** (ou o histórico no GitHub).
