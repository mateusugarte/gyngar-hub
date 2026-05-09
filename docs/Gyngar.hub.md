# Gyngar.hub — Documento de Arquitetura & Roadmap
> Sistema de Organização Empresarial com IA
> Última atualização: 08/05/2026 — Sessão 01

---

## 🎯 Objetivo do Sistema

O **Gyngar.hub** é uma plataforma SaaS de organização empresarial focada em:
- **Geração e qualificação de leads** via scraping inteligente (Apify)
- **Gestão de pipeline de vendas** com estágios claros e metas
- **Organização de conteúdo** com calendário, IA criativa e métricas do Instagram
- **Dashboard unificado** com visão real-time de métricas chave
- **Agente de IA** treinado com o contexto completo do negócio do usuário

---

## 📌 Status Atual

**Fase:** Arquitetura — Sessão 01
**Próxima ação:** Definir stack tecnológica + APIs necessárias (aguardando validação do usuário)

---

## 🏗️ Módulos do Sistema

### 1. Dashboard
- Métricas principais: leads prospectados, vendas feitas, reuniões agendadas, posts feitos, impressões no Instagram
- Filtros de data: semana, mês, últimos 60 dias, data personalizada
- Gráficos de evolução temporal
- Cards de metas com progresso

### ⚠️ Nota Técnica — Instagram Token Refresh
- Tokens de acesso do Instagram expiram a cada **60 dias**
- **Obrigatório:** criar uma Supabase Edge Function com CRON que roda a cada ~45 dias para renovar os tokens automaticamente antes de expirarem
- Token renovado deve ser salvo no banco substituindo o anterior (criptografado, por `user_id`)
- Sistema deve alertar o usuário no Dashboard caso a renovação falhe

---

### 2. Organização de Conteúdo
- Calendário de postagens (visualização mensal/semanal)
- Banco de ideias com tags e status
- Agentes de IA para criação de ideias de conteúdo
- Integração com Instagram Graph API (métricas reais, postagens captadas)
- Gestão de status: ideia → produção → agendado → publicado

### 3. Prospecção
- Scraping via Apify: comentários IG, seguidores IG, Google Maps, LinkedIn
- Enriquecimento de leads via pesquisa web
- Filtros por ICP (definido pelo usuário no sistema)
- Metas de prospecção, reuniões e vendas

### 4. Gestão de Leads (Pipeline)
- Estágios: Primeiro contato → Possível interesse → Reunião agendada → Venda concluída → Follow-up
- Leads vindos direto do módulo de Prospecção
- Cards de lead com histórico de interações
- Filtros e busca avançada

### 5. Chat com Agente IA
- Conectado à API do Claude (claude-sonnet-4-20250514)
- Contexto completo do sistema injetado no system prompt
- Acesso a dados do usuário (leads, métricas, conteúdos)
- Respostas contextuais e acionáveis

---

## 🛠️ Stack Tecnológica (Proposta — aguardando validação)

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **UI:** Tailwind CSS + shadcn/ui
- **Estado:** Zustand ou Jotai
- **Gráficos:** Recharts ou Chart.js

### Backend
- **BaaS:** Supabase (banco, auth, storage, realtime)
- **Funções serverless:** Next.js API Routes + Supabase Edge Functions
- **Fila/Jobs:** Supabase Edge Functions com CRON (para scraping assíncrono)

### Integrações Externas
| Serviço | Uso |
|---|---|
| Anthropic API | Agente IA + geração de conteúdo |
| Apify API | Scrapers (IG comments, followers, Maps, LinkedIn) |
| Instagram Graph API | Métricas reais e postagens |
| GitHub | Versionamento do código |
| Supabase | Banco de dados + Auth + Storage |

### Segurança
- Auth via Supabase (email/senha + OAuth)
- RLS (Row Level Security) no Supabase para isolamento de dados por usuário
- Variáveis de ambiente para todas as chaves de API
- Rate limiting nas rotas de scraping
- Tokens de API do usuário criptografados no banco

---

## 📁 Estrutura de Pastas (Proposta)

```
gyngar-hub/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/
│   │   ├── page.tsx
│   │   └── components/
│   ├── content/
│   │   ├── page.tsx
│   │   ├── calendar/
│   │   ├── ideas/
│   │   └── components/
│   ├── prospection/
│   │   ├── page.tsx
│   │   ├── scrapers/
│   │   └── components/
│   ├── leads/
│   │   ├── page.tsx
│   │   ├── pipeline/
│   │   └── components/
│   └── chat/
│       ├── page.tsx
│       └── components/
├── components/
│   └── ui/              # shadcn components
├── lib/
│   ├── supabase/        # cliente e helpers
│   ├── anthropic/       # wrapper da API Claude
│   ├── apify/           # wrappers dos scrapers
│   └── instagram/       # wrapper do Graph API
├── types/               # TypeScript types globais
├── hooks/               # custom hooks
├── CLAUDE.md            # instruções para Claude Code
└── .env.local           # variáveis de ambiente
```

