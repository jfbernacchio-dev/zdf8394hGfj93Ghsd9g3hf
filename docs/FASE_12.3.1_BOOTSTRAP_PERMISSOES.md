# FASE 12.3.1 — Bootstrap de Permissões

**Status**: ✅ Concluído  
**Data**: 2025-11-22

---

## 📋 Objetivo

Garantir que admin/owner tenham acesso completo ao dashboard mesmo quando não existir configuração de `level_role_settings` para seu nível + role, através de um sistema de bootstrap automático de permissões.

---

## 🎯 Problema Identificado

Após a FASE 12.3, o sistema passou a depender exclusivamente de `level_role_settings` para determinar permissões do dashboard. Porém:

1. **Organizações novas** podem não ter `level_role_settings` configurados
2. **Admin/Owner** ficavam sem acesso ao dashboard por falta de configuração
3. **Gestão Organizacional** não tinha logs adequados para debug
4. **Cards de Equipe** não funcionavam sem `level_role_settings`

---

## 🔧 Mudanças Implementadas

### 1. Bootstrap Automático em `resolveEffectivePermissions` ✅

**Arquivo**: `src/lib/resolveEffectivePermissions.ts`

#### Lógica de Bootstrap:

Quando **NÃO** existe `level_role_settings` para o nível + role do usuário:

```typescript
// Admin/Owner → Full Access
if (roleGlobal === 'admin' || hierarchyInfo.isOwner) {
  return getDefaultFullPermissions(); // Todos os acessos
}

// Assistant → Moderado (agenda + admin + marketing)
if (roleGlobal === 'assistant') {
  return {
    canAccessClinical: false,
    financialAccess: 'summary',
    canAccessMarketing: true,
    canAccessWhatsapp: true,
    canEditSchedules: true,
    // ...
  };
}

// Accountant → Financeiro Full
if (roleGlobal === 'accountant') {
  return {
    canAccessClinical: false,
    financialAccess: 'full',
    canViewTeamFinancialSummary: true,
    // ...
  };
}

// Psychologist → Clínico + Agenda
if (roleGlobal === 'psychologist') {
  return {
    canAccessClinical: true,
    financialAccess: 'summary',
    peerAgendaSharing: true,
    peerClinicalSharing: 'view',
    canEditSchedules: true,
    // ...
  };
}
```

#### Logs Adicionados:

```typescript
console.log('[PERM] 🧩 level_role_settings carregado', {
  levelId,
  globalRole,
  roleSettings,
  error,
});

console.warn('[PERM] ⚠️ Nenhum level_role_settings para este nível/role. Aplicando bootstrap automático.', {
  levelId,
  globalRole,
  isOwner,
});

console.log('[PERM] 🚀 Bootstrap permissivo aplicado (admin/owner):', bootstrapPermissions);
```

---

### 2. Logs de Debug em Gestão Organizacional ✅

**Arquivo**: `src/pages/OrgManagement.tsx`

#### Logs Adicionados:

```typescript
// Ao carregar níveis
console.log('[ORG_MGMT] 🔎 Dados de níveis carregados', {
  levelsCount: safeLevels?.length || 0,
  organizationId,
  error: null,
});

// Ao carregar posições e usuários
console.log('[ORG_MGMT] 🔎 Dados de posições e usuários carregados', {
  positionsCount: positions?.length || 0,
  userPositionsCount: enrichedData?.length || 0,
  organizationId,
  errorPositions: null,
  errorUserPositions: null,
});

// Em caso de erro
console.log('[ORG_MGMT] ❌ Erro ao buscar níveis', {
  error,
  organizationId,
});
```

**Benefícios**:
- ✅ Debug fácil de problemas de RLS
- ✅ Visibilidade de queries vazias
- ✅ Rastreamento de organization_id

---

### 3. Log Final no Dashboard ✅

**Arquivo**: `src/pages/DashboardExample.tsx`

```typescript
useEffect(() => {
  console.log('[DASHBOARD] ✅ FASE 12.3 aplicada. Dashboard agora respeita level_role_settings + sharing.', {
    organizationId,
  });
}, [organizationId]);
```

---

## 🧪 Comportamento Esperado

### 1. Admin/Owner SEM `level_role_settings`

