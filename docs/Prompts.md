# Prompts.md — Gyngar.hub
> Primeiros 5 prompts para enviar ao Claude Code em sequência.
> Enviar um de cada vez. Só avançar para o próximo quando o anterior estiver funcionando.

---

## Como usar

1. Abra o Claude Code na raiz do projeto
2. Cole o prompt exatamente como está
3. Revise o que foi gerado, teste localmente
4. Quando estiver funcionando → próximo prompt

---

## PROMPT 1 — Fundação completa (Etapa 0)

```
Você está construindo o Gyngar.hub, um SaaS multi-tenant de organização empresarial.
Leia o arquivo CLAUDE.md antes de começar.

Construa a fundação completa do projeto:

1. NEXT.JS SETUP
- App Router com TypeScript estrito
- Tailwind CSS configurado
- shadcn/ui instalado com componentes: button, card, input, label, select, dialog, dropdown-menu, avatar, badge, separator, toast
- Estrutura de pastas exatamente conforme o CLAUDE.md

2. SUPABASE
- Instalar @supabase/supabase-js e @supabase/ssr
- Criar /lib/supabase/client.ts (browser client)
- Criar /lib/supabase/server.ts (server client com cookies)
- Criar /lib/supabase/admin.ts (service role para Edge Functions)

3. MIGRATIONS SUPABASE
Criar o arquivo supabase/migrations/001_initial.sql com as seguintes tabelas:

user_settings:
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE
  ig_access_token text (criptografado)
  ig_account_id text
  apify_api_key text (criptografado)
  ig_token_expires_at timestamptz
  created_at timestamptz DEFAULT now()
  updated_at timestamptz DEFAULT now()

user_marketing_context:
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE
  produto jsonb DEFAULT '{}'
  icp_firmografico jsonb DEFAULT '{}'
  icp_psicografico jsonb DEFAULT '{}'
  persona_decisora jsonb DEFAULT '{}'
  diferencial text
  voz_marca text[]
  jtbd_conteudo text
  prova_social jsonb DEFAULT '{}'
  updated_at timestamptz DEFAULT now()

user_goals:
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE
  reunioes_meta integer DEFAULT 0
  vendas_meta integer DEFAULT 0
  prospeccoes_diarias_meta integer DEFAULT 0
  updated_at timestamptz DEFAULT now()

content_ideas:
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
  titulo text NOT NULL
  tipo text CHECK (tipo IN ('reels', 'carrossel', 'story'))
  pilar text CHECK (pilar IN ('educacional', 'bastidores', 'prova_social', 'engajamento', 'promocional'))
  objetivo text CHECK (objetivo IN ('isca', 'autoridade', 'viralizacao', 'conversao', 'educacao'))
  hook_ideas text[]
  cta_ideas text[]
  roteiro_sugestao text
  hashtags text[]
  legenda text
  palavra_isca text
  oferta_isca text
  status text DEFAULT 'ideia' CHECK (status IN ('ideia', 'producao', 'agendado', 'publicado'))
  data_agendada timestamptz
  ig_media_id text
  created_at timestamptz DEFAULT now()
  updated_at timestamptz DEFAULT now()

content_calendar:
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
  idea_id uuid REFERENCES content_ideas(id) ON DELETE SET NULL
  data_planejada date NOT NULL
  status text DEFAULT 'planejado'
  notificacao_enviada boolean DEFAULT false
  created_at timestamptz DEFAULT now()

instagram_posts:
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
  ig_media_id text NOT NULL
  tipo text
  caption text
  impressions integer DEFAULT 0
  views integer DEFAULT 0
  likes integer DEFAULT 0
  comments_count integer DEFAULT 0
  saved integer DEFAULT 0
  data_publicacao timestamptz
  synced_at timestamptz DEFAULT now()
  UNIQUE(user_id, ig_media_id)

instagram_comments:
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
  ig_comment_id text NOT NULL
  post_id uuid REFERENCES instagram_posts(id)
  ig_post_id text
  autor_ig text
  texto text
  data_comentario timestamptz
  contem_palavra_isca boolean DEFAULT false
  palavra_isca_encontrada text
  UNIQUE(user_id, ig_comment_id)

leads_qualified:
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
  nome text
  telefone text
  instagram text
  email text
  empresa text
  nicho text
  porte text
  cidade text
  site text
  origem text CHECK (origem IN ('apify_ig_comments', 'apify_ig_followers', 'apify_gmaps', 'post_isca', 'manual'))
  origem_detalhe jsonb DEFAULT '{}'
  etapa text DEFAULT 'contato_feito' CHECK (etapa IN ('contato_feito', 'possivel_interesse', 'reuniao_agendada', 'venda_concluida', 'recusa'))
  data_entrada_etapa timestamptz DEFAULT now()
  proxima_acao jsonb DEFAULT '{}'
  valor_potencial numeric
  score text CHECK (score IN ('A', 'B', 'C'))
  observacoes text
  tags text[]
  alerta_parado text DEFAULT 'nenhum' CHECK (alerta_parado IN ('nenhum', 'amarelo', 'vermelho'))
  created_at timestamptz DEFAULT now()
  updated_at timestamptz DEFAULT now()
  UNIQUE(user_id, instagram), UNIQUE(user_id, telefone) DEFERRABLE INITIALLY DEFERRED

leads_instagram:
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
  comment_id uuid REFERENCES instagram_comments(id)
  post_id uuid REFERENCES instagram_posts(id)
  autor_ig text
  palavra_isca text
  oferta_isca_enviada text
  data_comentario timestamptz
  status text DEFAULT 'novo'
  created_at timestamptz DEFAULT now()

scraping_jobs:
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
  apify_run_id text
  fonte text CHECK (fonte IN ('ig_comments', 'ig_followers', 'gmaps'))
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'enriching', 'qualifying', 'completed', 'failed'))
  filtros jsonb DEFAULT '{}'
  total_coletado integer DEFAULT 0
  total_qualificados integer DEFAULT 0
  erro text
  created_at timestamptz DEFAULT now()
  updated_at timestamptz DEFAULT now()

leads_raw:
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
  job_id uuid REFERENCES scraping_jobs(id) ON DELETE CASCADE
  instagram_handle text
  dados_brutos jsonb DEFAULT '{}'
  dados_enriquecidos jsonb DEFAULT '{}'
  qualificado boolean
  motivo_desqualificacao text
  ultima_visualizacao timestamptz DEFAULT now()
  UNIQUE(user_id, instagram_handle)

Ativar RLS em todas as tabelas com policy: USING (user_id = auth.uid())

4. AUTH
- Página /login com email + senha usando Supabase Auth
- Página /register com nome + email + senha
- Server Action para login e registro
- Middleware Next.js que protege todas as rotas /(app)/*
- Redirect para /dashboard após login
- Criar registro em user_settings + user_marketing_context + user_goals na criação do usuário via trigger Supabase

5. LAYOUT BASE
- Layout principal /(app)/layout.tsx com sidebar fixa à esquerda
- Sidebar com links: Dashboard, Conteúdo, Leads, Prospecção, Agente IA
- Header com avatar do usuário + dropdown (perfil, configurações, logout)
- Área de conteúdo principal com padding adequado
- Design limpo, profissional, tema escuro como padrão (dark mode)

6. PÁGINA DE CONFIGURAÇÕES
- Rota /settings
- Seção "Instagram": botão "Conectar Instagram" (placeholder por enquanto, sem OAuth real)
- Seção "Apify": campo de texto para o usuário colar sua chave de API, salvar no banco
- Seção "Metas": campos numéricos para reunioes_meta, vendas_meta, prospeccoes_diarias_meta

O resultado deve ser: consigo rodar npm run dev, acessar /login, criar conta, entrar no dashboard (página em branco por enquanto), ver a sidebar, e conseguir salvar a chave Apify em /settings.
```

