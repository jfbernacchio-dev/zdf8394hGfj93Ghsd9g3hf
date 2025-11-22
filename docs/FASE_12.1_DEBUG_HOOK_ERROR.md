# DEBUG FASE 12.1 - Tela Branca em /dashboard-example

## Problema Identificado

**Erro:** `Error: Rendered more hooks than during the previous render`

**Local:** `src/pages/DashboardExample.tsx`, hook `useMemo` na linha 425

**Causa:** O hook `useMemo` que calcula `visibleSections` estava posicionado **DEPOIS** do early return que verifica `loading || permissionsLoading` (linha 395). 

### Por que isso causa erro?

Em React, todos os hooks devem ser chamados na mesma ordem em todas as renderizações. Quando `permissionsLoading` mudava de `true` para `false`:

1. **Primeira renderização** (loading=true):
   - Hooks chamados: `useState`, `useAuth`, `useDashboardPermissions`, `useTeamData`, `useDashboardLayout`, alguns `useMemo`
   - Early return executado → `useMemo(visibleSections)` **NÃO é chamado**
   - Total: ~10 hooks

2. **Segunda renderização** (loading=false):
   - Hooks chamados: mesmos anteriores
   - Early return **NÃO é executado** → `useMemo(visibleSections)` **É chamado**
   - Total: ~11 hooks

React detecta que o número de hooks mudou entre renderizações e lança o erro.

## Solução Aplicada

**Mudança:** Mover o `useMemo(visibleSections)` para **ANTES** do early return de loading.

### Código ANTES (❌ Errado):

```typescript
// Linha 349-392: outros hooks e funções

// Linha 395: Early return
if (loading || permissionsLoading) {
  return <LoadingSkeleton />;
}

// Linha 425: useMemo DEPOIS do early return
const visibleSections = useMemo(() => {
  if (!permissionContext) return {};
  // ...
}, [permissionContext]);
```

### Código DEPOIS (✅ Correto):

```typescript
// Linha 349-392: outros hooks e funções

// Linha 393: useMemo ANTES do early return
const visibleSections = useMemo(() => {
  if (!permissionContext) return {};
  // ...
}, [permissionContext]);

// Linha 419: Early return
if (loading || permissionsLoading) {
  return <LoadingSkeleton />;
}
```

### Por que isso resolve?

Agora o `useMemo(visibleSections)` é **sempre** chamado, independente do estado de loading. Quando `permissionContext` é `null` (durante loading), o useMemo simplesmente retorna um objeto vazio `{}`, não quebrando a regra de hooks.

## Checklist de Validação

✅ `/dashboard-example` carrega sem erro (sem tela branca)  
✅ Nenhuma exceção disparada no console ao carregar  
✅ Nenhuma exceção ao navegar pelos filtros  
✅ Lógica de permissões centralizada em `canViewDashboardCard`  
✅ Cards respeitam permissões multi-org  
✅ Cards de WhatsApp em domínio `administrative`  
✅ Filtro global e salvamento de layout funcionando  

## Arquivos Alterados

- `src/pages/DashboardExample.tsx`:
  - Moveu `useMemo(visibleSections)` de linha 425 para linha 393
  - Garantiu que todos os hooks são chamados antes do early return

## Lição Aprendida

**Regra de Ouro dos Hooks:**
> Todos os hooks devem ser chamados **na mesma ordem** em todas as renderizações. Nunca coloque hooks depois de early returns condicionais.

**Padrão correto:**
1. Declare todos os hooks no topo do componente
2. Execute early returns depois de todos os hooks
3. Se um hook depende de dados que podem ser `null`, trate isso **dentro** do hook (via dependência ou guard clause), não evitando a chamada do hook

## Impacto

✅ Dashboard funcional  
✅ Sistema de permissões ativo  
✅ Sem regressões de funcionalidade  
✅ Sem warnings de segurança adicionais  

---

**Data:** 2025-01-22  
**Fase:** 12.1 - Debug  
**Status:** ✅ Resolvido
