# FASE 12.1.2 – Garantir Visibilidade Total para Owner/Admin no Dashboard

## 📋 Resumo

Ajustamos o sistema de permissões do dashboard (`useDashboardPermissions.ts`) para garantir que **Admin** e **Owner Primário** tenham **visibilidade TOTAL** de todas as seções e cards, com logs de debug detalhados.

---

## 🔧 Mudanças Implementadas

### 1. **Full Access para Admin/Owner**

No `useDashboardPermissions.ts`:

```typescript
const hasFullAccess = isAdmin || isOrganizationOwner;

// Se for admin/owner, todas as flags são true
canAccessClinical: hasFullAccess ? true : canAccessClinical,
canAccessFinancial: hasFullAccess ? true : (financialAccess !== 'none'),
canAccessMarketing: hasFullAccess ? true : canAccessMarketing,
canAccessWhatsapp: hasFullAccess ? true : canAccessWhatsapp,
canAccessTeam: hasFullAccess ? true : (canViewTeamFinancialSummary || isOrganizationOwner),
// etc.
```

### 2. **Bypass Total em `canViewDashboardCard`**

```typescript
export function canViewDashboardCard(card, ctx) {
  if (!ctx) return false;
  
  // FASE 12.1.2: Admin e Owner têm visibilidade TOTAL - bypass todas as checagens
  if (ctx.isAdmin || ctx.isOrganizationOwner) {
    return true;
  }
  
  // Resto da lógica só se não for admin/owner
  // ...
}
```

### 3. **Bypass Total em `canAccessDomain`**

```typescript
function canAccessDomain(domain, ctx) {
  // FASE 12.1.2: Admin e Owner têm acesso TOTAL a todos os domínios
  if (ctx.isAdmin || ctx.isOrganizationOwner) return true;
  
  // Resto da lógica só se não for admin/owner
  // ...
}
```

### 4. **Logs de Debug Detalhados**

Adicionado log completo no `useDashboardPermissions`:

```typescript
console.log('[DASH_PERM] Visibilidade Dashboard', {
  userId: ctx.userId,
  organizationId: ctx.organizationId,
  isAdmin: ctx.isAdmin,
  isOrganizationOwner: ctx.isOrganizationOwner,
  hasFullAccess,
  visibility: {
    financial: { canViewSection: ctx.canAccessFinancial },
    administrative: { canViewSection: ctx.canAccessAdministrative },
    clinical: { canViewSection: ctx.canAccessClinical },
    general: { canViewSection: true },
    charts: { canViewSection: true },
    team: { canViewSection: ctx.canAccessTeam },
    marketing: { canViewSection: ctx.canAccessMarketing },
    media: { canViewSection: ctx.canAccessMarketing },
  },
});
```

---

## ✅ Comportamento Esperado

### **Admin ou Owner Primário:**
- ✅ Vê **TODAS** as seções: financial, administrative, clinical, general, charts, team, marketing, media
- ✅ Pode adicionar **TODOS** os cards disponíveis via editor de layout
- ✅ Bypass completo de todas as checagens de permissão
- ✅ Logs mostram `hasFullAccess: true` e todas as seções com `canViewSection: true`

### **Usuários com Permissões Limitadas:**
- Respeitam as configurações de `level_permission_sets`, `level_role_settings`, etc.
- Veem apenas as seções e cards autorizados para seu nível/posição

---

## 🐛 Debug

Para verificar as permissões no console:

1. Acesse `/dashboard-example`
2. Abra DevTools → Console
3. Procure por `[DASH_PERM] Visibilidade Dashboard`
4. Verifique:
   - `isAdmin` ou `isOrganizationOwner` está `true`?
   - `hasFullAccess` está `true`?
   - Todas as seções em `visibility` estão com `canViewSection: true`?

---

## 📝 Arquivos Modificados

- **`src/hooks/useDashboardPermissions.ts`**
  - Lógica de full access para admin/owner
  - Logs de debug detalhados
  - Bypass em `canViewDashboardCard` e `canAccessDomain`

---

## 🎯 Checklist Final

- [x] Admin/Owner têm `hasFullAccess = true`
- [x] Todas as flags de acesso setadas como `true` para admin/owner
- [x] `canViewDashboardCard` faz bypass total para admin/owner
- [x] `canAccessDomain` faz bypass total para admin/owner
- [x] Logs de debug implementados com `[DASH_PERM]`
- [x] Nenhum hook usado fora de componente React
- [x] Lógica defensiva contra `ctx` incompleto

---

## 🚀 Próximos Passos

Testar em `/dashboard-example` logado como:
- ✅ Owner primário → deve ver tudo
- ✅ Admin → deve ver tudo
- ✅ Usuário com permissões limitadas → deve respeitar restrições