---

## PROMPT 2 — Pipeline de Leads + Kanban (Etapa 4)

```
Leia o CLAUDE.md antes de começar.
As tabelas já existem no banco. Construa a página completa de Leads em /leads.

1. KANBAN BOARD
- Instalar @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
- Componente KanbanBoard com 5 colunas:
  "Contato Feito" | "Possível Interesse" | "Reunião Agendada" | "Venda Concluída" | "Recusa"
- Coluna "Recusa" tem visual diferente (tom acinzentado, separada das outras)
- Drag and drop funcional entre colunas
- Ao soltar o card: Server Action atualiza etapa + data_entrada_etapa no banco

2. LEAD CARD
Componente LeadCard com:
- Nome + empresa em destaque
- Badge de origem (IG Comentário / IG Seguidores / Google Maps / Post Isca / Manual)
- Badge de score (A = verde, B = amarelo, C = laranja)
- Badge de alerta_parado (amarelo "Esfriando 🟡" se amarelo, vermelho "Perdendo 🔴" se vermelho)
- Nicho da empresa
- Próxima ação: se existir, mostrar data e ícone de lembrete
- Botão "..." para abrir modal de edição

3. MODAL DE LEAD (LeadModal)
Formulário completo com react-hook-form + zod:
- Aba "Dados": nome, telefone, instagram, email, empresa, nicho, porte, cidade, site
- Aba "Pipeline": etapa (select), score (select A/B/C), valor_potencial (número), observacoes (textarea)
- Seção "Próxima Ação": tipo (ligação/mensagem/reunião/email), data, descrição — salva em proxima_acao jsonb
- Seção "Tags": input para adicionar/remover tags
- Botão salvar → Server Action → upsert no banco

4. ADICIONAR LEAD MANUAL
Botão "+ Novo Lead" no topo da página → abre LeadModal vazio

5. FILTROS
- DateRangeFilter (mesmo componente do Dashboard): semana padrão / mês / personalizado
- Filtro por etapa (todas ou específica)
- Leads filtrados aparecem nas colunas correspondentes

6. MÉTRICAS LATERAIS
Sidebar direita (colapsável em mobile) com 4 cards:
- Total prospecções feitas (etapas excluindo Recusa)
- Leads qualificados (score A ou B)
- Total leads captados no período
- Leads vindos do Instagram (origem = post_isca)

7. SUPABASE REALTIME
Ativar canal realtime na tabela leads_qualified filtrado por user_id
Ao receber evento de UPDATE/INSERT → atualizar Kanban sem reload

8. EDGE FUNCTION — leads parados
Criar supabase/functions/check-stale-leads/index.ts
- Roda via CRON todo dia às 9h
- Query: leads com data_entrada_etapa < NOW() - INTERVAL '5 days' e etapa != 'recusa'
- 5 a 9 dias → alerta_parado = 'amarelo'
- 10+ dias → alerta_parado = 'vermelho'
- UPDATE em lote no banco

O resultado deve ser: Kanban funcional com drag, modal de edição completo, alertas de lead parado aparecendo nos cards.
```

