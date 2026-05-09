# CODE_AGENTS.md — Gyngar.hub
> Agentes que rodam NO CÓDIGO (Claude Code) durante o desenvolvimento.
> Todos leem CLAUDE.md + TOKEN_EFFICIENCY.md antes de agir.
> Acesso às mesmas skills de marketing + skills técnicas.

---

## Como os agentes de código funcionam

Claude Code usa subagentes via `Task` tool — cada um tem contexto limpo e especialidade única.
Nunca editar 3+ arquivos simultâneos com um único agente.
Verificar antes de declarar pronto: `npm run build` → `tsc --noEmit` → `lint` → `test`.

---

## AGENTE DE CÓDIGO 1 — Arquiteto de Features
**Quando usar:** antes de construir qualquer feature nova

### Skills carregadas
- `backend-patterns`: repository pattern, service layer, API design RESTful
- `nextjs-turbopack`: App Router, Server Components, caching
- `security-review`: checklist de segurança por feature
- `coding-standards`: nomenclatura, tipos, organização

### O que faz
1. Lê CLAUDE.md e identifica tabelas/rotas envolvidas
2. Define estrutura de arquivos antes de escrever código
3. Mapeia dependências entre módulos
4. Propõe interface TypeScript antes de implementar
5. Verifica RLS policies necessárias

### Template de output
```typescript
// Estrutura proposta:
// app/[módulo]/page.tsx — Server Component
// app/api/[módulo]/route.ts — API Route
// lib/[módulo]/repository.ts — Repository pattern
// lib/[módulo]/service.ts — Business logic
// types/[módulo].ts — Types e schemas Zod
// __tests__/unit/lib/[módulo].test.ts — TDD onde aplicável
```

### Skills de marketing disponíveis
Marketing context lido do banco → injeta no código de agentes IA:
`planning-agent.ts`, `ideas-agent.ts` — system prompts com frameworks de marketing.

---

## AGENTE DE CÓDIGO 2 — Builder de UI
**Quando usar:** construção de componentes e páginas

### Skills carregadas
- `nothing-design`: sistema completo Nothing — tokens, componentes, hierarquia tipográfica, motion
- `frontend-patterns`: composição, hooks, estado, performance
- `nextjs-turbopack`: Client vs Server Components, Suspense boundaries
- `coding-standards`: convenções de componente, props typesafety

### Nothing Design — regras obrigatórias para o Claude Code
```
Fontes: Space Grotesk (body/UI) + Space Mono (labels/dados) + Doto (hero numbers)
Hierarquia: 3 camadas por tela — primário (display), secundário (body), terciário (label)
Cores: tokens CSS do initialDesign.md — nunca valores hardcoded
Labels: SEMPRE Space Mono, ALL CAPS, letter-spacing 0.08em
Transições: ease-out 150-250ms, nunca spring/bounce
Anti-patterns: sem sombras, sem gradientes, sem ilustrações, sem skeleton
```

### Regras de UI do Gyngar.hub
```
Dark mode padrão. Sidebar escura (#0D0D0E). 
Cores: Purple (#534AB7) principal | Teal (#1D9E75) sucesso | Amber (#EF9F27) alerta | Coral (#D85A30) perigo.
Componentes shadcn/ui + Tailwind. Nunca estilo inline extenso.
Server Components por padrão. "use client" só com interatividade.
```

### O que nunca faz
- Hardcodar dados no componente (sempre props ou fetch)
- Criar CSS fora de Tailwind classes
- Deixar `any` no TypeScript
- Usar `position: fixed` sem Suspense

---

## AGENTE DE CÓDIGO 3 — Engenheiro de Banco (Supabase)
**Quando usar:** migrations, queries, RLS, Edge Functions

### Skills carregadas
- `backend-patterns`: otimização de queries N+1, indexing, connection pooling
- `security-review`: RLS policies, exposição de dados, env vars
- `nextjs-turbopack`: Server Actions com Supabase

### Regras obrigatórias
```sql
-- TODA tabela tem:
user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
-- TODA tabela tem RLS:
ALTER TABLE [tabela] ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_isolation" ON [tabela]
  USING (user_id = auth.uid());
-- Chaves sensíveis:
pgp_sym_encrypt(valor, env_var) -- Apify key, Instagram token
```

### O que entrega
- Migration SQL completa e comentada
- RLS policy testada
- Índices para queries frequentes
- Supabase RPC para queries complexas (evitar múltiplas roundtrips)

---

## AGENTE DE CÓDIGO 4 — Integrador de APIs
**Quando usar:** Apify, Instagram Graph API, Anthropic API

### Skills carregadas
- `security-review`: secrets, rate limit, error handling
- `backend-patterns`: retry logic, job queue, async patterns
- `api-design`: contratos de input/output, error codes

### Skills de marketing (para Anthropic API)
```
Agente de Planejamento usa: social-content + video-content-strategist + marketing-psychology + copywriting
Agente de Ideias usa: social-content + video-content-strategist + copywriting
Agente de Enriquecimento usa: lead-research + marketing-strategy-pmm
Agente Qualificador usa: marketing-strategy-pmm + customer-research
```

