# initialDesign.md — Gyngar.hub
> Guia de design para o Claude Code. Ensina COMO pensar o design, não descreve pixel a pixel.
> Antes de criar qualquer componente: ler este arquivo + .claude/skills/design/SKILL.md

---

## Identidade Visual

O Gyngar.hub usa a identidade do ecossistema Claude — tons quentes de laranja, bege e carvão.
Sensação orgânica, profissional e calorosa. O oposto do azul frio corporativo.

Dois temas de igual importância:
- **Dark:** carvão escuro `#1C1A17` + laranja `#DA7756` + creme `#F5ECD7`
- **Light:** bege creme `#FAF5EC` + laranja `#C96442` + carvão `#2D2B27`

---

## Tokens de Cor — copiar exato para `globals.css`

```css
/* ═══════════════════════════════════════════════
   GYNGAR.HUB — DESIGN TOKENS
   Paleta: Claude / Anthropic color system
   Toggle: <html data-theme="dark|light">
═══════════════════════════════════════════════ */

[data-theme="dark"] {
  --bg-base:           #1C1A17;
  --bg-surface:        #252320;
  --bg-surface-raised: #2D2B27;
  --bg-sidebar:        #191714;

  --border-subtle:     #332F29;
  --border-visible:    #3D3930;
  --border-strong:     #504A40;

  --text-display:      #F5ECD7;
  --text-primary:      #E8DCC8;
  --text-secondary:    #9A8F7E;
  --text-disabled:     #5C5448;

  --accent:            #DA7756;
  --accent-hover:      #C96442;
  --accent-subtle:     rgba(218,119,86,0.12);
  --accent-border:     rgba(218,119,86,0.30);
  --accent-text:       #F0956E;

  --success:           #5A9E7A;
  --success-subtle:    rgba(90,158,122,0.12);
  --warning:           #C9933A;
  --warning-subtle:    rgba(201,147,58,0.12);
  --danger:            #B85040;
  --danger-subtle:     rgba(184,80,64,0.12);

  --interactive:       #DA7756;
}

[data-theme="light"] {
  --bg-base:           #FAF5EC;
  --bg-surface:        #FFFFFF;
  --bg-surface-raised: #F5ECD7;
  --bg-sidebar:        #F2EBD8;

  --border-subtle:     #EDE4D0;
  --border-visible:    #DDD3BC;
  --border-strong:     #C9BFA8;

  --text-display:      #1C1A17;
  --text-primary:      #2D2B27;
  --text-secondary:    #7A7060;
  --text-disabled:     #A8A090;

  --accent:            #C96442;
  --accent-hover:      #B55A38;
  --accent-subtle:     rgba(201,100,66,0.10);
  --accent-border:     rgba(201,100,66,0.25);
  --accent-text:       #C96442;

  --success:           #2D7A52;
  --success-subtle:    rgba(45,122,82,0.08);
  --warning:           #A07030;
  --warning-subtle:    rgba(160,112,48,0.08);
  --danger:            #963828;
  --danger-subtle:     rgba(150,56,40,0.08);

  --interactive:       #C96442;
}
```

---

## Tipografia

```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500&family=Space+Mono:wght@400;700&display=swap');

body {
  font-family: 'Space Grotesk', system-ui, sans-serif;
  background: var(--bg-base);
  color: var(--text-primary);
}
```

### Hierarquia — 3 camadas por tela

| Camada | Fonte | Tamanho | Cor | Uso |
|--------|-------|---------|-----|-----|
| Primária | Space Mono | 36–72px | `--text-display` | Número hero, headline única |
| Secundária | Space Grotesk 400 | 14–16px | `--text-primary` | Corpo, nomes, descrições |
| Terciária | Space Mono ALL CAPS | 10–11px | `--text-secondary` | Labels, timestamps, tipos |

```tsx
// Label de campo:
<span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-secondary)]">
  PROSPECÇÕES FEITAS
</span>

// Número hero:
<span className="font-mono text-[42px] tracking-[-0.02em] text-[var(--text-display)]">
  341
</span>
```

---

## Tailwind Config

```ts
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      'bg-base':     'var(--bg-base)',
      'bg-surface':  'var(--bg-surface)',
      'bg-raised':   'var(--bg-surface-raised)',
      'bg-sidebar':  'var(--bg-sidebar)',
      'border-s':    'var(--border-subtle)',
      'border-v':    'var(--border-visible)',
      'border-st':   'var(--border-strong)',
      'txt-display': 'var(--text-display)',
      'txt-primary': 'var(--text-primary)',
      'txt-sec':     'var(--text-secondary)',
      'txt-dis':     'var(--text-disabled)',
      'accent':      'var(--accent)',
      'accent-h':    'var(--accent-hover)',
      'accent-t':    'var(--accent-text)',
      'success':     'var(--success)',
      'warning':     'var(--warning)',
      'danger':      'var(--danger)',
    },
    fontFamily: {
      sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
      mono: ['Space Mono', 'monospace'],
    },
  }
}
```

