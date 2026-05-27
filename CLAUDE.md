# CLAUDE.md — Gyngar.hub
> Leia este arquivo inteiro antes de escrever qualquer código.

---

## 1. Objetivo do Sistema

Gyngar.hub é um SaaS multi-tenant de organização empresarial com 5 módulos:
Dashboard · Conteúdo · Leads · Prospecção · Agente IA.
Cada usuário tem dados completamente isolados via Supabase RLS.

---

## 2. Stack e Versões

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 14+ (App Router, Server Components) |
| Estilo | Tailwind CSS + shadcn/ui |
| Banco | Supabase (Postgres + Auth + Realtime + Edge Functions) |
| Estado cliente | Zustand |
| Formulários | react-hook-form + zod |
| Gráficos | Recharts |
| Drag-and-drop | @dnd-kit/core + @dnd-kit/sortable |
| IA | OpenAI API (gpt-4o) |
| Scraping | Apify API (chave por usuário, salva em user_settings) |
| Instagram | Meta Graph API v21.0 |
| Deploy | Vercel + Supabase |

---

## 3. Estrutura de Pastas

```
gyngar-hub/
├── app/
│   ├── (auth)/login/ register/
│   ├── (app)/
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   └── components/  (MetricCard, DateRangeFilter, FunnelChart)
│   │   ├── content/
│   │   │   ├── page.tsx
│   │   │   ├── calendar/
│   │   │   ├── ideas/
│   │   │   ├── planning/
│   │   │   └── components/
│   │   ├── leads/
│   │   │   ├── page.tsx
│   │   │   ├── pipeline/
│   │   │   └── components/  (KanbanBoard, LeadCard, LeadModal)
│   │   ├── prospection/
│   │   │   ├── page.tsx
│   │   │   ├── capture/
│   │   │   ├── qualified/
│   │   │   └── components/
│   │   └── agent/
│   │       └── page.tsx     (Em desenvolvimento)
│   └── api/
│       ├── instagram/       (OAuth callback, metrics sync)
│       ├── prospection/     (start-job, check-status)
│       └── ai/              (planning, ideas, chat)
├── lib/
│   ├── supabase/            (client.ts, server.ts, admin.ts)
│   ├── anthropic/           (planning-agent.ts, ideas-agent.ts)
│   ├── apify/               (ig-comments.ts, ig-followers.ts, gmaps.ts)
│   └── instagram/           (graph-api.ts, token-refresh.ts)
├── components/ui/           (shadcn)
├── hooks/                   (useUser, useLeads, useMetrics)
├── types/                   (database.types.ts gerado pelo Supabase)
├── stores/                  (Zustand stores)
└── CLAUDE.md
```

---

## 4. Padrões de Código

- **Nomenclatura:** camelCase para variáveis/funções, PascalCase para componentes, snake_case para tabelas Supabase
- **Componentes:** Server Components por padrão; `"use client"` só quando necessário (interatividade, hooks)
- **Tipagem:** TypeScript estrito. Nunca usar `any`. Tipos gerados pelo Supabase CLI (`supabase gen types`)
- **Erros:** sempre `try/catch` em chamadas de API. Retornar `{ data, error }` — nunca throw em Server Actions
- **Env vars:** NUNCA expor chaves no cliente. Prefixo `NEXT_PUBLIC_` apenas para valores públicos

---

## 5. Banco de Dados — Tabelas Principais

### Usuários e Configurações
```sql
users                   -- gerenciado pelo Supabase Auth
user_settings           -- apify_api_key (encrypted), ig_access_token, ig_account_id
user_marketing_context  -- jsonb com 8 dimensões: produto, icp_firm, icp_psico,
                        --   persona, diferencial, voz_marca, jtbd, prova_social
user_goals              -- reunioes_meta, vendas_meta, prospeccoes_diarias_meta
```

### Conteúdo
```sql
content_ideas           -- titulo, tipo, pilar, objetivo, hook_ideas[], cta_ideas[],
                        --   roteiro_sugestao, hashtags[], legenda, palavra_isca,
                        --   oferta_isca, status, data_agendada, ig_media_id
content_calendar        -- idea_id, data_planejada, status, notificacao_enviada
instagram_posts         -- ig_media_id, tipo, caption, impressions, views, likes,
                        --   comments_count, saved, data_publicacao (sync via Graph API)
instagram_comments      -- ig_comment_id, post_id, autor_ig, texto, data,
                        --   contem_palavra_isca (boolean)
```

### Leads e Pipeline
```sql
leads_qualified         -- nome, telefone, instagram, email, empresa, nicho, porte,
                        --   cidade, site, origem (enum), origem_detalhe (jsonb),
                        --   etapa (enum), data_entrada_etapa, proxima_acao (jsonb),
                        --   valor_potencial, score ('A'|'B'|'C'), observacoes,
                        --   tags[], alerta_parado (boolean), user_id
                        --   UNIQUE(user_id, instagram) + UNIQUE(user_id, telefone)
leads_instagram         -- leads captados via posts isca
pipeline_stages         -- referência das colunas do Kanban
```

### Prospecção
```sql
scraping_jobs           -- apify_run_id, fonte (enum), status, filtros (jsonb),
                        --   total_coletado, total_qualificados, user_id
leads_raw               -- dados brutos do Apify antes do enriquecimento
                        --   UNIQUE(user_id, instagram_handle)
```

### IA e Chat
```sql
chat_conversations      -- user_id, titulo, created_at
chat_messages           -- conversation_id, role, content, tokens_usados
chat_usage_logs         -- user_id, date, total_tokens, total_messages
```

