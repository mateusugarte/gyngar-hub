# PROMPT ZERO — Gyngar.hub
> Este é o PRIMEIRO prompt que você envia ao Claude Code.
> Objetivo: conectar ao GitHub e preparar a fundação completa do projeto.
> Enviar uma única vez. Só avançar quando tudo estiver funcionando.

---

## Como usar

1. Instale o Claude Code: `npm install -g @anthropic-ai/claude-code`
2. Crie a pasta do projeto: `mkdir gyngar-hub && cd gyngar-hub`
3. Coloque na raiz: `CLAUDE.md`, `initialDesign.md`, `AGENTS.md`, `TESTING.md`, `TOKEN_EFFICIENCY.md`
4. Coloque na pasta `.claude/skills/design/`: os arquivos da Nothing Design skill
5. Abra o Claude Code: `claude`
6. Cole o prompt abaixo

---

## PROMPT ZERO — Colar no Claude Code

```
Leia CLAUDE.md, initialDesign.md, AGENTS.md, TESTING.md e TOKEN_EFFICIENCY.md antes de começar.

Você está iniciando o projeto Gyngar.hub — um SaaS de organização empresarial.
Esta é a Etapa 0: GitHub + Fundação completa.

## PARTE 1 — GitHub (fazer primeiro)

1. Inicializar repositório Git local:
   git init
   git add .
   git commit -m "chore: initial project setup — docs and config"

2. Criar repositório no GitHub via CLI (se gh CLI disponível):
   gh repo create gyngar-hub --private --source=. --remote=origin --push
   
   Se gh CLI não disponível, instrua o usuário a:
   - Criar repo em github.com/new com nome "gyngar-hub" (privado)
   - Executar:
     git remote add origin https://github.com/[SEU-USER]/gyngar-hub.git
     git branch -M main
     git push -u origin main

3. Criar branch de desenvolvimento:
   git checkout -b dev

4. Criar .gitignore completo incluindo:
   .env.local, .env*.local, node_modules/, .next/, .vercel/
   Nunca commitar: chaves de API, tokens, arquivos .env com segredos

## PARTE 2 — Setup Next.js

5. Criar projeto Next.js:
   npx create-next-app@latest . --typescript --tailwind --app --src-dir=false --import-alias="@/*"

6. Instalar dependências base:
   npm install @supabase/supabase-js @supabase/ssr
   npm install @anthropic-ai/sdk
   npm install zustand react-hook-form zod @hookform/resolvers
   npm install recharts @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
   npm install lucide-react class-variance-authority clsx tailwind-merge
   npm install -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react

7. Instalar shadcn/ui:
   npx shadcn@latest init
   Selecionar: TypeScript, tailwind, app router, src/
   Instalar componentes: npx shadcn@latest add button card input label select dialog dropdown-menu avatar badge separator toast tabs

## PARTE 3 — Configuração de Design

8. Substituir globals.css com os tokens do initialDesign.md:
   - Adicionar todos os tokens [data-theme="dark"] e [data-theme="light"]
   - Importar Google Fonts: Space Grotesk + Space Mono
   - Configurar body com font-family Space Grotesk

9. Atualizar tailwind.config.ts com o mapeamento de tokens do initialDesign.md

10. Criar utilitário de tema em lib/theme.ts:
    - Função initTheme(): lê localStorage 'gyngar-theme' ou prefers-color-scheme
    - Função toggleTheme(): alterna entre dark/light, salva em localStorage
    - Aplica via data-theme no document.documentElement

## PARTE 4 — Estrutura de Pastas

11. Criar a estrutura exata do CLAUDE.md:
    app/(auth)/login/page.tsx — página de login (placeholder)
    app/(auth)/register/page.tsx — página de registro (placeholder)
    app/(app)/dashboard/page.tsx — placeholder "Dashboard em construção"
    app/(app)/content/page.tsx — placeholder
    app/(app)/leads/page.tsx — placeholder
    app/(app)/prospection/page.tsx — placeholder
    app/(app)/agent/page.tsx — placeholder "Em desenvolvimento"
    app/(app)/settings/page.tsx — placeholder

    lib/supabase/client.ts — browser client
    lib/supabase/server.ts — server client com cookies
    lib/supabase/admin.ts — service role
    lib/anthropic/base.ts — wrapper base
    lib/apify/base.ts — wrapper base
    lib/instagram/graph-api.ts — wrapper base
    
    types/database.types.ts — tipagem do Supabase (manual por enquanto)
    stores/ui.ts — Zustand store para UI state
    hooks/useUser.ts — hook de autenticação

## PARTE 5 — Layout Base

12. Criar app/(app)/layout.tsx com:
    - Sidebar fixa de 56px (colapsável para 220px no hover)
    - Usando tokens CSS do initialDesign.md (var(--bg-sidebar), etc.)
    - Ícones Lucide (outline): LayoutDashboard, Video, Users, Radar, MessageCircle, Settings
    - Logo "G" quadrado 30px com background --accent
    - Ícone ativo: background accent-subtle, cor --accent-text, dot 4px --accent
    - Ícone inativo: cor --text-disabled
    - Header horizontal: saudação + filtro de período + sino + avatar
    - Sino com badge de contagem (começa em 0, realtime via Supabase depois)
    - Toggle de tema (sol/lua) no header

13. Criar app/(auth)/layout.tsx — layout centralizado para login/registro

## PARTE 6 — Variáveis de Ambiente

14. Criar .env.example com:
    NEXT_PUBLIC_SUPABASE_URL=
    NEXT_PUBLIC_SUPABASE_ANON_KEY=
    SUPABASE_SERVICE_ROLE_KEY=
    ANTHROPIC_API_KEY=
    META_APP_ID=
    META_APP_SECRET=
    NEXTAUTH_SECRET=

15. Criar .env.local (usuário deve preencher — não commitar)

## PARTE 7 — Configuração do Supabase

16. Criar supabase/migrations/001_initial.sql com as tabelas do CLAUDE.md:
    - Todas as tabelas listadas na seção 5 do CLAUDE.md
    - RLS em todas: ALTER TABLE ... ENABLE ROW LEVEL SECURITY
    - Policy padrão: USING (user_id = auth.uid())
    - Extensão pgcrypto: CREATE EXTENSION IF NOT EXISTS pgcrypto
    - Trigger: criar user_settings + user_marketing_context + user_goals automaticamente ao criar usuário

## PARTE 8 — Autenticação

17. Criar app/(auth)/login/page.tsx funcional:
    - Formulário email + senha com react-hook-form + zod
    - Server Action loginAction() usando Supabase Auth
    - Redirect para /dashboard após sucesso
    - Link para /register
    - Visual usando tokens do initialDesign.md

18. Criar app/(auth)/register/page.tsx funcional:
    - Formulário nome + email + senha
    - Server Action registerAction()
    - Trigger Supabase cria registros relacionados automaticamente

19. Criar middleware.ts:
    - Protege todas as rotas /(app)/*
    - Redireciona para /login se sem sessão válida
    - Redireciona para /dashboard se logado e tentando acessar /login

## PARTE 9 — Página de Configurações

20. Criar app/(app)/settings/page.tsx com 3 seções:
    - Seção Instagram: botão "Conectar Instagram" (placeholder, sem OAuth ainda)
    - Seção Apify: input de texto para colar chave de API → salvar em user_settings
    - Seção Metas: campos numéricos reunioes_meta, vendas_meta, prospeccoes_diarias_meta

## VERIFICAÇÃO FINAL

Antes de declarar Etapa 0 concluída, executar:
  npm run build
  npx tsc --noEmit
  npm run lint
  grep -rn "TODO\|FIXME\|placeholder" app/ lib/ --include="*.ts" --include="*.tsx" | grep -v "page.tsx"

O resultado deve ser:
✅ git push para GitHub funcionando
✅ npm run dev abre sem erros
✅ /login renderiza com o design correto (paleta laranja/carvão do initialDesign.md)
✅ Login funcional com Supabase
✅ Sidebar visível com ícones e logo "G"
✅ Chave Apify pode ser salva em /settings
✅ Toggle de tema dark/light funcionando

Ao concluir, commitar tudo:
  git add .
  git commit -m "feat: etapa 0 — fundação, auth, layout e design system"
  git push origin dev
```
## PARTE 1.5 — Conexão com Supabase