---

## Dashboard — Estrutura Completa

### Zona 1 — Header

```
[ Bom dia, [Nome] ]    [ HOJE | SEMANA | MÊS | CUSTOM ] [ 🔔 3 ] [ avatar ]
```

### Zona 2 — Conteúdo (grid 3×2)

```
┌──────────────────┬──────────────────────┬──────────────────┐
│ IMPRESSÕES       │ ★ VÍDEO TOP          │ ENGAJAMENTO MÉDIO│
│ 24.1k            │ "Como fechar..."     │ 4.8%             │
│ ↑ 18% vs período │ 12.4k views          │ ↑ 1.2% período   │
│ [sparkline 7d]   │ ♥ 142  💬 38  📌 91  │ ref: >3% = bom   │
├──────────────────┼──────────────────────┼──────────────────┤
│ POSTS FEITOS     │ POSTS PREVISTOS MÊS  │ LEADS ISCA       │
│ 7                │ 12                   │ 23               │
│ [████░░ 58%]     │ 5 restantes          │ ↑ 4 hoje         │
│ de 12 planejados │ próx: "Erro comum"   │ palavra: ebook   │
└──────────────────┴──────────────────────┴──────────────────┘
```

### Zona 3 — Prospecção (grid 3×2)

```
┌──────────────────┬──────────────────┬──────────────────────┐
│ PRÉ-QUALIFICADOS │ LEADS INSTAGRAM  │ LEADS GOOGLE         │
│ 341              │ 128              │ 213                  │
│ total período    │ via posts isca   │ via Maps             │
├──────────────────┼──────────────────┼──────────────────────┤
│ DESQUALIFICADOS  │ PROSPECÇÕES      │ ★ META HOJE          │
│ 47               │ FEITAS           │ 12 / 15              │
│ pela IA          │ 89               │ [████████░░] 80%     │
│ top: sem site    │ esta semana      │ 3 prospecções restam │
└──────────────────┴──────────────────┴──────────────────────┘
```

### Zona 4 — Metas e Gráficos (split 40/60)

```
┌─────────────────────────┬────────────────────────────────────────┐
│ METAS DA SEMANA         │ FUNIL DE CONVERSÃO                     │
│                         │                                        │
│ Reuniões Agendadas      │ IMPRESSÕES  ████████████████  24.1k    │
│ 6 / 8                   │ LEADS       ████████░░░░░░░░  341      │
│ [██████░░] 75%          │ REUNIÕES    ███░░░░░░░░░░░░░  18       │
│                         │ VENDAS      █░░░░░░░░░░░░░░░  4        │
│ Vendas Concluídas       │                                        │
│ 1 / 4                   ├────────────────────────────────────────┤
│ [██░░░░░░] 25%          │                                        │
│                         │ ENGAJAMENTO POR TIPO DE POST           │
│ Prospecções Hoje        │                                        │
│ 12 / 15                 │ ISCA        ████████  6.2%             │
│ [████████░░] 80%        │ EDUCAÇÃO    ██████    4.8%             │
│                         │ VIRALIZAÇÃO ████      3.1%             │
│ Leads Isca Hoje         │ BASTIDORES  ██        2.4%             │
│ 4 / 5                   │ PROMOCIONAL █         1.8%             │
│ [████████░] 80%         │                                        │
└─────────────────────────┴────────────────────────────────────────┘
```

**★ = card com `border-[var(--accent-border)]` e `bg-[var(--accent-subtle)]` — um destaque por zona.**

---

## Componentes — Padrões de Código

### Metric Card

```tsx
// Padrão para todos os cards de métrica
<div className="bg-bg-surface border border-border-v rounded-xl p-4">
  <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-txt-sec block mb-3">
    IMPRESSÕES TOTAIS
  </span>
  <span className="font-mono text-[36px] tracking-[-0.02em] text-txt-display block leading-none">
    24.1k
  </span>
  <span className="text-[11px] text-success mt-2 block font-mono">↑ 18.2%</span>
</div>

// Card destaque: adicionar className extra:
// "border-[var(--accent-border)] bg-[var(--accent-subtle)]"
```

