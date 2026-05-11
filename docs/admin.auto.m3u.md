# Sistema Automatizado de Conteúdo M3U — Guia de Integração Frontend

Base URL de todos os endpoints: `/admin/contents/auto-m3u`  
Auth: Bearer token no header `Authorization` ou cookie `access_token` (admin obrigatório).

---

## Visão Geral

O fluxo tem duas fases distintas:

1. **Setup** — o admin fornece uma URL M3U, inspeciona as categorias disponíveis e escolhe o que importar.
2. **Operação** — o backend mantém o catálogo atualizado automaticamente (diário) sem intervenção humana.

```
[Admin] → fornece URL
            ↓
        POST /discover  →  lista de categorias com contagens
            ↓
        Admin seleciona filtros + configura schedule
            ↓
        POST /sources   →  fonte salva (idle)
            ↓
        POST /sources/:id/sync  →  importação inicial (background)
            ↓
        Polling /sync/status + /sync/logs  →  acompanhar progresso
            ↓
        auto_sync_enabled = true  →  backend sincroniza sozinho, todo dia
```

---

## Telas e Componentes Sugeridos

### 1. Tela: Lista de Fontes (`/admin/auto-playlists`)

Exibe todas as fontes cadastradas com status rápido.

**Dados**: `GET /sources` → `{ playlists, total }`

**Colunas da tabela**:

| Campo | Origem |
|-------|--------|
| Nome | `playlist.name` |
| URL (truncada) | `playlist.url` |
| Categorias ativas | `playlist.active_filters.length` filtros |
| Auto-sync | `playlist.auto_sync_enabled` (toggle) + `playlist.sync_hour`h UTC |
| Último sync | `playlist.last_sync_at` (formatar: "há 3h" / data) |
| Status | `playlist.status` → badge colorido |
| Ações | Editar / Sync manual / Deletar |

**Badge de status**:
- `idle` → cinza "Ocioso"
- `syncing` → azul animado "Sincronizando..."
- `error` → vermelho "Erro" + tooltip com `last_sync_error`

**Ação de toggle auto-sync direto na lista**:
```
PATCH /sources/:id  { auto_sync_enabled: !atual }
```

---

### 2. Tela: Criar Fonte — Passo 1 (Descoberta)

Campo de URL + botão "Inspecionar". Enquanto carrega, exibir spinner (pode demorar 10–60s dependendo do tamanho da lista).

```
POST /discover
Body: { "url": "<url digitada>", "language": "pt-BR" }
```

**Tratamento de erro**: se a URL for inválida ou inacessível, o backend retorna 400/500 com `{ error: "..." }`.

**Resultado**: renderizar a lista de categorias descobertas.

---

### 3. Tela: Criar Fonte — Passo 2 (Seleção de Filtros)

Exibir um accordion ou tabela expansível por categoria:

```
☑ FILMES  (4.200 itens)
    ☑ [sem subcategoria]   2.460 itens
    ☑ AÇÃO                   980 itens
    ☐ DRAMA                  760 itens

☑ SÉRIES  (1.800 itens)
    ☐ [sem subcategoria]   1.480 itens
    ☑ LANÇAMENTOS            320 itens

☐ INFANTIL  (210 itens)
    ☐ [sem subcategoria]     210 itens
```

**Regra de seleção**:
- Marcar a categoria inteira (sem subcategoria) → envia `{ category: "FILMES", subcategory: null }`
- Marcar subcategoria específica → envia `{ category: "SÉRIES", subcategory: "LANÇAMENTOS" }`
- Categoria marcada com subcategorias mistas → enviar um filtro por subcategoria selecionada

