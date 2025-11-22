# FASE 12.3.5 - Debug Logs da Seção Equipe / Organograma

## Objetivo

Adicionar logs detalhados no código de frontend para diagnosticar por que a seção Equipe do dashboard e `/team-management` não estão mostrando dados, **SEM** criar novas migrations de RLS ainda.

## Modificações Realizadas

### 1. `src/hooks/useTeamData.ts`

Adicionados logs detalhados para:

- **[DEBUG_ORG]**: Valores de `user.id`, `organizationId` (AuthContext) e `current_user_organization()` RPC
- **[TEAM_DEBUG]**: Parâmetros antes de calcular o escopo (`orgId`, `userId`) e a lista final de `userIds` no escopo da equipe
- **[TEAM_API]**: Resultado das queries do Supabase:
  - `table=patients`: data + error
  - `table=sessions`: data + error

### 2. `src/utils/dashboardSharingScope.ts`

Adicionados logs detalhados para:

- **[TEAM_API]**: Resultado de todas as queries internas que definem o escopo de equipe:
  - `rpc=get_all_subordinates`: data + error
  - `table=level_sharing_config`: data + error
  - `table=user_positions` (peers): data + error
  - `table=organization_positions` (level filter): data + error
  - `table=peer_sharing`: data + error

### 3. `src/pages/TeamManagement.tsx`

Adicionados logs detalhados para:

- **[TEAM_API]**: Resultado de todas as queries usadas para carregar membros:
  - `table=organization_levels`: data + error
  - `table=organization_positions`: data + error
  - `table=user_positions`: data + error
  - `table=profiles`: data + error
  - `table=user_roles`: data + error

## Como Usar

1. Rode o app e acesse:
   - `/dashboard`
   - `/team-management`

2. Observe o console do navegador e capture os logs que começam com:
   - `[TEAM_DEBUG]`
   - `[TEAM_API]`
   - `[DEBUG_ORG]`

3. Identifique:
   - Se `organizationId` (AuthContext) ≠ `current_user_organization()` (RPC)
   - Se `userIds` no escopo da equipe está vazio ou não
   - Se alguma query retorna `error` ou `data: []`

## Próximos Passos (Pós-Diagnóstico)

Após coletar os logs e identificar a causa raiz, ajustar:

- RLS policies se necessário
- Funções SQL se necessário
- Lógica de frontend se necessário

**IMPORTANTE:** Nesta fase, **NENHUMA** migration de RLS foi criada. Apenas logs foram adicionados para diagnóstico.

## Estado Esperado

- Console repleto de logs `[TEAM_DEBUG]`, `[TEAM_API]`, `[DEBUG_ORG]`
- Diagnóstico claro de onde o problema está (ex: `profiles` retornando `[]` por RLS, `userIds` vazio por falta de hierarquia, etc.)

---

**Data:** 2025-11-22  
**Fase:** 12.3.5  
**Status:** Logs adicionados, aguardando diagnóstico do usuário