Antes de qualquer código, conectar o projeto ao Supabase.

### Passo A — Instalar Supabase CLI (se não tiver)
Execute no terminal:
  npm install -g supabase

Verificar instalação:
  supabase --version

### Passo B — Login no Supabase CLI
  supabase login
  (abre browser para autenticar com a conta Supabase do usuário)

### Passo C — Inicializar Supabase no projeto
  supabase init
  (cria pasta supabase/ com config.toml na raiz do projeto)

### Passo D — Linkar ao projeto remoto
O usuário deve ter criado o projeto no dashboard.supabase.com antes deste passo.
Pedir ao usuário o PROJECT_ID (encontrado em Settings > General no dashboard).

  supabase link --project-ref SEU_PROJECT_ID
  (autentica e vincula o repo local ao projeto remoto)

### Passo E — Criar o arquivo .env.local com os dados reais
Criar o arquivo .env.local na raiz com o seguinte conteúdo.
Os valores NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
estão em: dashboard.supabase.com → projeto → Settings → API.
O SUPABASE_SERVICE_ROLE_KEY está na mesma página, em "service_role".

Conteúdo do .env.local:
  # Supabase
  NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

  # Anthropic
  ANTHROPIC_API_KEY=sk-ant-...

  # Meta / Instagram (preencher depois)
  META_APP_ID=
  META_APP_SECRET=

  # Auth
  NEXTAUTH_SECRET=gyngar_secret_troque_em_producao