**Construção do `active_filters`**:
```ts
// Exemplo de como montar o array a partir das checkboxes
const active_filters: ActiveFilter[] = []

for (const cat of selectedCategories) {
  const selectedSubs = cat.subcategories.filter(s => s.checked)

  if (selectedSubs.length === cat.subcategories.length) {
    // Toda a categoria selecionada → 1 filtro com subcategory null
    active_filters.push({ category: cat.category, subcategory: null })
  } else {
    // Subcategorias específicas
    for (const sub of selectedSubs) {
      active_filters.push({ category: cat.category, subcategory: sub.name })
    }
  }
}
```

> **Atenção**: `subcategory: null` captura todos os itens da categoria, incluindo os que têm e os que não têm subcategoria definida no M3U. Se quiser importar apenas itens SEM subcategoria, use `subcategory: null` como filtro isolado (sem adicionar outros filtros para a mesma categoria).

---

### 4. Tela: Criar Fonte — Passo 3 (Configuração e Confirmação)

```
Nome da fonte:      [________________]
Idioma TMDB:        [pt-BR ▼]

Auto-sync diário:   [ Ativado ● ]
Sincronizar às:     [03 ▼] h UTC  (equivale a 00h BRT)

Configurações avançadas (colapsável):
  Batch TMDB:        [200]   (itens por lote de resolução)
  Concorrência TMDB: [20]    (requisições TMDB paralelas)
  Concorrência import: [10]  (inserções paralelas no banco)

[ Voltar ]   [ Criar Fonte ]
```

**Dica de UX**: converter `sync_hour` de UTC para horário local para mostrar ao usuário:
```ts
function utcHourToLocal(utcHour: number): string {
  const d = new Date()
  d.setUTCHours(utcHour, 0, 0, 0)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
// utcHourToLocal(3) → "00:00" (BRT GMT-3)
```

**Ao clicar em "Criar Fonte"**:
```
POST /sources
Body: {
  name, url, active_filters, language,
  tmdb_batch_size, tmdb_concurrency, import_concurrency,
  auto_sync_enabled, sync_hour
}
```

Após criar (`201`), redirecionar para a tela de detalhe da fonte e opcionalmente disparar o sync inicial automaticamente.

---

### 5. Tela: Detalhe da Fonte + Monitor de Sync

Esta tela serve tanto para acompanhar um sync em andamento quanto para ver o histórico.

**Dados combinados**:
- `GET /sources/:id` — configuração + último resultado
- `GET /sources/:id/sync/status` — estado ao vivo (polling)
- `GET /sources/:id/sync/logs` — log detalhado (polling)

#### 5.1 Cabeçalho

```
IPTV Principal                         [Sync Manual]  [Editar]  [Deletar]
http://meuiptv.com/lista.m3u
Auto-sync: todo dia às 00h (03h UTC)   Status: ● idle
```