---

## 📋 CLAUDE.md — Estrutura Planejada (máx 200 linhas)

O arquivo `CLAUDE.md` deve conter:
1. **Objetivo do projeto** (5 linhas)
2. **Stack e versões** (10 linhas)
3. **Estrutura de pastas** (20 linhas)
4. **Padrões de código** — naming, componentes, hooks (20 linhas)
5. **Integrações** — como usar cada wrapper de API (30 linhas)
6. **Banco de dados** — tabelas principais do Supabase (30 linhas)
7. **Fluxos críticos** — prospecção, pipeline, IA (30 linhas)
8. **Segurança** — regras RLS, env vars (15 linhas)
9. **Como rodar localmente** (10 linhas)
10. **Próximos passos / em construção** (10 linhas)

---

## 🗺️ Roadmap de Construção

### Etapa 1 — Fundação (Semana 1-2)
- [ ] Setup do repositório GitHub
- [ ] Configuração do Supabase (projeto, tabelas base, RLS)
- [ ] Setup do Next.js com Tailwind + shadcn/ui
- [ ] Sistema de autenticação (login, registro, sessão)
- [ ] Layout base (sidebar, navegação entre módulos)
- [ ] Criação do `CLAUDE.md`

### Etapa 2 — Dashboard (Semana 2-3)
- [ ] Criação das tabelas de métricas no Supabase
- [ ] Cards de métricas principais
- [ ] Filtros de data
- [ ] Gráficos de evolução

### Etapa 3 — Gestão de Leads / Pipeline (Semana 3-4)
- [ ] Tabelas de leads e estágios no Supabase
- [ ] Kanban de pipeline
- [ ] CRUD de leads
- [ ] Histórico de interações

### Etapa 4 — Prospecção (Semana 4-6)
- [ ] Integração com Apify (wrappers dos 4 scrapers)
- [ ] Sistema de ICP (definição pelo usuário)
- [ ] Fluxo de enriquecimento de leads
- [ ] Filtros e qualificação automática
- [ ] Metas de prospecção

### Etapa 5 — Conteúdo (Semana 6-8)
- [ ] Banco de ideias + tags
- [ ] Calendário de postagens
- [ ] Integração com Instagram Graph API
- [ ] Agente de IA para geração de ideias
- [ ] Métricas de posts

### Etapa 6 — Agente de IA (Semana 8-9)
- [ ] Chat interface
- [ ] System prompt com contexto do sistema
- [ ] Acesso a dados do usuário via ferramentas
- [ ] Streaming de respostas

### Etapa 7 — Polimento & Deploy (Semana 9-10)
- [ ] Testes de fluxos críticos
- [ ] Otimização de performance
- [ ] Deploy (Vercel + Supabase prod)
- [ ] Documentação final

---

## ✅ Decisões Confirmadas

| Decisão | Escolha |
|---|---|
| Stack | Next.js 14 + Supabase + Tailwind + shadcn/ui ✅ |
| Modelo de usuários | Multi-tenant (cada usuário com dados isolados via RLS) ✅ |
| Apify | Chave de API já disponível ✅ |
| Instagram | OAuth via Meta for Developers + token refresh CRON ✅ |
| Comunicação Claude | API direta Anthropic + tool use (NÃO MCP) ✅ |
| Drag-and-drop | @dnd-kit/core ✅ |

---

## 📋 Detalhamento das Páginas (Sessão 03)

### PÁGINA 1 — DASHBOARD

**Função técnica principal:** `getMetricsByPeriod(userId, periodFilter)` via Supabase RPC PostgreSQL.

**Métricas e regras de cálculo:**
- **Impressões totais:** SUM da tabela `instagram_posts` (Graph API endpoint `/insights`)
- **Vídeo top:** MAX(views) com curtidas, comentários, salvamentos
- **Posts previstos:** `posts_programados + (média_constância_3_meses × dias_restantes)`
- **Leads de posts isca:** Edge Function CRON 1h puxa comentários, faz LIKE com `palavra_isca`, insere em `leads_instagram` com `origem_post_id`
- **Toda métrica retorna delta % vs período anterior + sparkline 7 pontos**

**3 gráficos prioritários:**
1. Funil de conversão (impressões → leads → reuniões → vendas)
2. Evolução prospecções vs meta diária
3. Engajamento por tipo de post (Isca, Educação, Viralização)