### Progress Bar Segmentada

```tsx
// Blocos discretos — sem border-radius, visual de instrumento
<div className="flex gap-[2px] h-[6px] w-full mt-2">
  {Array.from({length: total}).map((_, i) => (
    <div key={i} style={{
      flex: 1,
      background: i < atual ? 'var(--accent)' : 'var(--border-visible)',
      borderRadius: 0
    }} />
  ))}
</div>
```

### Sidebar

```
56px colapsada → 220px expandida (hover ou toggle)
Background: --bg-sidebar
Border-right: 1px solid var(--border-subtle)

Logo "G": background --accent, border-radius 10px, Space Grotesk 500, cor --bg-base
Ícone ativo: bg rgba(218,119,86,0.12), ícone --accent-text, dot 4px --accent
Ícone inativo: ícone --text-disabled, hover --text-secondary
Transição: 200ms ease-out
```

### Kanban Cards

```
Background: --bg-surface
Border: 1px solid --border-visible, radius 10px
Padding: 12px

Score A: bg --success-subtle, text --success, border --success (0.3 opacity)
Score B: bg --warning-subtle, text --warning
Score C: bg --danger-subtle, text --danger

Lead parado 5d: border-left 2px --warning + animation: pulse-warn 2s infinite
Lead parado 10d: border-left 2px --danger + animation: pulse-danger 1.2s infinite

Coluna Recusa: opacity: 0.45, bg --bg-surface-raised
```

### Notificações

```
Badge: 18px, bg --accent, Space Mono 9px, cor white
Painel: 380px, bg --bg-surface, border-left --border-visible, slide 200ms

lead_parado(5d):  border-left 2px --warning, bg --warning-subtle se não lida
lead_perdendo(10d): border-left 2px --danger, bg --danger-subtle se não lida
lead_isca:        border-left 2px --accent, bg --accent-subtle se não lida
job_concluido:    sem borda, ícone --success
meta_atingida:    border-left 2px --success
post_hora:        sem borda, ícone --text-secondary

Timestamp: Space Mono 9px, --text-disabled
```

---

## Calendário de Conteúdo

```
Layout: 65% calendário | 35% painel do dia (border-left --border-subtle)

Chips por dia:
  Publicado:  círculo 8px, bg --success
  Agendado:   círculo 8px, bg --accent
  Atrasado:   círculo 8px, bg --danger
  Programado: círculo 8px, bg --border-strong

Dia selecionado:
  bg --accent-subtle
  border 1px solid --accent-border
  radius 8px

Header do calendário:
  < MAIO 2026 > — chevrons em --text-secondary, texto Space Mono ALL CAPS
```

---

## Animações

```css
/* Permitidas */
transition: opacity 200ms ease-out;
transition: background-color 150ms ease-out;
transition: border-color 150ms ease-out;
transition: width 200ms ease-out;
transition: transform 200ms ease-out;

/* Pulsação para alertas (suave) */
@keyframes pulse-warn {
  0%, 100% { border-left-color: var(--warning); opacity: 1; }
  50% { border-left-color: var(--warning); opacity: 0.5; }
}
@keyframes pulse-danger {
  0%, 100% { border-left-color: var(--danger); opacity: 1; }
  50% { border-left-color: var(--danger); opacity: 0.45; }
}

/* NUNCA: spring, bounce, transition: all, gradientes */
```

**Loading:** `[CARREGANDO...]` Space Mono, `--text-disabled`. Nunca skeleton.
**Empty:** `NENHUM DADO — [AÇÃO SUGERIDA]` Space Mono ALL CAPS, `--text-disabled`.

---

## Toggle de Tema

```tsx
// Primeiro acesso: prefers-color-scheme
// Preferência salva em localStorage + user_settings
const savedTheme = localStorage.getItem('gyngar-theme') ||
  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
document.documentElement.setAttribute('data-theme', savedTheme)
```

---

## Checklist de Design

```
☐ Cores: só var(--...), nunca hex hardcoded
☐ Labels: Space Mono, ALL CAPS, tracking-[0.1em], txt-sec
☐ Números: Space Mono, tamanho proporcional
☐ Hierarquia 3 camadas: um elemento rompe o padrão por zona
☐ Sem box-shadow (exceto focus ring acessível)
☐ Sem gradientes decorativos
☐ Dark e light testados (alternar data-theme)
☐ Touch targets mínimo 44px
☐ Loading: [CARREGANDO...], nunca skeleton
☐ Notificações: badge com contagem real no sino
☐ Acento laranja: apenas para ação ou destaque, nunca decorativo
```
