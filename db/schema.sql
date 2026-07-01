-- Schema Postgres (Supabase) do Radar de Editais.
-- Espelha o schema SQLite do app, em dialeto Postgres.
-- Aplicado pelo scripts/migrate-to-supabase.mjs (idempotente).

CREATE TABLE IF NOT EXISTS empresas (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  apelido TEXT,
  cnpj TEXT NOT NULL,
  data_abertura TEXT,
  porte TEXT,
  situacao TEXT,
  municipio TEXT,
  uf TEXT,
  uf_ficha_tecnica TEXT,
  observacao_endereco TEXT,
  representante_legal TEXT,
  cnae_principal TEXT,
  cnaes_secundarios TEXT,
  apresentacao TEXT,
  portfolio TEXT,
  clientes TEXT,
  parceiros TEXT,
  metricas TEXT,
  tags TEXT
);

CREATE TABLE IF NOT EXISTS pilares (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  emoji TEXT,
  empresa_slug TEXT,
  descricao TEXT,
  keywords TEXT
);

CREATE TABLE IF NOT EXISTS banco_textos (
  id SERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  pilar_slug TEXT,
  empresa_slug TEXT,
  categoria TEXT,
  conteudo TEXT NOT NULL,
  origem TEXT DEFAULT 'seed',
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS editais (
  id SERIAL PRIMARY KEY,
  fonte TEXT NOT NULL,
  fonte_id TEXT,
  nome TEXT NOT NULL,
  orgao TEXT,
  url TEXT,
  descricao TEXT,
  valor_total TEXT,
  moeda TEXT,
  inicio_inscricoes TEXT,
  fim_inscricoes TEXT,
  areas TEXT,
  uf TEXT,
  status TEXT DEFAULT 'radar',
  motivo_descarte TEXT,
  analisado_em TIMESTAMPTZ,
  analise_modo TEXT,
  score INTEGER,
  pilar_slug TEXT,
  empresa_slug TEXT,
  pasta TEXT,
  elegibilidade TEXT,
  prazo_viavel INTEGER,
  analise_resumo TEXT,
  briefing TEXT,
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE (fonte, fonte_id)
);

CREATE TABLE IF NOT EXISTS propostas (
  id SERIAL PRIMARY KEY,
  edital_id INTEGER NOT NULL REFERENCES editais(id) ON DELETE CASCADE,
  titulo TEXT,
  conteudo TEXT,
  modo TEXT,
  status TEXT DEFAULT 'pronta',
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fontes_rss (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  url TEXT UNIQUE NOT NULL,
  ativa INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS config (
  chave TEXT PRIMARY KEY,
  valor TEXT
);

CREATE TABLE IF NOT EXISTS varreduras (
  id SERIAL PRIMARY KEY,
  origem TEXT,
  iniciada_em TIMESTAMPTZ DEFAULT now(),
  finalizada_em TIMESTAMPTZ,
  total_encontrados INTEGER DEFAULT 0,
  novos INTEGER DEFAULT 0,
  detalhe TEXT
);

CREATE TABLE IF NOT EXISTS historico_candidaturas (
  id SERIAL PRIMARY KEY,
  evento TEXT,
  proponente TEXT,
  empresa_slug TEXT,
  patrocinador TEXT,
  ano TEXT,
  data_envio TEXT,
  valor_solicitado TEXT,
  valor_aprovado TEXT,
  status TEXT,
  tags TEXT,
  observacoes TEXT,
  materiais TEXT,
  fonte TEXT DEFAULT 'coda',
  chave TEXT UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_editais_status ON editais(status);
CREATE INDEX IF NOT EXISTS idx_editais_score ON editais(score);
CREATE INDEX IF NOT EXISTS idx_propostas_edital ON propostas(edital_id);