---

## PROMPT 3 — Dashboard com Métricas Reais (Etapa 1)

```
Leia o CLAUDE.md antes de começar.
As tabelas já existem. Construa a página completa de Dashboard em /dashboard.

1. SUPABASE RPC
Criar função SQL get_dashboard_metrics(p_user_id uuid, p_start date, p_end date):
Retorna JSON com:
{
  conteudo: {
    impressoes_totais: number, impressoes_delta: number,
    video_top: { titulo, views, likes, comments, saved },
    posts_feitos: number,
    posts_previstos_mes: number,
    comentarios_recebidos: number,
    leads_isca: number, leads_isca_delta: number
  },
  prospeccao: {
    leads_pre_qualificados: number,
    leads_instagram: number,
    leads_google: number,
    leads_desqualificados: number,
    prospeccoes_feitas: number,
    meta_prospeccoes_hoje: number
  },
  metas: {
    reunioes_agendadas: number, reunioes_meta: number,
    vendas_concluidas: number, vendas_meta: number
  },
  graficos: {
    funil: [{ nome, valor }],
    prospeccoes_vs_meta: [{ data, feitas, meta }],  -- últimos 7 dias
    engajamento_por_tipo: [{ tipo, engajamento_medio }]
  }
}

Cálculo posts_previstos_mes:
  ideias programadas no mês atual (content_calendar com data_planejada no mês)
  + (média de posts por dia dos 3 meses anteriores × dias restantes no mês)

2. COMPONENTES

DateRangeFilter:
- Presets: Hoje / Esta semana / Este mês / Personalizado (date range picker)
- Armazena no estado URL (searchParams) para compartilhar link

MetricCard (reutilizável):
- Props: label, value, delta (opcional), format ('number'|'percent'|'currency'), sparkline (array 7 números, opcional)
- Delta positivo = verde com ↑, negativo = vermelho com ↓
- Sparkline usando Recharts ResponsiveContainer + LineChart simples

MetaCard (para metas):
- Props: label, atual, meta
- Barra de progresso colorida: verde se >= 80%, amarelo se 50-79%, vermelho se < 50%
- Texto: "X de Y (Z%)"

3. LAYOUT DA PÁGINA
Header: "Bom dia, [nome]! 👋" + DateRangeFilter alinhado à direita

Seção "Conteúdo" (grid 3 colunas):
  impressões | vídeo top (card maior) | posts feitos
  posts previstos | comentários | leads isca

Seção "Prospecção" (grid 3 colunas):
  leads pré-qualificados | leads IG | leads Google
  leads desqualificados | prospecções feitas | meta diária (destacado)

Seção "Metas" (grid 2 colunas):
  reuniões agendadas (MetaCard) | vendas concluídas (MetaCard)

Seção "Análises" (3 gráficos lado a lado):
  Funil de Conversão | Prospecções vs Meta (7 dias) | Engajamento por Tipo

4. LOADING E EMPTY STATES
- Skeleton loading para todos os cards enquanto carrega
- Se sem dados: ilustração simples + "Conecte seu Instagram e comece a prospectar"
- Se Instagram não conectado: banner no topo "Conecte seu Instagram para ver métricas de conteúdo"

5. PERFORMANCE
- Dados carregados via Server Component com Suspense boundaries por seção
- Revalidação a cada 5 minutos ou após ação do usuário

O resultado deve ser: dashboard carrega com todos os cards, filtro de data funciona, deltas calculados, 3 gráficos visíveis.
```

