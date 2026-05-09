# Roadmap.md — Gyngar.hub
> Roadmap detalhado por página. Cada etapa é uma sessão de trabalho no Claude Code.

---

## Legenda
- 🔴 Não iniciado
- 🟡 Em andamento
- 🟢 Concluído

---

## ETAPA 0 — Fundação (pré-tudo)

> Sem isso, nada funciona. Fazer primeiro.

| # | Tarefa | Descrição |
|---|--------|-----------|
| 0.1 | Setup repositório | Criar repo GitHub, branch `main` + `dev`, .gitignore |
| 0.2 | Projeto Next.js | `create-next-app` com TypeScript, Tailwind, App Router |
| 0.3 | Supabase projeto | Criar projeto, copiar URL + anon key + service role |
| 0.4 | Variáveis de ambiente | `.env.local` + `.env.example` com todas as vars |
| 0.5 | shadcn/ui | Instalar e configurar componentes base |
| 0.6 | Layout base | Sidebar com navegação entre 5 módulos, header com avatar |
| 0.7 | Auth completo | Login, registro, recuperação de senha, sessão persistente |
| 0.8 | Middleware de auth | Redirecionar rotas protegidas para /login se sem sessão |
| 0.9 | Migrations base | Criar todas as tabelas do banco + RLS policies |
| 0.10 | CLAUDE.md no repo | Commitar CLAUDE.md na raiz |

**Critério de conclusão:** conseguir logar, ver sidebar, e estar logado após refresh.

---

## ETAPA 1 — Página: Dashboard

| # | Tarefa | Descrição |
|---|--------|-----------|
| 1.1 | Supabase RPC | Criar função `get_dashboard_metrics(user_id, start, end)` retornando JSON completo |
| 1.2 | DateRangeFilter | Componente com presets: hoje, semana, mês, personalizado |
| 1.3 | MetricCard | Componente reutilizável: label, valor, delta %, sparkline 7 pontos |
| 1.4 | Grupo Conteúdo | Cards: impressões, vídeo top, posts feitos, posts previstos, leads isca |
| 1.5 | Grupo Prospecção | Cards: leads pré-qualificados, por origem, desqualificados, prospecções feitas, meta diária |
| 1.6 | Grupo Metas | Cards: reuniões agendadas, vendas concluídas (com barra de progresso) |
| 1.7 | Gráfico 1 | Funil de conversão (impressões → leads → reuniões → vendas) — Recharts Funnel |
| 1.8 | Gráfico 2 | Evolução prospecções vs meta diária — AreaChart Recharts |
| 1.9 | Gráfico 3 | Engajamento por tipo de post (Isca/Educação/Viralização) — BarChart agrupado |
| 1.10 | Cache | `React.cache()` por 5 min + `revalidatePath('/dashboard')` em mutations |

**Critério de conclusão:** dashboard carrega com dados reais do banco, filtro de data funciona, deltas calculados.

---

## ETAPA 2 — Página: Conteúdo (parte 1 — Personalização + Calendário)

| # | Tarefa | Descrição |
|---|--------|-----------|
| 2.1 | Tabelas | `user_marketing_context`, `content_ideas`, `content_calendar`, `instagram_posts` |
| 2.2 | Fluxo OAuth Instagram | Botão conectar → redirect Meta → callback → salvar token em `user_settings` |
| 2.3 | Token refresh CRON | Edge Function rodando a cada 45 dias para renovar token Instagram |
| 2.4 | Sync posts Instagram | Função que puxa posts do Graph API e salva em `instagram_posts` |
| 2.5 | Questionário ICP (8 dimensões) | Formulário multi-step com selects pré-prontos + campos livres |
| 2.6 | Agente de Planejamento | POST /api/ai/planning → Anthropic API → stream resposta com SSE |
| 2.7 | Salvar marketing context | Server Action: salva jsonb em `user_marketing_context` |
| 2.8 | Calendário mensal | Visualização mensal com chips por dia (posts agendados/publicados) |
| 2.9 | Calendário semanal | Toggle para view semanal com mais detalhes |
| 2.10 | Painel lateral do dia | Ao clicar no dia → painel direito com cards de posts do dia |
| 2.11 | Notificação de post | Salvar `data_agendada` no `content_calendar` (sem publicação automática) |
| 2.12 | Métricas de conteúdo | Cards com filtro de período conectados ao `instagram_posts` |

**Critério de conclusão:** usuário conecta Instagram, preenche personalização, vê planejamento da IA, visualiza calendário.

---

