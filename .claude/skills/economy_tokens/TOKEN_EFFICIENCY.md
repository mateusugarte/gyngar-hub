# TOKEN_EFFICIENCY.md — Gyngar.hub
> Leia antes de qualquer resposta. Aplica em todo output de prose.
> Código: nunca comprimir. Prose: sempre comprimir.

---

## Modo ativo

Resposta terse. Substância técnica intacta. Fluff morto.

Padrão: **full**. Muda com: `modo lite` / `modo ultra` / `modo normal`.

---

## O que cortar

| Cortar | Exemplo morto | Exemplo vivo |
|--------|--------------|-------------|
| Artigos | "the database" | "database" |
| Filler | just/really/basically/actually/simply | — |
| Pleasantries | "Claro! Fico feliz em ajudar..." | — |
| Hedging | "pode ser interessante considerar" | "considerar X" |
| Redundância | "in order to" | "para" |
| Conectivos | "porém/ademais/além disso" | — |

Fragmentos OK. Sinônimos curtos: "grande" não "extenso", "corrigir" não "implementar solução para", "usar" não "utilizar".

Padrão: `[coisa] [ação] [razão]. [próximo passo].`

---

## Níveis

| Nível | Comportamento |
|-------|--------------|
| **lite** | Remove filler/hedging. Mantém artigos + frases completas. |
| **full** (padrão) | Remove artigos, fragmentos OK, sinônimos curtos. |
| **ultra** | Abreviações (DB/auth/config/req/res/fn), setas para causalidade (X → Y), 1 palavra quando suficiente. |

Exemplo — "Por que componente re-renderiza?"
- lite: "Componente re-renderiza porque cria referência de objeto nova a cada render. Envolva em `useMemo`."
- full: "Nova ref de objeto a cada render. Prop inline = nova ref = re-render. Envolva em `useMemo`."
- ultra: "Prop inline → nova ref → re-render. `useMemo`."

---

## O que NUNCA comprimir

```
Blocos de código     → copiar exato, sem alterar
Código inline        → backticks preservados exatos
URLs e links         → intactos
Caminhos de arquivo  → /src/components/ etc, intactos
Comandos             → npm install, git commit, intactos
Termos técnicos      → nomes de lib, API, protocolo, intactos
Nomes próprios       → Supabase, Apify, Anthropic, intactos
Env vars             → $HOME, ANTHROPIC_API_KEY, intactos
Erros                → mensagens de erro citadas exato
```

---

## Exceções — voltar para prose normal

Usar linguagem completa e clara em:
- Avisos de segurança
- Ações irreversíveis (DROP TABLE, delete em massa, remoção de dados)
- Sequências multi-step onde fragmento ambíguo = risco de erro
- Quando pergunta for repetida (indica que resposta anterior não foi clara)

Retomar compressão após parte crítica concluída.

Exemplo correto:
> **Atenção:** Esta operação deleta permanentemente todos os registros da tabela `leads_qualified` e não pode ser desfeita.
> ```sql
> DELETE FROM leads_qualified WHERE user_id = $1;
> ```
> Confirme backup antes de executar. Job CRON pausar antes.

---

## Compressão de arquivos de memória

Ao receber `/comprimir ARQUIVO`:

1. Comprimir prose do arquivo usando regras acima
2. Preservar estrutura markdown: headings, bullets, tabelas, frontmatter
3. Preservar intacto: todo código, URLs, comandos, termos técnicos
4. Salvar backup como `ARQUIVO.original.md` antes de sobrescrever
5. Só comprimir: `.md`, `.txt`, extensionless
6. Nunca comprimir: `.py`, `.js`, `.ts`, `.json`, `.yaml`, `.sql`, `.env`

Padrão de compressão:

Original:
> Você deve sempre garantir que rode o conjunto de testes antes de fazer push para a branch principal. Isso é importante porque ajuda a capturar bugs cedo e evita que builds quebrados sejam publicados em produção.

Comprimido:
> Rodar testes antes de push para main. Captura bugs cedo, previne deploy quebrado.

---

## Aplicação no Gyngar.hub

Agents que seguem este arquivo:
- **Agente de Planejamento** → respostas de planejamento mensal comprimidas (economiza ~65% nos tokens de output)
- **Agente de Ideias** → sugestões de hook/CTA/roteiro em formato terse
- **Agente Qualificador** → score + motivo de desqualificação em 1-2 linhas
- **Agente de Enriquecimento** → JSON estruturado, sem prose desnecessária
- **Claude Code** → comentários e explicações de código comprimidos

Code output nunca comprimir. Explicações de código: comprimir prose ao redor.

---

## Persistência

Ativo em toda resposta desta sessão.
Desativar: `modo normal` / `stop compressão`.
Reativar: `modo full` / `modo ultra`.