### Notificações (central)
```sql
notifications           -- user_id, tipo (enum: lead_parado | job_concluido |
                        --   token_expirando | post_hora | meta_atingida),
                        --   titulo, mensagem, lida (bool), link_destino,
                        --   created_at
                        -- Exibir no sino do header; badge com contagem não lidas
```

### Plano e Onboarding
```sql
-- Campo adicionar em user_settings:
plan_tier text DEFAULT 'free' CHECK (plan_tier IN ('free', 'pro', 'enterprise'))
onboarding_completed boolean DEFAULT false
onboarding_step integer DEFAULT 0   -- passo atual do wizard (0-4)
```

**RLS em todas as tabelas:** `USING (user_id = auth.uid())`

---

## 6. Integrações — Como Usar os Wrappers

### Anthropic (IA)
```typescript
// lib/anthropic/planning-agent.ts
import Anthropic from '@anthropic-ai/sdk'
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
// Modelo sempre: claude-sonnet-4-20250514
// Max tokens: 2000 para ideias, 4000 para planejamentos
// System prompt sempre inclui: userMarketingContext + frameworks de marketing
```

### Apify
```typescript
// lib/apify/base.ts
// Chave vem de user_settings.apify_api_key (por usuário, não env global)
// Sempre criar job → polling status → buscar resultados
// Actors: apify/instagram-comment-scraper, apify/instagram-follower-scraper
//         apify/google-maps-scraper
```

### Instagram Graph API
```typescript
// lib/instagram/graph-api.ts
// Base: https://graph.instagram.com/v21.0
// Token: user_settings.ig_access_token
// Renovação automática: Edge Function CRON a cada 45 dias
```

---

## 7. Fluxos Críticos

### Fluxo de Post Isca (captura de leads via comentários)
1. Ideia criada com `palavra_isca` no banco
2. Edge Function CRON 1h → busca posts isca ativos via Graph API
3. Puxa comentários → `ILIKE '%palavra_isca%'` → insere em `leads_instagram`

### Fluxo de Prospecção (assíncrono obrigatório)
1. POST /api/prospection/start → cria `scraping_job`
2. Dispara Apify run → salva `apify_run_id`
3. Edge Function CRON 30s verifica jobs pendentes
4. Apify finaliza → enriquecimento via Anthropic com web_search
5. IA classifica vs ICP do usuário → `qualificado` / `desqualificado`
6. Deduplicação: `INSERT ... ON CONFLICT DO UPDATE` (upsert)

### Fluxo de Lead Parado (notificação automática)
1. Edge Function CRON diária 9h
2. Query: leads com `data_entrada_etapa < NOW() - INTERVAL '5 days'`
3. 5 dias → `alerta_parado = 'amarelo'`; 10 dias → `alerta_parado = 'vermelho'`
4. Insere em tabela de notificações pendentes

### Fluxo de Onboarding (usuário novo)
1. Após registro → `onboarding_completed = false`
2. Wizard 4 passos: conectar Instagram → configurar Apify key → preencher Marketing Context → definir metas
3. Cada passo salva `onboarding_step` no banco
4. Concluir → `onboarding_completed = true` → redireciona ao Dashboard
5. Banner no Dashboard enquanto `onboarding_completed = false`

### Sistema de Notificações
- Tabela `notifications` central: todas as notificações de todos os módulos
- Sino no header com badge de contagem não lidas (Supabase realtime)
- Tipos: `lead_parado | job_concluido | token_expirando | post_hora | meta_atingida`
- Edge Function CRON gera notificações; frontend apenas exibe

### Fluxo de Agentes (lib/anthropic/)
Todos os agentes seguem: ler TOKEN_EFFICIENCY.md → contexto limpo → output JSON → log tokens
1. Usuário preenche 8 dimensões do marketing context
2. Frontend POST /api/ai/planning com context
3. Edge Function monta system prompt com frameworks de marketing
4. Claude retorna plano com justificativas e pilares
5. Resposta em streaming via SSE

---

## 8. Segurança

- Auth: Supabase Auth (email/senha + Google OAuth)
- RLS: ativado em TODAS as tabelas com `user_id = auth.uid()`
- Chaves de API do usuário (Apify, Instagram token): criptografadas no banco com `pgcrypto`
- `ANTHROPIC_API_KEY`: somente no servidor (Edge Functions + API Routes)
- Rate limit: `/api/ai/*` máximo 50 requisições/dia por usuário (middleware)
- Tokens de Instagram: nunca expostos no frontend

---

## 9. Como Rodar Localmente

```bash
npm install
cp .env.example .env.local  # preencher variáveis
npx supabase start           # banco local
npx supabase db push         # aplicar migrations
npm run dev
```

Variáveis obrigatórias: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`,
`META_APP_ID`, `META_APP_SECRET`, `NEXTAUTH_SECRET`

---

## 10. Eficiência de Tokens

Leia `TOKEN_EFFICIENCY.md` antes de qualquer output de prose.
Regra: prose sempre comprimida (modo full por padrão). Código nunca comprimido.
Economiza ~65% dos tokens de output nos agentes de IA do sistema.

---

## 11. Status dos Módulos

| Módulo | Status |
|--------|--------|
| Auth + Layout | 🔴 A construir |
| Dashboard | 🔴 A construir |
| Conteúdo | 🔴 A construir |
| Leads / Pipeline | 🔴 A construir |
| Prospecção | 🔴 A construir |
| Agente IA | 🟡 Em desenvolvimento (fase 2) |
