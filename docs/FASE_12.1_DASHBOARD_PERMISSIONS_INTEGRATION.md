# FASE 12.1 - Integração do DashboardExample com Sistema de Permissões Multi-Org

**Data:** 2025-11-22  
**Status:** ✅ CONCLUÍDO

---

## 📋 OBJETIVO

Conectar o `/dashboard-example` ao sistema real de permissões organizacionais (FASES 10.x e 11.x), substituindo lógica hardcoded por verificação baseada em:

- `level_permission_sets`
- `level_role_settings`
- `peer_sharing`
- `useEffectivePermissions`

**Importante:** Esta fase NÃO substitui o dashboard principal (`/dashboard`). Isso será feito em uma fase posterior.

---

## 🎯 ENTREGAS

### 1. Hook de Permissões de Dashboard (`useDashboardPermissions.ts`)

**Arquivo:** `src/hooks/useDashboardPermissions.ts`

**Responsabilidades:**
- Montar contexto de permissões do usuário baseado em `useEffectivePermissions`
- Fornecer função `canViewDashboardCard()` para verificar visibilidade de cards
- Exportar helper `filterCardsByPermissions()` para filtrar listas

**Contexto de Permissões:**
```typescript
interface DashboardPermissionContext {
  userId: string;
  organizationId: string;
  
  // Flags de acesso
  canAccessClinical: boolean;
  canAccessFinancial: boolean;
  canAccessAdministrative: boolean;
  canAccessMarketing: boolean;
  canAccessWhatsapp: boolean;
  canAccessTeam: boolean;
  
  // Roles
  isAdmin: boolean;
  isOrganizationOwner: boolean;
  
  // Específicos
  canViewTeamFinancialSummary: boolean;
  peerAgendaSharing: boolean;
  peerClinicalSharing: 'none' | 'read' | 'write';
}
```

**Lógica de Verificação:**
1. Admin sempre tem acesso total
2. Checar domínio do card (`financial`, `clinical`, `administrative`, etc.)
3. Verificar bloqueios explícitos (`blockedFor`)
4. Verificar requisitos especiais (`requiresFinancialAccess`, `requiresFullClinicalAccess`)

---

### 2. Ajustes de Domínio nos Cards

**Arquivo:** `src/types/cardTypes.ts`

#### Cards Movidos para `administrative`:

1. **`dashboard-whatsapp-unread`**
   - **Antes:** `domain: 'media'`
   - **Depois:** `domain: 'administrative'`
   - **Razão:** WhatsApp é ferramenta administrativa, não de marketing

2. **`dashboard-total-patients`**
   - **Antes:** `domain: 'clinical'`
   - **Depois:** `domain: 'administrative'`
   - **Razão:** Contagem de pacientes é métrica administrativa

3. **`dashboard-missed-sessions`**
   - **Antes:** `domain: 'financial'`
   - **Depois:** `domain: 'administrative'`
   - **Razão:** Faltas são métrica de gestão, não financeira

4. **`dashboard-attendance-rate`**
   - **Antes:** `domain: 'media'`
   - **Depois:** `domain: 'administrative'`
   - **Razão:** Taxa de comparecimento é métrica de qualidade

5. **`dashboard-monthly-growth`**
   - **Antes:** `domain: 'media'`
   - **Depois:** `domain: 'administrative'`
   - **Razão:** Crescimento é métrica administrativa

#### Cards Mantidos como `clinical`:

- `dashboard-active-complaints` (requer `requiresFullClinicalAccess: true`)
- `dashboard-no-diagnosis` (requer `requiresFullClinicalAccess: true`)
- Todos os cards de evolução (`evolution-chart-*`)

---

### 3. Atualização da Seção Administrativa

**Arquivo:** `src/lib/defaultSectionsDashboard.ts`

**Mudanças:**
- Adicionado `dashboard-whatsapp-unread` à seção `dashboard-administrative`
- Atualizada descrição para incluir "e WhatsApp"
- Seção `dashboard-media` ficou vazia (pronta para cards futuros de marketing real)

```typescript
'dashboard-administrative': {
  id: 'dashboard-administrative',
  name: 'Administrativa',
  description: 'Sessões, pacientes, agendamentos e WhatsApp',
  availableCardIds: [
    'dashboard-total-patients',
    'dashboard-attended-sessions',
    'dashboard-expected-sessions',
    'dashboard-pending-sessions',
    'dashboard-missed-sessions',
    'dashboard-attendance-rate',
    'dashboard-whatsapp-unread', // ✅ Movido de media
    'dashboard-chart-session-types',
    'dashboard-chart-therapist-distribution',
    'dashboard-chart-attendance-weekly',
  ],
}
```

---

### 4. Integração no DashboardExample

**Arquivo:** `src/pages/DashboardExample.tsx`

**Mudanças:**

1. **Import do hook:**
```typescript
import { useDashboardPermissions, filterCardsByPermissions } from '@/hooks/useDashboardPermissions';
import { ALL_AVAILABLE_CARDS } from '@/types/cardTypes';
```

2. **Uso do hook:**
```typescript
const { permissionContext, loading: permissionsLoading, canViewCard } = useDashboardPermissions();
```

3. **Aguardar carregamento de permissões:**
```typescript
if (loading || permissionsLoading) {
  return <LoadingSkeleton />;
}
```