IMPORTANTE: confirmar que .env.local está no .gitignore antes de qualquer commit.
Rodar: grep ".env.local" .gitignore
Se não aparecer, adicionar manualmente.

### Passo F — Criar o arquivo .env.example (para versionamento seguro)
Criar .env.example com os mesmos campos mas sem os valores:
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  ANTHROPIC_API_KEY=
  META_APP_ID=
  META_APP_SECRET=
  NEXTAUTH_SECRET=

Este arquivo PODE e DEVE ser commitado. É o guia para outros devs.

### Passo G — Criar a migration inicial e aplicar no Supabase remoto
Criar o arquivo supabase/migrations/001_initial.sql com o SQL completo
de todas as tabelas da seção 5 do CLAUDE.md, incluindo:
  - CREATE EXTENSION IF NOT EXISTS pgcrypto;
  - Todas as tabelas com user_id + timestamps
  - RLS ativo em todas: ALTER TABLE x ENABLE ROW LEVEL SECURITY
  - Policy padrão em todas: 
      CREATE POLICY "user_isolation" ON x
        FOR ALL USING (user_id = auth.uid());
  - Trigger para criar user_settings + user_marketing_context + user_goals
    automaticamente quando um usuário é criado no auth.users:

    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger AS $$
    BEGIN
      INSERT INTO public.user_settings (user_id) VALUES (NEW.id);
      INSERT INTO public.user_marketing_context (user_id) VALUES (NEW.id);
      INSERT INTO public.user_goals (user_id) VALUES (NEW.id);
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

Após criar o arquivo, aplicar no banco remoto:
  supabase db push

Verificar no dashboard.supabase.com → Table Editor que as tabelas apareceram.

### Passo H — Gerar tipos TypeScript do banco
  supabase gen types typescript --linked > types/database.types.ts

Este arquivo é gerado automaticamente a partir do banco real.
Commitar normalmente — não contém segredos.

### Verificação da conexão Supabase
Antes de avançar, confirmar:
  ✅ supabase db push rodou sem erros
  ✅ Tabelas visíveis no Table Editor do dashboard
  ✅ .env.local existe com URL e chaves preenchidas
  ✅ .env.local está no .gitignore (nunca commitado)
  ✅ .env.example commitado com campos vazios
  ✅ types/database.types.ts gerado e commitado