**Console Logs**:
```
[PERM] 🧩 level_role_settings carregado {
  levelId: "uuid-123",
  globalRole: "admin",
  roleSettings: null,
  error: null
}

[PERM] ⚠️ Nenhum level_role_settings para este nível/role. Aplicando bootstrap automático. {
  levelId: "uuid-123",
  globalRole: "admin",
  isOwner: true
}

[PERM] 🚀 Bootstrap permissivo aplicado (admin/owner): {
  canAccessClinical: true,
  financialAccess: "full",
  canAccessMarketing: true,
  canAccessWhatsapp: true,
  canEditSchedules: true,
  canViewTeamFinancialSummary: true,
  ...
}

[DASH_PERM] 🔎 Visibilidade calculada por level_role_settings {
  userId: "uuid-user",
  organizationId: "uuid-org",
  visibility: {
    financial: { canViewSection: true },
    administrative: { canViewSection: true },
    clinical: { canViewSection: true },
    team: { canViewSection: true },
    charts: { canViewSection: true },
    ...
  }
}

[DASHBOARD] ✅ FASE 12.3 aplicada. Dashboard agora respeita level_role_settings + sharing. {
  organizationId: "uuid-org"
}
```

**Resultado Visual**:
- ✅ Todas as seções aparecem (Financeira, Equipe, Gráficos, Administrativa)
- ✅ Todos os cards funcionam
- ✅ Métricas de equipe carregam dados

---

### 2. Therapist SEM `level_role_settings`

**Console Logs**:
```
[PERM] 🚀 Bootstrap clínico aplicado (psychologist): {
  canAccessClinical: true,
  financialAccess: "summary",
  canAccessMarketing: false,
  peerAgendaSharing: true,
  canEditSchedules: true,
  ...
}
```

**Resultado Visual**:
- ✅ Seção Clínica aparece
- ✅ Seção Administrativa aparece
- ❌ Seção Financeira **não** aparece (só summary nas cards de próprios pacientes)
- ❌ Seção Marketing **não** aparece

---

### 3. Gestão Organizacional

**Console Logs**:
```
[ORG_MGMT] 🔎 Dados de níveis carregados {
  levelsCount: 3,
  organizationId: "uuid-org",
  error: null
}

[ORG_MGMT] 🔎 Dados de posições e usuários carregados {
  positionsCount: 5,
  userPositionsCount: 8,
  organizationId: "uuid-org",
  errorPositions: null,
  errorUserPositions: null
}
```

**Resultado Visual**:
- ✅ Níveis renderizados corretamente
- ✅ Usuários aparecem em suas posições
- ✅ Drag & drop funciona

---

## ✅ Validação

### Checklist:

- [x] Bootstrap aplica **full access** para admin/owner sem `level_role_settings`
- [x] Bootstrap aplica permissões **moderadas** para assistant
- [x] Bootstrap aplica permissões **financeiras** para accountant
- [x] Bootstrap aplica permissões **clínicas** para psychologist
- [x] Logs `[PERM] 🧩` aparecem na carga de permissões
- [x] Logs `[ORG_MGMT] 🔎` aparecem na Gestão Organizacional
- [x] Dashboard carrega seções corretas baseado no bootstrap
- [x] Cards de Equipe funcionam com dados de `getDashboardVisibleUserIds`
- [x] Gestão Organizacional não depende de `useDashboardPermissions`

---

## 🎓 Próximos Passos (Fora do Escopo)

- ⏭️ **FASE 12.4**: Aplicar permissões em PatientDetail/PatientEvolution
- ⏭️ **FASE 12.5**: UI para configurar `level_role_settings` manualmente
- ⏭️ **FASE 12.6**: UI para configurar `level_sharing_config` e `peer_sharing`

---

## 📝 Notas Técnicas

### Diferença entre `getDefaultFullPermissions` e Bootstrap:

- **`getDefaultFullPermissions`**: Usado quando usuário **não tem nível ou role** (fallback de erro)
- **Bootstrap**: Usado quando usuário **tem nível/role mas sem `level_role_settings`** configurado

### Ordem de Precedência:

1. ✅ `level_role_settings` **existe** → usa configuração explícita
2. ✅ `level_role_settings` **não existe** + admin/owner → bootstrap permissivo
3. ✅ `level_role_settings` **não existe** + outro role → bootstrap por role
4. ⚠️ Sem nível ou role → `getDefaultFullPermissions` (erro/exceção)

---

## 🔍 Comandos de Debug

### Verificar Permissões do Usuário:
```sql
SELECT * FROM level_role_settings
WHERE level_id = (
  SELECT level_id FROM organization_positions op
  JOIN user_positions up ON up.position_id = op.id
  WHERE up.user_id = 'uuid-do-usuario'
)
AND role_type = (
  SELECT role FROM user_roles WHERE user_id = 'uuid-do-usuario'
);
```

### Verificar Bootstrap Aplicado:
```
Abra o console do navegador e filtre por: [PERM] 🚀 Bootstrap
```

---

**Fim do Relatório FASE 12.3.1**