---

## PROMPT 4 — Prospecção com Apify (Etapa 5)

```
Leia o CLAUDE.md antes de começar.
As tabelas já existem. Construa a página de Prospecção em /prospection.

1. CONFIGURAÇÃO DE CHAVE APIFY
Verificar se user_settings.apify_api_key está preenchida.
Se não: banner de aviso "Configure sua chave Apify em Configurações" com link para /settings.

2. TELA PRINCIPAL DE PROSPECÇÃO
Duas abas:
- "Captar Leads" (formulário de busca)
- "Leads Captados" (sub-abas: API | Instagram)

3. FORMULÁRIO DE CAPTAÇÃO

Seção "Filtros de Qualificação":
Checkboxes: tem_site / tem_instagram_ativo (post < 30 dias) / conta_business
Campos numéricos: min_seguidores, max_seguidores
Select: tempo_mercado_min_anos (1, 2, 3, 5+ anos)
Input multi: cidade[] (adicionar/remover cidades)
Input multi: nicho[] (puxar do user_marketing_context.icp_firmografico se existir)

Seção "Fonte de Captação" (tabs):

Tab IG Comentários:
  - Input: URL da postagem
  - Input number: quantidade máxima de resultados
  - Info: "Coleta quem comentou nessa publicação"

Tab IG Seguidores:
  - Input: URL do perfil (concorrente ou referência)
  - Input number: quantidade máxima
  - Info: "Coleta seguidores desse perfil"

Tab Google Maps:
  - Input: nicho/tipo de negócio (ex: "clínica odontológica")
  - Input: cidade
  - Input number: quantidade máxima
  - Info: "Encontra negócios cadastrados no Maps"

Botão "Iniciar Busca" → POST /api/prospection/start

4. API ROUTE /api/prospection/start
- Valida chave Apify do usuário (user_settings)
- Cria registro em scraping_jobs (status: 'pending')
- Chama Apify API com o actor correto:
  IG Comentários: "apify/instagram-comment-scraper"
  IG Seguidores: "apify/instagram-follower-scraper"
  Google Maps: "apify/google-maps-scraper"
- Salva apify_run_id no job
- Retorna { job_id }

Usar a chave do usuário (user_settings.apify_api_key) para todas as chamadas Apify.

5. STATUS EM TEMPO REAL
Após iniciar busca:
- Esconder formulário, mostrar painel de status
- Polling a cada 5 segundos em /api/prospection/status?job_id=X
- Mostrar: "Coletando leads... (pode fechar esta tela)"
- Progress bar animada com status atual: pendente → coletando → enriquecendo → qualificando → concluído

API route /api/prospection/status:
  - Busca job no banco
  - Se apify_run_id: checa status na Apify API
  - Se finalizado: inicia enriquecimento (ver item 6)
  - Retorna { status, total_coletado, total_qualificados }

6. ENRIQUECIMENTO COM IA
Função /lib/anthropic/enrich-lead.ts:
Para cada lead coletado pelo Apify:
  - Se origem Instagram: detectar empresa a partir de bio (prompt: "Dado esta bio do Instagram: [bio]. Extraia: nome da empresa (se for empresário/fundador/CEO), nicho de atuação, tipo de conta (pessoal/empresarial/criador). Responda APENAS em JSON: {empresa, nicho, tipo_conta, confianca}")
  - Usar web_search tool da Anthropic para buscar: "[empresa] tempo de mercado funcionários"
  - Consolidar: empresa, nicho, porte estimado, tempo de mercado, tem_site

7. QUALIFICAÇÃO VS ICP
Após enriquecimento:
  - Carregar user_marketing_context do usuário
  - Comparar: nicho ↔ icp_firmografico.segmentos, cidade ↔ icp_firmografico.geografia
  - Aplicar filtros selecionados: tem_site, tem_instagram_ativo, etc.
  - Resultado: qualificado = true/false + motivo_desqualificacao

8. TELA DE RESULTADOS
Após job concluído:
- Tabela com leads coletados
- Colunas: checkbox seleção | nome/empresa | nicho | origem | qualificado (badge) | ações
- Leads desqualificados aparecem acinzentados com motivo em tooltip
- Botão "Salvar Selecionados" → INSERT em leads_qualified com deduplicação (upsert)
- Deduplicação: INSERT INTO leads_qualified ... ON CONFLICT (user_id, instagram) DO UPDATE SET ultima_visualizacao = now()

9. ABA LEADS CAPTADOS — API
Lista de leads_qualified com origem != 'post_isca'
- Filtros: nicho, score, já prospectado
- Card de lead expandível com dados completos
- Botão "Contato Feito" → muda etapa para 'contato_feito' + redireciona para /leads

10. ABA LEADS CAPTADOS — INSTAGRAM
Lista de leads_instagram
- Colunas: autor_ig | post de origem | data comentário | palavra isca | isca enviada | status
- Botão "Mover para Pipeline" → cria/atualiza em leads_qualified

O resultado deve ser: usuário configura chave Apify, faz busca, aguarda enriquecimento, vê resultados qualificados, salva no pipeline.
```