## ETAPA 3 — Página: Conteúdo (parte 2 — Ideias + Planejamento Mensal)

| # | Tarefa | Descrição |
|---|--------|-----------|
| 3.1 | Banco de ideias | Listagem de `content_ideas` com filtros por tipo, pilar, status |
| 3.2 | Modal criar ideia | Formulário completo: tipo, pilar, objetivo, ideias de hook[], ideias de CTA[], roteiro sugestão, hashtags, legenda |
| 3.3 | Posts isca | Campos extras no modal: palavra_isca, oferta_isca |
| 3.4 | Gerar ideia com IA | Botão no modal → Anthropic API → retorna sugestões de hook, CTA, roteiro (não obrigatório usar) |
| 3.5 | Status do card | Badges: ideia / produção / agendado / publicado com transições |
| 3.6 | Planejamento mensal — início | Modal "Criar Planejamento do Mês": selecionar quantidade total |
| 3.7 | Distribuição por pilar | IA sugere distribuição 40/20/15/15/10 + usuário ajusta |
| 3.8 | Distribuição temporal | Algoritmo distribui posts no calendário (regra: promocional nunca 2 dias seguidos) |
| 3.9 | Finalizar planejamento | Salva tudo em `content_calendar` com datas definidas |
| 3.10 | CRUD completo | Editar, excluir, mover status manualmente em qualquer ideia/post |

**Critério de conclusão:** usuário cria ideias, usa IA para sugestões, faz planejamento mensal e vê no calendário.

---

## ETAPA 3.5 — Sistema de Notificações (transversal a todos os módulos)

> Construir logo após Leads e antes do Dashboard para que as notificações já apareçam ao montar os outros módulos.

| # | Tarefa | Descrição |
|---|--------|-----------|
| 3.5.1 | Tabela `notifications` | `user_id, tipo, titulo, mensagem, lida, link_destino, icone, created_at` — RLS por user_id |
| 3.5.2 | Sino no header | Componente `<NotificationBell />` com badge de contagem não lidas. Realtime via Supabase channel. |
| 3.5.3 | Painel de notificações | Dropdown/drawer ao clicar: lista de notificações, marcar como lida, link para contexto |
| 3.5.4 | Tipos de notificação | Enum: `lead_parado \| job_concluido \| token_expirando \| post_hora \| meta_atingida \| lead_isca_novo` |
| 3.5.5 | CRON — leads esquecidos | Edge Function diária 9h: lead +5 dias na etapa → notif "🟡 [Nome] esfriando — 5 dias sem contato" |
| 3.5.6 | CRON — leads críticos | Edge Function diária 9h: lead +10 dias → notif urgente "🔴 [Nome] perdendo — ação necessária" |
| 3.5.7 | CRON — posts do dia | Edge Function diária 8h: posts agendados para hoje no calendário → notif "📅 [X] posts para hoje" |
| 3.5.8 | CRON — post atrasado | Edge Function diária 22h: post agendado hoje não marcado como publicado → notif "⚠️ [Título] não postado" |
| 3.5.9 | CRON — token Instagram | Edge Function semanal: token expira em <15 dias → notif "🔗 Reconecte seu Instagram" |
| 3.5.10 | Notif — job Apify | Ao finalizar job de prospecção: "✅ [X] leads coletados, [Y] qualificados — ver resultados" |
| 3.5.11 | Notif — lead isca | Ao detectar comentário isca no CRON de posts: "💬 [Username] comentou [palavra] no post [título]" |
| 3.5.12 | Notif — meta atingida | Ao mover lead para venda_concluida que atinge meta: "🎯 Meta de vendas atingida!" |
| 3.5.13 | Preferências de notif | Tela em /settings: usuário ativa/desativa cada tipo de notificação |

**Critério de conclusão:** sino aparece no header com contagem real, pelo menos 3 tipos de notificação sendo gerados automaticamente pelo CRON.

---

## ETAPA 4 — Página: Leads / Pipeline

