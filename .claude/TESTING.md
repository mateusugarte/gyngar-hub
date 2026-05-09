# TESTING.md — Gyngar.hub
> Estratégia de testes por módulo. Leia antes de construir qualquer feature.
> TDD apenas onde comportamento é definível antes da implementação.

---

## Princípio

Existir ≠ funcionar. Verificar: existe → tem conteúdo real → está conectado → funciona.
Nunca marcar etapa concluída com TODO, placeholder ou `return null` sem lógica.

---

## O que usar TDD (escrever teste antes)

| Feature | Motivo |
|---------|--------|
| Cálculo de posts previstos | Input/output claro: `calcPostsPrevistas(planejados, mediaHistorica, diasRestantes)` |
| Filtro de leads parados | Lógica: `> 5 dias = amarelo`, `> 10 dias = vermelho` |
| Deduplicação de leads | Comportamento: mesmo instagram = upsert, não insert duplicado |
| Score de qualificação | Match ICP: segmento + porte + cidade → A/B/C |
| Cálculo delta de métricas | `calcDelta(atual, anterior)` → percentual com sinal |
| Detecção de palavra isca | `ILIKE '%palavra%'` em comentários |
| Distribuição de posts por pilar | 40/20/15/15/10 sobre total informado |

---

## O que NÃO usar TDD (testar após construção)

- Componentes React / UI visual
- Páginas Next.js
- Configuração de rotas
- Migrações Supabase
- Integrações externas (Apify, Instagram, Anthropic)
- CRON jobs

---

## Stack de testes

```bash
# Unit + integration
npm install -D vitest @testing-library/react @testing-library/jest-dom

# E2E (adicionar na fase 2)
npm install -D @playwright/test
```

Configuração em `vitest.config.ts` na raiz.

---

## Estrutura de arquivos de teste

```
__tests__/
├── unit/
│   ├── lib/
│   │   ├── metrics.test.ts       # calcDelta, calcPostsPrevistas
│   │   ├── leads.test.ts         # deduplicação, score, alertas
│   │   ├── content.test.ts       # distribuição pilares, detecção isca
│   │   └── prospection.test.ts   # qualificação vs ICP
│   └── utils/
│       └── date.test.ts
└── integration/
    ├── api/
    │   ├── prospection.test.ts   # fluxo job → enriquecimento → qualificação
    │   └── ai-agents.test.ts     # mocks da API Anthropic
    └── supabase/
        └── rls.test.ts           # RLS por user_id
```

---

## Checklist de verificação por etapa (Verification Loop)

Rodar antes de declarar qualquer etapa concluída:

```bash
# 1. Build
npm run build

# 2. Types
npx tsc --noEmit

# 3. Lint
npm run lint

# 4. Testes unitários
npm run test

# 5. Stub check — falhar se encontrar
grep -rn "TODO\|FIXME\|placeholder\|return null\|return {}\|coming soon" \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.next \
  app/ lib/ components/
```

Se qualquer step falhar: corrigir antes de avançar.

---

## Testes prioritários por módulo

### Dashboard
```typescript
// lib/metrics.test.ts
test('calcDelta retorna percentual correto', () => {
  expect(calcDelta(120, 100)).toBe(20)
  expect(calcDelta(80, 100)).toBe(-20)
  expect(calcDelta(100, 0)).toBe(null) // sem período anterior
})

test('calcPostsPrevistas usa média histórica', () => {
  // 8 planejados + (média 0.5/dia × 20 dias restantes) = 18
  expect(calcPostsPrevistas(8, 0.5, 20)).toBe(18)
})
```

### Leads
```typescript
// lib/leads.test.ts
test('detecta lead parado corretamente', () => {
  const leadAmarelo = { data_entrada_etapa: subDays(new Date(), 6) }
  const leadVermelho = { data_entrada_etapa: subDays(new Date(), 11) }
  const leadOk = { data_entrada_etapa: subDays(new Date(), 2) }

  expect(calcAlertaParado(leadAmarelo)).toBe('amarelo')
  expect(calcAlertaParado(leadVermelho)).toBe('vermelho')
  expect(calcAlertaParado(leadOk)).toBe('nenhum')
})
```

### Prospecção
```typescript
// lib/prospection.test.ts
test('qualificação retorna score A para match alto', () => {
  const lead = { nicho: 'saúde', porte: 'pequena', cidade: 'São Paulo', tem_site: true }
  const icp = { segmentos: ['saúde'], porte: ['pequena', 'média'], cidades: ['São Paulo'] }
  expect(calcScoreICP(lead, icp)).toBe('A')
})

test('lead duplicado não é inserido novamente', async () => {
  // Inserir mesmo instagram_handle 2x → apenas 1 registro
})
```

### Conteúdo
```typescript
// lib/content.test.ts
test('distribuição pilares soma total correto', () => {
  const dist = calcDistribuicaoPilares(20)
  expect(dist.educacional).toBe(8)   // 40%
  expect(dist.bastidores).toBe(4)    // 20%
  const soma = Object.values(dist).reduce((a, b) => a + b, 0)
  expect(soma).toBe(20)
})

test('detecta palavra isca em comentário', () => {
  expect(contemPalavraIsca('Quero o ebook!', 'ebook')).toBe(true)
  expect(contemPalavraIsca('Ótimo vídeo', 'ebook')).toBe(false)
})
```

---

## Mock da API Anthropic nos testes

```typescript
// tests/__mocks__/anthropic.ts
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify({ score: 'A', qualificado: true }) }]
      })
    }
  }))
}))
```

---

## Anti-patterns proibidos

```typescript
// ❌ Stub silencioso
async function qualificarLead(lead: Lead) {
  // TODO: implementar
  return null
}

// ❌ Placeholder hardcoded
const impressoes = 1250 // hardcoded

// ❌ Função vazia
export function calcDelta() {}

// ✅ Implementação real com erro explícito
async function qualificarLead(lead: Lead): Promise<QualificacaoResult> {
  if (!lead.nicho) throw new Error('Lead sem nicho não pode ser qualificado')
  // lógica real
}
```