---

## PROMPT 5 — Conteúdo: Personalização + Calendário (Etapa 2)

```
Leia o CLAUDE.md antes de começar.
As tabelas já existem. Construa a página de Conteúdo em /content com as primeiras funcionalidades.

1. LAYOUT DA PÁGINA /content
Header com 4 botões de navegação interna:
  [📊 Métricas] [📅 Calendário] [💡 Ideias] [🎯 Objetivos]

Área de métricas no topo (sempre visível):
- impressões totais | vídeo com mais views | vídeos faltando postar | posts previstos no mês
- DateRangeFilter nos mesmos presets do Dashboard
- Banner se Instagram não conectado

2. BOTÃO "OBJETIVOS DE USUÁRIO"
Rota /content/objectives — formulário multi-step (wizard com progresso visual):

Step 1 — Produto:
  Input: "O que você vende?" (texto livre, máx 100 chars)
  Select: Categoria (Serviço / Produto físico / Produto digital / SaaS / Consultoria / Outro)
  Select: Modelo de venda (Recorrente / Avulso / Projeto / Misto)

Step 2 — ICP Firmográfico:
  Select múltiplo: Porte do cliente ideal (MEI / Pequena / Média / Grande empresa)
  Select múltiplo: Segmento (Saúde / Jurídico / Educação / E-commerce / Serviços / Tecnologia / Outro)
  Input: Cidades/regiões alvo

Step 3 — ICP Psicográfico:
  Textarea: "Principal dor do seu cliente ideal" (máx 200 chars)
  Select: Gatilho de compra mais comum (Crescimento acelerado / Falta de tempo / Perda de clientes / Recomendação / Problema urgente)
  Select múltiplo: O que ele usa hoje antes de você (Planilha / Processo manual / Concorrente direto / Nada / Outro)

Step 4 — Voz da Marca:
  Select múltiplo (máx 5): Adjetivos da marca (Profissional / Descontraído / Direto / Empático / Espirituoso / Autoritário / Próximo / Técnico / Inspirador)
  Select: JTBD do conteúdo (Educar / Entreter / Inspirar / Vender / Autoridade)

Step 5 — Prova Social:
  Textarea: Principais resultados ou métricas (ex: "Ajudei 50 empresas a crescerem 3x")
  Input: Número de clientes atendidos
  Textarea: Testemunho favorito (para a IA usar como referência de linguagem)

Ao submeter: salva em user_marketing_context + botão "Criar Planejamento" visível

3. AGENTE DE PLANEJAMENTO
Ao clicar "Criar Planejamento":
- Abrir modal com chat de IA
- POST /api/ai/planning com marketing_context completo
- System prompt do agente (arquivo /lib/anthropic/planning-agent.ts):

"""
Você é um estrategista de conteúdo especializado em Instagram para negócios B2B.
Contexto do usuário: {marketing_context}

Frameworks que você SEMPRE aplica:
- Mix de pilares: 40% Educacional, 20% Bastidores, 15% Prova Social, 15% Engajamento, 10% Promocional
- Estrutura de vídeo: 0-3s hook (interrompe o scroll), 3-15s problema, 15-50s valor, 50-60s CTA
- Para posts isca: a palavra isca aparece nos comentários + oferta de valor em DM
- Hooks funcionam por: Curiosidade / Contrariedade / História / Valor direto

Para CADA recomendação, você DEVE:
1. Explicar qual pilar essa recomendação atende
2. Citar qual princípio de marketing justifica a escolha
3. Dar um exemplo concreto aplicado ao negócio do usuário

Entregue um plano mensal com:
- Quantidade de posts por semana (Reels e Carrosséis separados)
- Distribuição pelos 5 pilares
- 3 ideias de posts isca personalizadas para o nicho
- 2 sugestões de hooks baseados no ICP
- Regras de constância recomendadas
"""

- Resposta em streaming (SSE) → aparece progressivamente no modal
- Botão "Salvar Planejamento" ao finalizar

4. CALENDÁRIO MENSAL
Rota /content/calendar

Visualização mensal:
- Grid do mês atual com todos os dias
- Cada dia mostra chips de posts: azul = planejado, verde = publicado, cinza = atrasado
- Máximo 3 chips visíveis por dia; se mais, "ver +X"
- Click no dia → abre painel lateral direito

Painel lateral do dia selecionado:
- Lista todos os posts do dia
- Card de cada post: tipo (badge), título da ideia, status
- Botão "Adicionar post neste dia" → abre seletor de ideias existentes ou criar nova

Toggle semana/mês no header do calendário

Botão "Criar Planejamento do Mês" → rota /content/planning (implementar no Prompt 3 do Claude Code)

5. SYNC INSTAGRAM (placeholder + real)
- Botão "Sincronizar Instagram" visível se ig_access_token existir em user_settings
- Se não conectado: botão "Conectar Instagram" → /settings
- Ao sincronizar: GET /api/instagram/sync → chama Graph API endpoint:
  GET /{ig-user-id}/media?fields=id,caption,media_type,timestamp,insights.metric(impressions,plays,likes,comments_count,saved)
  Salva em instagram_posts (upsert por ig_media_id)

O resultado deve ser: formulário de objetivos completo e funcional, agente de planejamento gerando respostas com justificativas, calendário visual com posts.
```

---

## Notas para condução após o Prompt 5

Os próximos prompts serão construídos iterativamente durante a execução. A partir do Prompt 6:
- Banco de ideias completo com modal de criação (Etapa 3)
- Planejamento mensal com distribuição automática (Etapa 3)
- OAuth real do Instagram (Etapa 2 complemento)
- Edge Functions de CRON (leads parados + sync Instagram + token refresh)

Cada prompt seguinte será refinado com base no que foi construído.