| # | Tarefa | Descrição |
|---|--------|-----------|
| 4.1 | Tabelas | `leads_qualified` com constraints UNIQUE + `pipeline_notifications` |
| 4.2 | Kanban base | @dnd-kit com 5 colunas: Contato Feito, Possível Interesse, Reunião Agendada, Venda Concluída, Recusa |
| 4.3 | Drag and drop | Arrastar card entre colunas → atualiza `etapa` + `data_entrada_etapa` no banco |
| 4.4 | LeadCard | Card com: nome, nicho, origem (badge), score A/B/C, badge de alerta (amarelo/vermelho se parado), próxima ação |
| 4.5 | Modal de lead | Edição completa do card com todos os campos |
| 4.6 | Atributo follow-up | Campo `proxima_acao` no modal: tipo + data + descrição |
| 4.7 | Coluna Recusa | Leads descartados ou sem interesse (não aparecem nas métricas de pipeline ativo) |
| 4.8 | Filtro de período | Semana (padrão), mês, personalizado |
| 4.9 | Adicionar lead manual | Botão "+ Lead" com formulário completo |
| 4.10 | Métricas laterais | Prospecções feitas, leads qualificados, leads captados, leads do Instagram |
| 4.11 | CRON leads parados | Edge Function diária 9h → 5 dias = amarelo, 10 dias = vermelho |
| 4.12 | Realtime sync | Supabase channels para atualização multi-device |

**Critério de conclusão:** Kanban funcional com drag, leads com alertas automáticos, coluna Recusa separada.

---

## ETAPA 5 — Página: Prospecção

| # | Tarefa | Descrição |
|---|--------|-----------|
| 5.1 | Tabelas | `scraping_jobs`, `leads_raw`, confirmação de constraints UNIQUE |
| 5.2 | Campo chave Apify | Tela de configurações → usuário cola sua própria chave Apify → salva em `user_settings` (criptografada) |
| 5.3 | Tela Captar Leads | Formulário de filtros com enums: tem_site, ig_ativo, min/max_seguidores, conta_business, tempo_mercado, cidade, nicho |
| 5.4 | Seleção de fonte | Tabs: IG Comentários, IG Seguidores, Google Maps (cada um com seus campos específicos) |
| 5.5 | Job assíncrono | POST /api/prospection/start → cria job → dispara Apify → retorna job_id |
| 5.6 | Status em tempo real | SSE polling do job_id → atualiza UI com progresso |
| 5.7 | Resultado da busca | Tabela com leads brutos coletados + botão "Enriquecer Perfis" |
| 5.8 | Enriquecimento IA | Anthropic API com web_search: tempo de mercado, nicho, porte, empresa (para perfis de empresários) |
| 5.9 | Qualificação vs ICP | IA compara perfil enriquecido com `user_marketing_context.icp` → score + qualificado/desqualificado |
| 5.10 | Deduplicação | Upsert via UNIQUE(user_id, instagram_handle) — duplicatas atualizam `ultima_visualizacao` |
| 5.11 | Salvar leads selecionados | Usuário seleciona quais salvar → INSERT em `leads_qualified` |
| 5.12 | Leads Captados API | Lista de leads qualificados com origem, status de contato, botão "Contato Feito" → move para pipeline |
| 5.13 | Leads Captados Instagram | Lista de leads isca com post de origem, data do comentário, isca enviada |

**Critério de conclusão:** usuário cola chave Apify, faz busca, vê resultados enriquecidos, salva leads qualificados no pipeline.

---

## ETAPA 6 — Agente IA (fase 2 — pós-validação)

| # | Tarefa | Descrição |
|---|--------|-----------|
| 6.1 | Interface de chat | UI de chat com histórico de mensagens e SSE streaming |
| 6.2 | Context loader | Carregar marketing context + pipeline atual + métricas 30d no system prompt |
| 6.3 | Tools customizadas | get_leads, get_metrics, get_content_calendar, get_post_performance |
| 6.4 | Rate limiting | 50 mensagens/dia por usuário + tracking em `chat_usage_logs` |
| 6.5 | Escopo do agente | System prompt com escopo: conteúdo, leads, prospecção, métricas |

---

## Ordem de Execução Recomendada

```
Etapa 0 (Fundação)
    ↓
Etapa 4 (Leads — mais simples, sem APIs externas, valida rápido)
    ↓
Etapa 1 (Dashboard — depende dos dados de Leads)
    ↓
Etapa 5 (Prospecção — alimenta o Pipeline com dados reais)
    ↓
Etapa 2 (Conteúdo parte 1 — Instagram OAuth + Calendário)
    ↓
Etapa 3 (Conteúdo parte 2 — Ideias + Planejamento Mensal)
    ↓
Etapa 6 (Agente IA — quando os módulos anteriores tiverem dados)
```

**Lógica dessa ordem:** validar o core de leads e prospecção primeiro (produto funciona sem Instagram conectado) → depois conectar métricas → depois adicionar a camada de conteúdo mais rica → IA por último quando tiver contexto real para treinar o agente.