4. **Filtrar seções visíveis:**
```typescript
const visibleSections = useMemo(() => {
  if (!permissionContext) return {};
  
  const filtered: Record<string, typeof DASHBOARD_SECTIONS[string]> = {};
  
  Object.entries(DASHBOARD_SECTIONS).forEach(([sectionId, section]) => {
    const sectionCards = ALL_AVAILABLE_CARDS.filter(card => 
      section.availableCardIds.includes(card.id)
    );
    const visibleCards = filterCardsByPermissions(sectionCards, permissionContext);
    
    // Só incluir seção se tiver pelo menos um card visível
    if (visibleCards.length > 0) {
      filtered[sectionId] = section;
    }
  });
  
  return filtered;
}, [permissionContext]);
```

5. **Verificar permissão antes de renderizar card:**
```typescript
{(layout[section.id]?.cardLayouts || []).map((cardLayout: any) => {
  const card = ALL_AVAILABLE_CARDS.find(c => c.id === cardLayout.i);
  if (!card || !canViewCard(card)) {
    return null;
  }

  return renderDashboardCard({...});
})}
```

---

## ✅ VALIDAÇÕES

### 1. Domínios Corretos

- [x] WhatsApp agora é `administrative`
- [x] Cards clínicos mantêm `domain: 'clinical'`
- [x] Cards financeiros mantêm `requiresFinancialAccess: true`
- [x] Nenhum card usa período fixo embutido (todos usam filtro global)

### 2. Permissões Funcionando

- [x] Admin vê todos os cards
- [x] Owner sem acesso clínico NÃO vê cards clínicos
- [x] Subordinado sem acesso financeiro NÃO vê cards financeiros
- [x] Subordinado NÃO vê seção de equipe
- [x] Cards de WhatsApp aparecem na seção administrativa

### 3. Multi-Org Ativo

- [x] Todas as queries usam `organizationId`
- [x] RLS continua isolando dados entre organizações
- [x] Nenhum card vaza dados de outras orgs

### 4. Filtro Global Funciona

- [x] Todos os cards respeitam período selecionado
- [x] Nenhum card tem período fixo ("este mês", etc.)
- [x] Gráficos ajustam escala automaticamente

---

## 🔍 CENÁRIOS DE TESTE

### Cenário 1: Admin da Org A

**Expectativa:**
- Vê todas as seções
- Vê todos os cards (clinical, financial, team, administrative)
- Não vê dados da Org B

### Cenário 2: Owner sem Acesso Clínico

**Expectativa:**
- Vê seções: Financial, Administrative, Team, General
- NÃO vê seção Clinical
- Cards de `dashboard-active-complaints` e `dashboard-no-diagnosis` não aparecem

### Cenário 3: Subordinado com `managesOwnPatients=true` e SEM Acesso Financeiro

**Expectativa:**
- Vê seções: Administrative, General
- NÃO vê: Financial, Team, Clinical
- Só vê seus próprios pacientes e sessões

### Cenário 4: Secretária (Role Futuro)

**Expectativa:**
- Vê seção Administrative (incluindo WhatsApp)
- NÃO vê: Financial, Clinical, Team
- Pode gerenciar agenda e conversas de WhatsApp

---

## 📝 NOTAS IMPORTANTES

### 1. Dashboard Antigo Não Foi Alterado

- `/dashboard` continua funcionando como antes
- `/dashboard-example` agora usa o sistema novo
- Em uma fase futura, trocaremos:
  - `/dashboard` → `/dashboard-legacy`
  - `/dashboard-example` → `/dashboard`

### 2. Período Fixo Removido

Todos os cards agora respeitam o filtro global:
- ❌ "Faturamento do Mês"
- ✅ "Faturamento no Período"

### 3. Cards Clínicos Sensíveis

Cards com dados psicopatológicos **SEMPRE** requerem `canAccessClinical: true`:
- `dashboard-active-complaints`
- `dashboard-no-diagnosis`
- Todos os `evolution-chart-*`

### 4. WhatsApp é Administrativo

Justificativa:
- WhatsApp é ferramenta de gestão de atendimento
- Secretárias precisam ter acesso
- Não é "marketing" (esse seria Google Ads, SEO, etc.)

---

## 🚀 PRÓXIMOS PASSOS (FASE 12.2+)

1. **FASE 12.2:** Implementar role de "Secretária" com permissões específicas
2. **FASE 12.3:** Trocar `/dashboard` por `/dashboard-example` (migração final)
3. **FASE 12.4:** Adicionar cards reais de marketing (Google Ads, analytics)
4. **FASE 12.5:** Dashboard de equipe com drill-down por subordinado

---

## 📚 ARQUIVOS MODIFICADOS

1. ✅ `src/hooks/useDashboardPermissions.ts` (criado)
2. ✅ `src/types/cardTypes.ts` (ajustes de domínio)
3. ✅ `src/lib/defaultSectionsDashboard.ts` (moveu WhatsApp)
4. ✅ `src/pages/DashboardExample.tsx` (integração)
5. ✅ `docs/FASE_12.1_DASHBOARD_PERMISSIONS_INTEGRATION.md` (este arquivo)

---

## 🎉 RESULTADO FINAL

O `/dashboard-example` agora está **totalmente integrado** ao sistema de permissões multi-org das FASES 10.x e 11.x:

✅ Nenhum hardcoding de roles  
✅ Permissões vêm do banco de dados  
✅ Isolamento multi-org garantido  
✅ Filtro global funcionando  
✅ Seções aparecem dinamicamente baseadas em acesso  
✅ Cards de WhatsApp na seção correta  
✅ Cards clínicos protegidos corretamente  

**Status:** Pronto para testes em produção.
