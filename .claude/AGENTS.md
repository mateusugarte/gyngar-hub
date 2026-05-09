# AGENTS.md — Gyngar.hub
> Define todos os agentes de IA do projeto: função, contexto, skills, limites.
> Leia TOKEN_EFFICIENCY.md. Modo full ativo em todos os agentes.

---

## Arquitetura multi-agente

Cada agente tem contexto limpo + skill especializada. Nenhum agente faz tudo.
Comunicação via JSON estruturado. Prose de resposta comprimida (TOKEN_EFFICIENCY.md).

```
Usuário
  │
  ├── Agente de Planejamento   → /api/ai/planning
  ├── Agente de Ideias         → /api/ai/ideas
  ├── Agente de Enriquecimento → /api/prospection/enrich (background job)
  ├── Agente Qualificador      → /api/prospection/qualify (background job)
  └── Agente Assistente        → /api/ai/chat (fase 2)
```

---

## 1. Agente de Planejamento

**Arquivo:** `lib/anthropic/planning-agent.ts`
**Rota:** `POST /api/ai/planning`
**Trigger:** usuário clica "Criar Planejamento" após preencher objetivos

**Contexto injetado:**
- `user_marketing_context` completo (8 dimensões)
- Histórico de posts dos últimos 90 dias (quantidade, tipo, engajamento médio)
- Metas do usuário (reuniões, vendas, prospecções)

**Skills carregadas no system prompt:**
- Framework pilares: 40% Educacional, 20% Bastidores, 15% Prova Social, 15% Engajamento, 10% Promocional
- Estrutura de vídeo: 0-3s hook / 3-15s problema / 15-50s valor / 50-60s CTA
- Tipos de hook: Curiosidade / Contrariedade / História / Valor direto
- Posts isca: palavra gatilho + oferta em DM
- Principios de marketing psychology (loss aversion, social proof, scarcity)

**Output esperado (sempre em JSON + prose justificada):**
```json
{
  "posts_por_semana": 4,
  "distribuicao_pilares": {
    "educacional": 8, "bastidores": 4, "prova_social": 3,
    "engajamento": 3, "promocional": 2
  },
  "reels_mes": 14,
  "carrosseis_mes": 6,
  "ideias_isca": [
    { "tema": "...", "palavra_isca": "...", "oferta": "...", "justificativa": "..." }
  ],
  "sugestoes_hook": ["...", "..."],
  "regras_constancia": "...",
  "justificativa_geral": "..."
}
```

**Regra crítica:** toda recomendação DEVE citar qual pilar/princípio justifica.
**Limite:** max_tokens: 3000. Streaming via SSE.
**Modelo:** claude-sonnet-4-20250514

---

## 2. Agente de Ideias

**Arquivo:** `lib/anthropic/ideas-agent.ts`
**Rota:** `POST /api/ai/ideas`
**Trigger:** usuário clica "Gerar com IA" no modal de criação de ideia

**Contexto injetado:**
- `pilar` selecionado pelo usuário
- `objetivo_negocio` selecionado (isca/autoridade/viralização/conversão)
- `user_marketing_context.produto` + `voz_marca` + `icp_psicografico.dor`

**Skills carregadas:**
- Fórmulas de hook (curiosidade, contrariedade, história, valor direto)
- Estrutura de roteiro 0-3s/3-15s/15-50s/50-60s
- Princípios de copywriting (dor → agitação → solução)

**Output esperado (JSON puro):**
```json
{
  "hook_ideas": [
    "Frase de hook 1 (tipo: curiosidade)",
    "Frase de hook 2 (tipo: contrariedade)",
    "Frase de hook 3 (tipo: valor direto)"
  ],
  "cta_ideas": [
    "CTA 1 — comente X",
    "CTA 2 — salve esse vídeo",
    "CTA 3 — manda DM com Y"
  ],
  "roteiro_sugestao": "0-3s: [hook sugerido]\n3-15s: [problema]\n15-50s: [valor]\n50-60s: [CTA]",
  "hashtags": ["#nicho1", "#nicho2", "#nicho3", "#viral1", "#viral2"],
  "legenda_sugestao": "..."
}
```

**Regra:** ideias são sugestões, não obrigatórias. Usuário edita livremente.
**Limite:** max_tokens: 1000. Resposta direta (sem streaming).
**Modelo:** claude-sonnet-4-20250514

