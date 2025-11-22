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

## Arquitetura

A solução trabalha em conjunto com o sistema existente:

1. **resolveEffectivePermissions** aplica bootstrap permissivo para admin/owner (já estava correto)
2. **canAccessDomain** agora faz bypass total para admin/owner ANTES de verificar domínios
3. O contexto de permissões (`DashboardPermissionContext`) já contém `isAdmin` e `isOrganizationOwner`

## Justificativa

- **Segurança**: Apenas Admin e Owner recebem bypass total
- **Consistência**: Alinha com a filosofia de bootstrap permissivo já aplicada em `resolveEffectivePermissions`
- **Simplicidade**: Evita complexidade desnecessária no switch case para roles privilegiados

## Validação

Após a mudança, recarregar `/dashboard` como Admin deve:

✅ Mostrar log `[DASH_PERM] 🌐 Visibilidade final por domínio` com todos os domínios `canView: true`  
✅ NÃO mostrar mais logs `[DASH_PERM] ❌ Card bloqueado por domínio` para financial, clinical, team  
✅ Renderizar seções: Equipe, Financeiro, Clínico, Marketing, etc.  
✅ Renderizar cards dentro dessas seções normalmente

## Impacto

- ✅ Admin e Owner: Acesso total a todos os domínios do dashboard
- ✅ Outros roles: Continuam seguindo `level_role_settings` normalmente
- ✅ Sem quebra de funcionalidade existente
- ✅ Logs de debug continuam funcionando para diagnóstico