#### 5.2 Cards de Estatísticas (último sync)

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│   4.120  │ │    38    │ │     4    │ │  4.078   │ │    21    │
│  Total   │ │  Criados │ │  URLs    │ │  Iguais  │ │Não achad.│
│          │ │          │ │ Atualizad│ │(skipped) │ │  TMDB    │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
Último sync: 11/05/2025 03:02
```

Mapeamento dos campos de `last_sync_summary`:
- `created` → novos conteúdos cadastrados
- `updated_url` → URL de streaming atualizada
- `skipped` → já existia com a mesma URL (sem alteração)
- `failed` → falha na inserção (detalhe nos logs)
- `not_found` → item não encontrado no TMDB

#### 5.3 Barra de Progresso (só quando `is_active: true`)

```ts
// Dados de GET /sources/:id/sync/status com is_active=true
const { progress } = status
// progress.parsed   → itens parseados do M3U
// progress.resolved → itens resolvidos no TMDB
// progress.imported → itens processados no banco
// progress.current_filter → filtro sendo processado agora
```

Renderizar como steps progressivos:

```
[✓] Parse M3U          6.000 itens
[~] Resolução TMDB     3.200 / 6.000  ████████░░░░ 53%   ← current_filter: "FILMES"
[ ] Importação banco   -
```

#### 5.4 Painel de Logs

```
[INFO]  03:00:01  Sync iniciado — 2 filtro(s) ativos
[INFO]  03:00:05  M3U baixado e parseado: 6000 itens
[INFO]  03:00:05  Filtro "FILMES": 4200 itens selecionados
[INFO]  03:01:10  Filtro "FILMES" concluido: 4200 filmes, 0 ep series, 21 nao encontrados
[INFO]  03:01:10  Filtro "SÉRIES | LANÇAMENTOS": 320 itens selecionados
[INFO]  03:02:12  Sync concluido — created=38 updated_url=4 skipped=4078 failed=0 not_found=21
```

Colorir `[ERROR]` em vermelho, `[INFO]` em cor neutra.

---

## Lógica de Polling

O polling deve ser ativado apenas quando um sync está em andamento e desativado ao terminar.

```ts
// Exemplo com React + useEffect
function useSyncPoller(playlistId: string) {
  const [status, setStatus] = useState<SyncStatus | null>(null)
  const [logs, setLogs] = useState<SyncLog[]>([])
  const logCursorRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchStatus = useCallback(async () => {
    const s = await api.get(`/sources/${playlistId}/sync/status`)
    setStatus(s)

    // Buscar apenas logs novos (cursor incremental)
    if (s.is_active) {
      const logsRes = await api.get(
        `/sources/${playlistId}/sync/logs?cursor=${logCursorRef.current}&limit=100`
      )
      setLogs(prev => [...prev, ...logsRes.logs])
      logCursorRef.current = logsRes.next_cursor
    }

    // Parar polling quando o sync terminar
    if (!s.is_active && intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
      // Buscar dados finais da fonte
      fetchPlaylist()
    }
  }, [playlistId])

  useEffect(() => {
    fetchStatus() // verificação inicial

    // Só iniciar polling se houver sync ativo
    intervalRef.current = setInterval(fetchStatus, 5_000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchStatus])

  return { status, logs }
}
```

**Intervalo recomendado**: 5 segundos durante sync ativo. Na tela de lista, 30 segundos para atualizar badges de status.

---

## Fluxo Completo de Criação (Sequência de Chamadas)

```
1. [usuário digita URL e clica "Inspecionar"]
   → POST /discover { url, language }
   ← 200 { categories: [...] }          (pode demorar 10-60s)

2. [usuário seleciona filtros e clica "Criar Fonte"]
   → POST /sources { name, url, active_filters, ... }
   ← 201 { id: "abc-123", status: "idle", ... }

3. [opcional — disparar importação inicial imediatamente]
   → POST /sources/abc-123/sync
   ← 202 { started: true }

4. [iniciar polling enquanto is_active=true]
   → GET /sources/abc-123/sync/status   (a cada 5s)
   ← { is_active: true, progress: { ... }, db_status: "syncing" }

   → GET /sources/abc-123/sync/logs?cursor=0&limit=100
   ← { logs: [...], next_cursor: 12, has_more: false }

   → GET /sources/abc-123/sync/logs?cursor=12&limit=100   (próximo poll)
   ← { logs: [...novos...], next_cursor: 18, has_more: false }

5. [quando is_active=false]
   → GET /sources/abc-123/sync/status
   ← { is_active: false, db_status: "idle", last_sync_summary: { ... } }
   → parar polling, exibir resumo final
```

---

## Editar Fonte

Campos editáveis via `PATCH /sources/:id`:

| Campo | Editável? | Observação |
|-------|-----------|------------|
| `name` | ✅ | |
| `url` | ❌ | Delete e recrie para trocar URL |
| `active_filters` | ✅ | Recomendado re-rodar o sync após alterar |
| `language` | ✅ | Afeta TMDB na próxima sincronização |
| `auto_sync_enabled` | ✅ | Toggle simples |
| `sync_hour` | ✅ | 0–23 UTC |
| `tmdb_batch_size` | ✅ | Configuração avançada |
| `tmdb_concurrency` | ✅ | Configuração avançada |
| `import_concurrency` | ✅ | Configuração avançada |

**Após alterar `active_filters`**, avisar ao usuário que o sync automático aplicará os novos filtros no próximo ciclo, ou oferecer botão "Aplicar agora" que dispara `POST /sources/:id/sync`.

---

## Deletar Fonte

```
DELETE /sources/:id
```

- `204` → deletado com sucesso
- `409` → sync em andamento; aguardar ou cancelar

Antes de deletar, exibir modal de confirmação com aviso: **"Deletar a fonte não remove o conteúdo já importado no catálogo."**

---

## Tratamento de Estados de Erro

### Fonte com `status: "error"`

```ts
if (playlist.status === 'error') {
  // Exibir: playlist.last_sync_error
  // Oferecer botão "Tentar novamente" → POST /sources/:id/sync
}
```

### Sync já rodando

```ts
const result = await api.post(`/sources/${id}/sync`)
if (!result.started && result.reason === 'sync_already_running') {
  // Apenas ativar o polling — já está rodando
  startPolling(id)
}
```

### Descoberta lenta (lista M3U grande)

O endpoint `/discover` pode demorar bastante para listas de 50k+ entradas. Recomendações:
- Timeout do cliente: mínimo 120 segundos
- Exibir spinner com mensagem "Analisando lista M3U, aguarde..."
- Se quiser feedback em tempo real, a alternativa é usar o endpoint `POST /m3u/parse` com SSE (Server-Sent Events) que já existe no sistema

---

## Comportamento do Auto-Sync

O scheduler interno verifica a cada **10 minutos** se há playlists para sincronizar. Critérios para disparar:

- `auto_sync_enabled = true`
- `sync_hour = hora_UTC_atual`
- `status ≠ 'syncing'`
- `last_sync_at IS NULL` ou `last_sync_at < agora − 22h`

A janela de 22h (em vez de 24h exatas) garante que o sync não seja pulado por drift de horário do servidor.

**Proteção contra crash**: ao iniciar, o servidor redefine playlists com `status = 'syncing'` para `'idle'` (evita travamento permanente se o processo morreu durante um sync).

**O que o auto-sync faz**:
- ✅ Importa novos filmes que apareceram na lista
- ✅ Importa novos episódios de séries existentes
- ✅ Importa temporadas novas adicionadas à série
- ✅ Atualiza URL de streaming se o provedor a mudou
- ✅ Ignora conteúdo já cadastrado com a mesma URL (eficiente)
- ❌ Não remove conteúdo que saiu da lista (apenas adiciona/atualiza)

---

## Tipos TypeScript (para uso no frontend)

```ts
interface ActiveFilter {
  category: string
  subcategory: string | null
}

interface SyncSummary {
  total: number
  created: number
  updated_url: number
  skipped: number
  failed: number
  not_found: number
  filters_processed: number
}

interface AutoPlaylist {
  id: string
  name: string
  url: string
  active_filters: ActiveFilter[]
  language: string
  tmdb_batch_size: number
  tmdb_concurrency: number
  import_concurrency: number
  auto_sync_enabled: boolean
  sync_hour: number                        // 0-23 UTC
  status: 'idle' | 'syncing' | 'error'
  last_sync_at: string | null              // ISO 8601
  last_sync_summary: SyncSummary | null
  last_sync_error: string | null
  created_by: string
  created_at: string
  updated_at: string
}

interface CategoryInfo {
  category: string
  total: number
  subcategories: Array<{ name: string | null; count: number }>
}

interface SyncStatus {
  playlist_id: string
  is_active: boolean
  progress: {
    parsed: number
    resolved: number
    imported: number
    current_filter: string
  } | null
  db_status: 'idle' | 'syncing' | 'error'
  last_sync_at: string | null
  last_sync_summary: SyncSummary | null
  last_sync_error: string | null
}

interface SyncLog {
  ts: string
  level: 'info' | 'error'
  message: string
}
```