---

## 3. Agente de Enriquecimento

**Arquivo:** `lib/anthropic/enrichment-agent.ts`
**Trigger:** automático após Apify job completar
**Execução:** background job via Edge Function (não bloqueia UI)

**Contexto injetado por lead:**
- `bio_instagram` (se origem IG)
- `nome_perfil` + `username`
- `posts_recentes[]` (últimos 3, caption apenas)
- Dados brutos do Apify (localization, followers_count, etc)

**Skills carregadas:**
- Lead research: sinais de necessidade, identificação de empresa
- Extração empresa de bio (CEO de X, Fundador da Y, @empresa)

**Output esperado (JSON por lead):**
```json
{
  "empresa": "Nome da Empresa ou null",
  "nicho": "categoria do negócio",
  "porte": "MEI | pequena | média | grande",
  "tempo_mercado_estimado": "2 anos | desconhecido",
  "tem_site": true,
  "tem_ig_ativo": true,
  "confianca": "alta | media | baixa",
  "fonte_empresa": "bio | post | pesquisa_web"
}
```

**Tool ativa:** `web_search` (Anthropic) para buscar empresa quando bio indica nome.
**Limite:** max_tokens: 500 por lead. Processar em lotes de 10.
**Modelo:** claude-sonnet-4-20250514

---

## 4. Agente Qualificador

**Arquivo:** `lib/anthropic/qualifier-agent.ts`
**Trigger:** automático após enriquecimento completar
**Execução:** background job (mesmo Edge Function do enriquecimento)

**Contexto injetado:**
- Lead enriquecido (output do Agente de Enriquecimento)
- `user_marketing_context.icp_firmografico` (segmentos, porte, cidade)
- `user_marketing_context.icp_psicografico` (dor, gatilho)
- Filtros selecionados pelo usuário na busca (tem_site, tem_ig_ativo, etc)

**Skills carregadas:**
- ICP scoring: firmographic match + psychographic signals
- Score A/B/C: A = match alto, B = match parcial, C = fraco mas possível

**Output esperado (JSON por lead):**
```json
{
  "qualificado": true,
  "score": "A",
  "match_icp": {
    "segmento": true,
    "porte": true,
    "cidade": false,
    "tem_site": true
  },
  "motivo_desqualificacao": null,
  "observacao_qualificacao": "Perfil alinha com ICP: segmento saúde, pequena empresa, IG ativo"
}
```

**Limite:** max_tokens: 300 por lead. Processar em lotes de 20.
**Modelo:** claude-sonnet-4-20250514

---

## 5. Agente Assistente Geral

**Arquivo:** `lib/anthropic/assistant-agent.ts`
**Rota:** `POST /api/ai/chat`
**Status:** 🟡 Em desenvolvimento — fase 2

**Contexto injetado:**
- `user_marketing_context` completo
- Métricas últimos 30 dias (dashboard summary)
- Pipeline atual (etapas + contagens)
- Calendário do mês corrente

**Tools disponíveis:**
```typescript
tools: [
  { name: "get_leads", description: "Busca leads com filtros" },
  { name: "get_metrics", description: "Métricas por período" },
  { name: "get_content_calendar", description: "Calendário do mês" },
  { name: "get_post_performance", description: "Dados de um post específico" }
]
```

**Escopo:**
- ✅ Analisar performance de conteúdo
- ✅ Priorizar leads por probabilidade
- ✅ Sugerir abordagens baseadas em ICP
- ✅ Explicar métricas e deltas
- ❌ Agendamentos, envios, decisões financeiras

**Limites:**
- Rate limit: 50 msg/dia por usuário
- Contexto: últimas 20 mensagens
- Cache: queries idênticas por 1h
- Tracking: `chat_usage_logs`
- max_tokens: 1500

---

## Regras gerais para todos os agentes

1. Ler TOKEN_EFFICIENCY.md — prose comprimida, código intacto
2. Nunca inventar dados — só usar contexto injetado + tool results
3. Output JSON: nunca incluir markdown fences (```json) — JSON puro
4. Errors: retornar `{ error: string, code: string }` — nunca throw
5. Timeout: 30s max por chamada — Edge Function limit
6. Log tokens usados em `chat_usage_logs` após cada chamada