**Tabelas envolvidas:** `instagram_posts`, `instagram_comments`, `leads_qualified`, `pipeline_stages`, `user_goals`

---

### PÁGINA 2 — CONTEÚDO

#### 2.1 Personalização (Marketing Context — 8 dimensões obrigatórias)
1. Produto (categoria, modelo de venda)
2. ICP firmográfico (porte, segmento, geografia)
3. ICP psicográfico (dor, gatilho, alternativas)
4. Persona decisora (cargo, valores, objeções)
5. Diferencial (3 frases)
6. Voz da marca (3-5 adjetivos)
7. JTBD do conteúdo (educar/entreter/inspirar/vender)
8. Prova social (métricas, cases)

**Tabela:** `user_marketing_context` (1:1 com users, jsonb)

#### 2.2 Calendário
- **DECISÃO TÉCNICA:** Sistema agenda no banco + push notification 30min antes. Usuário publica manualmente (Graph API só agenda para Business via Facebook Page; complexo). Adicionar Buffer/Later como integração futura.
- View mensal padrão + toggle semanal
- Cada célula: até 3 chips de posts; click → painel lateral

#### 2.3 Planejamento Mensal (refinamento)
- IA propõe distribuição automática pelo framework 40/20/15/15/10:
  - 40% Educacional
  - 20% Bastidores
  - 15% Prova Social
  - 15% Engajamento
  - 10% Promocional
- Distribuição temporal: promocional nunca 2 dias seguidos; engajamento a cada 2-3 dias
- Usuário ajusta percentuais e quantidades

#### 2.4 Banco de Ideias (estrutura completa do card)
```
{ titulo, tipo, pilar, objetivo_negocio, hook, roteiro, cta,
  hashtags[], legenda, palavra_isca?, oferta_isca?,
  status: ideia|producao|agendado|publicado, data_agendada, ig_media_id }
```
- Botão "Gerar com IA": preenche hook + roteiro + CTA + hashtags via Anthropic API
- Roteiro segue estrutura 0-3s hook / 3-15s problema / 15-50s valor / 50-60s CTA

**Tabelas:** `content_ideas`, `content_calendar_planning`, `instagram_posts` (publicados)

---

### PÁGINA 3 — LEADS (Pipeline)

**Refinamentos críticos:**
- "Follow-up" REMOVIDO como coluna → vira atributo (`proxima_acao`)
- Substituir por **"Em Negociação"** ou **"Proposta Enviada"**

**Card de lead — estrutura completa:**
```
identificação: nome, telefone, instagram, email
qualificação: empresa, nicho, porte, cidade, site
origem: enum + detalhe { post_id, palavra_isca, busca_id }
pipeline: etapa, data_entrada_etapa, proxima_acao{tipo,data,desc}, valor_potencial, score A/B/C
histórico: interacoes[] timeline, observacoes, tags[]
```

**Regra de lead parado:**
- +5 dias na etapa: badge amarelo "esfriando"
- +10 dias: badge vermelho "perdendo" + notificação
- Trigger: Edge Function CRON diária 9h

**Tech:** @dnd-kit/core para drag-and-drop, Supabase realtime channels para sync multi-device

**Tabelas:** `leads_qualified`, `lead_interactions`, `pipeline_stages`, `lead_notifications`

---

### PÁGINA 4 — PROSPECÇÃO

**ARQUITETURA JOB-BASED (assíncrona — crítico):**

```
1. POST /api/prospection/start → cria scraping_job (status: pending)
2. Dispara Apify run → salva apify_run_id
3. UI: "Buscando... pode fechar"
4. Edge Function CRON 30s verifica jobs
5. Apify finaliza → salva em leads_raw
6. Job 2: enriquecimento (Anthropic + web_search tool)
7. IA classifica vs ICP → qualificado/desqualificado
8. Push notification: "X leads, Y qualificados"
```

**Filtros como enums claros:**
```
{ tem_site, tem_instagram_ativo (post <30d), min/max_seguidores,
  conta_business, tempo_mercado_min_anos, cidade[], nicho[] }
```

**Regra empresário→empresa:** prompt Claude com bio + 3 posts → retorna `{empresa, confianca}` em JSON

**Controle de custo Apify (CRÍTICO):**
- Estimar custo antes de rodar (preview)
- Cota mensal por usuário (configurável por plano)
- Log em `apify_usage_logs` (custo_estimado, custo_real)

**Deduplicação:** UNIQUE(user_id, instagram_handle) com upsert atualizando `ultima_visualizacao`