### Padrão de wrapper
```typescript
// lib/apify/base.ts — Nunca chama Apify direto do frontend
// 1. Busca chave do usuário no Supabase (descriptografada server-side)
// 2. Cria scraping_job no banco antes de chamar
// 3. Dispara Apify run → salva apify_run_id
// 4. Retorna job_id para polling
// 5. Edge Function CRON verifica e atualiza status

// lib/anthropic/base.ts — Wrapper compartilhado
// 1. Carrega contexto do usuário do Supabase
// 2. Monta system prompt com skills + TOKEN_EFFICIENCY
// 3. Chama API com streaming quando aplicável
// 4. Loga tokens em chat_usage_logs
// 5. Retorna { data, error, tokens_used }
```

### O que nunca faz
- Expor chave Anthropic no frontend (NEXT_PUBLIC_)
- Chamar API externa sem try/catch
- Fazer polling no frontend (usar SSE ou Supabase realtime)

---

## AGENTE DE CÓDIGO 5 — Escritor de Testes
**Quando usar:** após qualquer feature que envolva lógica de negócio

### Skills carregadas
- `tdd-workflow`: ciclo RED → GREEN → REFACTOR
- `verification-loop`: build → typecheck → lint → test → stub check
- `coding-standards`: padrão de testes por tipo

### Decide TDD vs pós-construção
```
TDD (escrever antes):
✅ calcPostsPrevistas, calcDelta, detectPalavraIsca
✅ calcScoreICP, detectLeadParado, calcDistribuicaoPilares
✅ qualificarLead, deduplicarLead, calcMeta

Pós-construção:
✅ Componentes React, Páginas Next.js
✅ Configuração de rotas
✅ Integrações externas (mockar)
```

### Checklist de verificação obrigatório
```bash
# Rodar antes de declarar etapa concluída:
npm run build
npx tsc --noEmit
npm run lint
npm run test
grep -rn "TODO\|FIXME\|placeholder\|return null\|return {}" app/ lib/ components/ --include="*.ts" --include="*.tsx"
# Se qualquer step falhar: corrigir antes de avançar
```

---

## AGENTE DE CÓDIGO 6 — Revisor de Segurança
**Quando usar:** antes de qualquer deploy ou ao criar feature sensível

### Skills carregadas
- `security-review`: checklist completo de segurança
- `backend-patterns`: hardening de API routes

### O que verifica
```
☐ Nenhuma chave hardcoded (grep "sk-ant\|apify_key")
☐ Toda route verifica auth (getUser() antes de query)
☐ RLS ativa em todas tabelas
☐ Input validado com Zod antes de query
☐ Tokens de terceiros criptografados no banco
☐ Erro não expõe stack trace ao cliente
☐ Rate limit em /api/ai/* e /api/prospection/*
☐ CORS configurado corretamente
☐ .env.local no .gitignore (nunca commitado)
```

### Output
Relatório de checklist com ✅/❌ + linha exata do problema se encontrado.

---

## AGENTE DE CÓDIGO 7 — Gerenciador de Estado e Contexto
**Quando usar:** features com estado complexo ou multi-step

### Skills carregadas
- `frontend-patterns`: Zustand, React Query, Server State vs Client State
- `nextjs-turbopack`: URL state com searchParams, revalidação

### Regras de estado
```typescript
// Estado global (Zustand): apenas UI state (modal aberto, filtros ativos)
// Estado server (Server Components + fetch): métricas, lista de leads, calendário
// Estado URL (searchParams): filtros de data, etapa do pipeline, tab ativa
// Estado local (useState): formulários, inputs, toggle de UI
// Nunca: localStorage/sessionStorage no sistema (dados vão ao Supabase)
```

---

## Skills disponíveis para qualquer agente de código

### Marketing (para system prompts dos agentes IA)
| Skill | Usa em |
|-------|--------|
| `social-content` | planning-agent, ideas-agent system prompts |
| `video-content-strategist` | planning-agent, ideas-agent system prompts |
| `marketing-psychology` | planning-agent, ideas-agent, assistant-agent |
| `copywriting` | ideas-agent system prompt |
| `content-strategy` | planning-agent system prompt |
| `marketing-context` | questionário de personalização (perguntas do wizard) |
| `marketing-strategy-pmm` | qualifier-agent, assistant-agent |
| `customer-research` | qualifier-agent, enriquecimento |
| `cold-email` | assistant-agent (sugestões de prospecção) |
| `social-media-analyzer` | analytics-agent, dashboard metrics |

### Técnicas (para construção do código)
| Skill | Usa em |
|-------|--------|
| `backend-patterns` | lib/, API routes, Supabase queries |
| `frontend-patterns` | componentes React, hooks, estado |
| `security-review` | auth, API, banco, segredos |
| `nextjs-turbopack` | estrutura App Router, Server Components |
| `verification-loop` | checklist pós-build |
| `tdd-workflow` | testes de lógica de negócio |
| `api-design` | contratos de API, error handling |
| `coding-standards` | nomenclatura, TypeScript, organização |

---

## Ordem de trabalho recomendada por etapa

```
1. Arquiteto de Features define estrutura + tipos
2. Engenheiro de Banco cria migration + RLS
3. Escritor de Testes escreve testes (se TDD)
4. Builder de UI constrói componentes
5. Integrador de APIs conecta serviços externos
6. Escritor de Testes adiciona testes pós-construção
7. Revisor de Segurança valida antes de marcar como pronto
```
