# FASE 12.3.8 – Liberar Todos os Domínios para Admin/Owner

## Problema

Mesmo com o bootstrap permissivo aplicado em `resolveEffectivePermissions`, os cards do dashboard ainda estavam sendo bloqueados para Admin/Owner por causa da função `canAccessDomain`, que verificava cada domínio individualmente sem considerar o bypass para admin/owner.

Logs observados:
```
[DASH_PERM] ❌ Card bloqueado por domínio { cardId: "...", domain: "financial", userId: "..." }
[DASH_PERM] ❌ Card bloqueado por domínio { cardId: "...", domain: "clinical", userId: "..." }
[DASH_PERM] ❌ Card bloqueado por domínio { cardId: "...", domain: "team", userId: "..." }
```

## Solução

### 1. Short-circuit na função `canAccessDomain`

Adicionei um **short-circuit** na função `canAccessDomain` em `src/hooks/useDashboardPermissions.ts`:

```typescript
function canAccessDomain(
  domain: PermissionDomain,
  ctx: DashboardPermissionContext
): boolean {
  // 🔓 FASE 12.3.8: Admin/Owner sempre podem ver todos os domínios
  if (ctx.isAdmin || ctx.isOrganizationOwner) {
    return true;
  }
  
  // 🔒 Demais usuários seguem as permissões do level_role_settings
  switch (domain) {
    // ... lógica normal para não-admins
  }
}
```

### 2. Logs de debug aprimorados

Adicionei logs mais detalhados para rastrear a visibilidade de cards:

```typescript
// Log de visibilidade por domínio (inclui 'general' e 'charts')
console.log('[DASH_PERM] 🌐 Visibilidade final por domínio', {
  userId: ctx.userId,
  globalRole: permissions?.roleType,
  isAdmin: ctx.isAdmin,
  isOrganizationOwner: ctx.isOrganizationOwner,
  visibilityByDomain: {
    financial: { canView: ctx.canAccessFinancial, scope: financialAccess },
    clinical: { canView: ctx.canAccessClinical, scope: 'full' },
    administrative: { canView: ctx.canAccessAdministrative, scope: 'full' },
    team: { canView: ctx.canAccessTeam, scope: 'full' },
    media: { canView: ctx.canAccessMarketing, scope: 'full' },
    whatsapp: { canView: ctx.canAccessWhatsapp },
    marketing: { canView: ctx.canAccessMarketing, scope: 'full' },
    general: { canView: true, scope: 'full' },
    charts: { canView: true, scope: 'full' },
  },
});
```

### 3. Log de sucesso para cards de team

Para facilitar o debug, adicionei um log específico quando um card de "team" é permitido:

```typescript
// Log de sucesso para cards de team (debug FASE 12.3.8)
if (config.domain === 'team') {
  console.log('[DASH_PERM] ✅ Card de equipe permitido', {
    cardId: card.id,
    domain: config.domain,
    userId: ctx.userId,
    isAdmin: ctx.isAdmin,
    isOrganizationOwner: ctx.isOrganizationOwner,
  });
}
```

### 4. Log de bloqueio com mais contexto

O log de bloqueio agora inclui mais informações para debug:

```typescript
console.log('[DASH_PERM] ❌ Card bloqueado por domínio', {
  cardId: card.id,
  domain: config.domain,
  userId: ctx.userId,
  isAdmin: ctx.isAdmin,
  isOrganizationOwner: ctx.isOrganizationOwner,
  canAccessTeam: ctx.canAccessTeam,
});
```

## Arquitetura

A solução trabalha em conjunto com o sistema existente:

1. **resolveEffectivePermissions** aplica bootstrap permissivo para admin/owner (já estava correto)
2. **canAccessDomain** agora faz bypass total para admin/owner ANTES de verificar domínios
3. O contexto de permissões (`DashboardPermissionContext`) já contém `isAdmin` e `isOrganizationOwner`
4. Cards de "team" são definidos em `src/types/cardTypes.ts` com:
   ```typescript
   permissionConfig: {
     domain: 'team',
     blockedFor: ['subordinate'],
   }
   ```

## Justificativa

- **Segurança**: Apenas Admin e Owner recebem bypass total
- **Consistência**: Alinha com a filosofia de bootstrap permissivo já aplicada em `resolveEffectivePermissions`
- **Simplicidade**: Evita complexidade desnecessária no switch case para roles privilegiados
- **Debug**: Logs detalhados facilitam diagnóstico de problemas de visibilidade

## Validação

Após a mudança, recarregar `/dashboard` como Admin deve:

✅ Mostrar log `[DASH_PERM] 🌐 Visibilidade final por domínio` com todos os domínios `canView: true`  
✅ Mostrar logs `[DASH_PERM] ✅ Card de equipe permitido` para cada card de team renderizado  
✅ NÃO mostrar mais logs `[DASH_PERM] ❌ Card bloqueado por domínio` para financial, clinical, team  
✅ Renderizar seções: Equipe, Financeiro, Clínico, Marketing, etc.  
✅ Renderizar cards dentro dessas seções normalmente

## Arquivos Alterados

### `src/hooks/useDashboardPermissions.ts`
- **Linha 220-227**: Short-circuit em `canAccessDomain` para admin/owner
- **Linha 101-139**: Logs aprimorados de visibilidade final por domínio
- **Linha 166-195**: Logs aprimorados em `canViewDashboardCard` com contexto adicional

## Impacto

- ✅ Admin e Owner: Acesso total a todos os domínios do dashboard
- ✅ Outros roles: Continuam seguindo `level_role_settings` normalmente
- ✅ Sem quebra de funcionalidade existente
- ✅ Logs de debug continuam funcionando para diagnóstico
- ✅ Cards de "team" agora visíveis para admin/owner

## Cards de Team Afetados

Todos os cards com `domain: 'team'` definidos em `src/types/cardTypes.ts`:

- `dashboard-expected-revenue-team`: Receita esperada da equipe
- `dashboard-actual-revenue-team`: Receita realizada da equipe
- `dashboard-unpaid-value-team`: Valor a receber da equipe
- `dashboard-payment-rate-team`: Taxa de pagamento da equipe
- `dashboard-total-patients-team`: Total de pacientes da equipe
- `dashboard-attended-sessions-team`: Sessões realizadas pela equipe
- `dashboard-active-therapists-team`: Terapeutas ativos na equipe

## Próximos Passos

Se ainda houver bloqueios após recarregar:

1. Verificar logs `[DASH_PERM] ❌ Card bloqueado por domínio` e verificar se `isAdmin` ou `isOrganizationOwner` estão `false`
2. Verificar logs `[PERM]` de `resolveEffectivePermissions` para confirmar que o bootstrap está sendo aplicado
3. Verificar se há outra lógica de filtro (ex: em seções ou layouts) que esteja bloqueando antes de chegar em `canViewDashboardCard`