**4 Apify Actors:**
- `instagram-comment-scraper`
- `instagram-follower-scraper`
- `google-maps-scraper`
- `linkedin-scraper` (placeholder)

**Tabelas:** `scraping_jobs`, `leads_raw`, `leads_qualified`, `apify_usage_logs`, `enrichment_queue`

---

### PÁGINA 5 — AGENTE IA

**CORREÇÃO ARQUITETURAL:** API Anthropic direta com tool use (NÃO MCP — MCP é cliente desktop)

**Fluxo:**
```
Chat → /api/chat Edge Function:
  1. Load user context (marketing + pipeline + métricas 30d)
  2. System prompt com escopo claro
  3. Tools disponíveis:
     - get_leads(filter)
     - get_metrics(period)
     - get_content_calendar()
     - get_post_performance(post_id)
     - search_apify_history()
  4. Stream via SSE
```

**Escopo do agente (system prompt):**
- ✅ Analisar performance de conteúdo (framework 40/20/15/15/10)
- ✅ Priorizar leads por probabilidade de fechamento
- ✅ Sugerir abordagens de prospecção baseadas em ICP
- ✅ Explicar métricas
- ❌ Agendamentos automáticos
- ❌ Envio de mensagens
- ❌ Decisões financeiras

**SEMPRE:** citar dado consultado + justificar com framework de marketing

**Controle de custo:**
- Contexto truncado: últimas 20 mensagens
- Rate limit: 50 msg/dia plano básico
- Cache queries idênticas 1h
- Tracking em `chat_usage_logs`

**Tabelas:** `chat_conversations`, `chat_messages`, `chat_usage_logs`

---

## 📌 Próximos Passos

- [x] Validar refinamentos da Sessão 03 ✅
- [x] CLAUDE.md criado ✅
- [x] Roadmap.md por página criado ✅
- [x] Prompts.md com 5 primeiros prompts para Claude Code ✅
- [ ] Executar Prompt 1 no Claude Code (Fundação)
- [ ] Executar Prompt 2 no Claude Code (Pipeline de Leads)
- [ ] Executar Prompt 3 no Claude Code (Dashboard)
- [ ] Executar Prompt 4 no Claude Code (Prospecção)
- [ ] Executar Prompt 5 no Claude Code (Conteúdo)

---

## 💬 Histórico de Sessões

### Sessão 01 — 08/05/2026
- Apresentação completa do escopo
- Definição dos 5 módulos
- Proposta de stack + estrutura de pastas
- Roadmap de 10 semanas criado

### Sessão 02 — 08/05/2026
- Stack confirmada: Next.js + Supabase + Tailwind + shadcn/ui
- Arquitetura multi-tenant confirmada (RLS por usuário)
- Apify: chave já disponível
- Instagram: fluxo OAuth a ser explicado e definido
- Próximo foco: mapeamento completo de funções por página

### Sessão 04 — 08/05/2026
- Decisões finais validadas:
  - Agente IA marcado como "em desenvolvimento" (fase 2)
  - Calendário: apenas gestão no sistema (sem agendamento Instagram)
  - "Follow-up" virou atributo; nova coluna "Recusa" no Kanban
  - Apify: chave por usuário (cada um coloca a sua própria)
  - Deduplicação de leads via UNIQUE constraint + upsert
  - Controle de gastos Apify: responsabilidade do usuário por enquanto
- Agentes de IA explicados: API Anthropic direta, tokens debitados da conta do dono
- Documentos criados:
  - CLAUDE.md (instruções completas para Claude Code)
  - Roadmap.md (etapas 0-6 detalhadas por página com critérios de conclusão)
  - Prompts.md (5 prompts prontos para Claude Code executar)
- Ordem de execução definida: Fundação → Leads → Dashboard → Prospecção → Conteúdo → Agente IA
- Skills de marketing absorvidas (social-content, marketing-psychology, content-strategy, marketing-context, marketing-strategy-pmm, etc.)
- Detalhamento crítico de cada página (5 páginas analisadas)
- Refinamentos arquiteturais:
  - Comunicação Claude via API direta + tool use (não MCP)
  - Calendário Instagram: agenda em banco + push notification (não publicação automática)
  - Pipeline: "Follow-up" deixa de ser coluna, vira atributo
  - Prospecção: arquitetura job-based assíncrona
  - Card de lead expandido com timeline, score A/B/C, próxima ação
- Frameworks aplicados:
  - 40/20/15/15/10 para mix de conteúdo
  - 0-3s/3-15s/15-50s/50-60s para roteiros
  - Pilares marketing-context para questionário ICP
  - Lead score por estagnação (5d/10d)
