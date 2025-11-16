# 🔐 SISTEMA DE PERMISSÕES - DOCUMENTAÇÃO COMPLETA

## 📋 VISÃO GERAL

Este documento descreve o sistema completo de permissões implementado nas Sprints 0-5, incluindo arquitetura, fluxos de dados e guias de uso.

---

## 🏗️ ARQUITETURA DO SISTEMA

### 1. **CAMADAS DE SEGURANÇA**

```
┌─────────────────────────────────────────────────────────────┐
│  CAMADA 1: Route Protection (PermissionRoute)               │
│  → Bloqueia acesso a rotas inteiras baseado em roles        │
│  → Verifica domínios e níveis de acesso mínimos             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  CAMADA 2: Card/Component Filtering                         │
│  → Esconde cards não autorizados do dashboard               │
│  → Filtra componentes baseado em permissões                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  CAMADA 3: Data Query Filtering                             │
│  → Filtra queries do Supabase                               │
│  → Garante que apenas dados autorizados sejam carregados    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  CAMADA 4: RLS (Row Level Security) - Supabase             │
│  → Última linha de defesa no banco de dados                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 ARQUIVOS PRINCIPAIS

### **HOOKS** (src/hooks/)

#### `useSubordinatePermissions.ts`
- **Propósito**: Carregar e expor permissões do subordinado
- **Retorna**: 
  - `permissions`: ExtendedAutonomyPermissions
  - `loading`: boolean
  - `isFullTherapist`: boolean

```typescript
const { permissions, loading, isFullTherapist } = useSubordinatePermissions();
```

#### `useCardPermissions.ts`
- **Propósito**: Verificar permissões de cards e domínios
- **Métodos principais**:
  - `hasAccess(domain, minLevel)`: Verifica acesso a um domínio
  - `canViewCard(cardId)`: Verifica se pode ver um card específico
  - `shouldFilterToOwnData()`: Indica se deve filtrar dados para próprios
  - `canViewFullFinancial()`: Verifica acesso a fechamento financeiro completo

```typescript
const { canViewCard, shouldFilterToOwnData, canViewFullFinancial } = useCardPermissions();
```

---

### **TYPES** (src/types/)

#### `permissions.ts`
Define todos os tipos relacionados a permissões:

```typescript
// Roles do sistema
type UserRole = 'admin' | 'subordinate' | 'accountant';

// Domínios funcionais
type PermissionDomain = 
  | 'clinical'       // Dados clínicos
  | 'financial'      // Dados financeiros
  | 'administrative' // Administrativo
  | 'patients'       // Gestão de pacientes
  | 'statistics'     // Estatísticas
  | 'nfse'           // NFSe
  | 'schedule'       // Agenda
  | 'reports';       // Relatórios

// Níveis de acesso
type AccessLevel = 'none' | 'read' | 'write' | 'full';

// Permissões estendidas (derivadas de subordinate_autonomy_settings)
interface ExtendedAutonomyPermissions {
  // Base (da tabela)
  managesOwnPatients: boolean;
  hasFinancialAccess: boolean;
  nfseEmissionMode: 'own_company' | 'manager_company';
  
  // Derivadas (calculadas)
  canFullSeeClinic: boolean;
  includeInFullFinancial: boolean;
  canViewFullFinancial: boolean;
  canViewOwnFinancial: boolean;
  canManageAllPatients: boolean;
  canManageOwnPatients: boolean;
  isFullTherapist: boolean;
}
```

#### `cardTypes.ts`
Define configuração de permissões para cada card:

```typescript
interface CardPermissionConfig {
  domain: PermissionDomain;
  requiresFinancialAccess?: boolean;
  blockedForSubordinates?: boolean;
  onlyForOwn?: boolean;
}
```

---

### **LIBS** (src/lib/)

#### `checkPermissions.ts`
- **Função principal**: `checkRoutePermission(userRoles, routeConfig)`
- **Lógica**:
  1. Se `allowedFor` existe: usuário DEVE ter um dos roles
  2. Se `blockedFor` existe: usuário NÃO PODE ter nenhum dos roles
  3. `allowedFor` tem precedência sobre `blockedFor`

#### `routePermissions.ts`
- **Propósito**: Configuração de permissões por rota
- **Campos**:
  - `allowedFor`: Lista branca de roles
  - `blockedFor`: Lista negra de roles
  - `requiresDomain`: Domínio necessário para acesso
  - `minimumAccess`: Nível mínimo de acesso ao domínio

```typescript
export const routePermissions: RoutePermissionsConfig = {
  '/financial': {
    blockedFor: ['accountant'],
    requiresDomain: 'financial',
    minimumAccess: 'read',
  },
  // ...
};
```

#### `checkPatientAccess.ts`
Funções de validação de acesso a pacientes:

```typescript
// Validar acesso básico ao paciente
canAccessPatient(userId, patientId, isAdmin): Promise<AccessResult>

// Validar edição de paciente
canEditPatient(userId, patientId, isAdmin): Promise<AccessResult>

// Validar acesso a dados financeiros
canViewPatientFinancials(userId, patientId, isAdmin, permissions): Promise<AccessResult>

// Validar acesso a dados clínicos
canViewPatientClinicalData(userId, patientId, isAdmin, permissions): Promise<AccessResult>
```

#### `queryFilters.ts`
Utilitários para filtrar queries:

```typescript
// Obter IDs de pacientes visíveis
getViewablePatientsUserIds(userId, shouldFilterToOwn): Promise<string[]>

// Obter IDs para fechamento financeiro
getFinancialClosingUserIds(userId, canViewFullFinancial): Promise<string[]>

// Aplicar filtro em query de pacientes
applyPatientsFilter(query, userId, shouldFilterToOwn): Promise<any>

// Aplicar filtro em query de sessões financeiras
applyFinancialFilter(query, userId, canViewFullFinancial): Promise<any>
```

#### `defaultLayoutDashboard.ts` & `defaultLayoutEvolution.ts`
Funções para obter layouts filtrados por permissões:

```typescript
getFilteredDashboardLayout(permissions, isAdmin, canViewCard)
getFilteredEvolutionLayout(permissions, isAdmin, canViewCard)
```

---

## 🔄 FLUXOS DE DADOS

### **FLUXO 1: Carregamento Inicial**

```
1. User faz login
   ↓
2. AuthContext carrega roles (admin, subordinate, accountant)
   ↓
3. useSubordinatePermissions() carrega autonomy_settings
   ↓
4. useCardPermissions() calcula permissões derivadas
   ↓
5. Dashboard/Páginas aplicam filtros
   ↓
6. Dados carregados respeitando permissões
```

### **FLUXO 2: Navegação de Rotas**

```
1. User clica em link ou digita URL
   ↓
2. PermissionRoute intercepta navegação
   ↓
3. Verifica roles (allowedFor/blockedFor)
   ↓
4. Verifica domínio (requiresDomain/minimumAccess)
   ↓
5. Se negado → Toast + Redirect
   ↓
6. Se permitido → Renderiza página
```

### **FLUXO 3: Filtragem de Dados**

```
1. Página precisa carregar dados
   ↓
2. Chama shouldFilterToOwnData() ou canViewFullFinancial()
   ↓
3. Usa queryFilters para obter IDs permitidos
   ↓
4. Aplica filtro na query do Supabase
   ↓
5. Supabase retorna apenas dados autorizados
   ↓
6. RLS valida novamente no banco
```

---

## 🎯 REGRAS DE NEGÓCIO

### **SUBORDINADOS COM managesOwnPatients = true**

✅ **PODEM:**
- Ver apenas SEUS próprios pacientes
- Criar novos pacientes (ficam vinculados a eles)
- Editar seus pacientes
- Ver agenda com seus pacientes
- (Se hasFinancialAccess) Ver suas próprias finanças

❌ **NÃO PODEM:**
- Ver pacientes de outros terapeutas (incluindo Full)
- Ver fechamento financeiro do Full
- Acessar gestão de terapeutas
- Ver métricas globais da clínica

---

### **SUBORDINADOS COM managesOwnPatients = false**

✅ **PODEM:**
- Ver TODOS os pacientes da clínica (próprios + de outros)
- Editar qualquer paciente
- Ver dados clínicos completos
- (Se hasFinancialAccess) Ver finanças completas

❌ **NÃO PODEM:**
- (Mesmas restrições administrativas que o anterior)

---

### **ADMIN/FULL THERAPIST**

✅ **PODEM:**
- Ver TODOS os pacientes EXCETO de subordinados com managesOwnPatients = true
- Ver finanças completas (próprias + subordinados com includeInFullFinancial)
- Gerenciar terapeutas subordinados
- Acessar todas as configurações e relatórios
- Ver métricas globais da clínica

❌ **NÃO PODEM:**
- Ver pacientes de subordinados autônomos (managesOwnPatients = true)
- Ver dados clínicos privados de subordinados autônomos

---

### **ACCOUNTANT**

✅ **PODEM:**
- Acessar dashboard específico de contador
- Ver relatórios contábeis autorizados

❌ **NÃO PODEM:**
- Acessar dados clínicos
- Acessar gestão de pacientes
- Ver agendas
- Acessar configurações da clínica

---

## 🗺️ MAPEAMENTO DOMÍNIO → ACESSO

Para **SUBORDINADOS**:

| Domínio        | Acesso          | Baseado em                                    |
|----------------|-----------------|-----------------------------------------------|
| `financial`    | full ou none    | `hasFinancialAccess`                          |
| `nfse`         | full ou none    | `hasFinancialAccess`                          |
| `patients`     | full, read, none| `canManageAllPatients` / `canManageOwnPatients` |
| `clinical`     | full, read, none| `canFullSeeClinic` / `canManageOwnPatients`   |
| `schedule`     | read            | Sempre (subordinados sempre veem agenda)      |
| `administrative` | read          | Sempre (WhatsApp, etc.)                       |
| `statistics`   | read ou none    | `hasFinancialAccess`                          |
| `reports`      | read ou none    | `hasFinancialAccess`                          |

---

## 📝 EXEMPLOS DE USO

### **Exemplo 1: Filtrar Lista de Pacientes**

```typescript
// pages/Patients.tsx
import { useCardPermissions } from '@/hooks/useCardPermissions';

const { shouldFilterToOwnData } = useCardPermissions();

const loadData = async () => {
  let query = supabase.from('patients').select('*');
  
  if (shouldFilterToOwnData()) {
    // Subordinado autônomo: só seus pacientes
    query = query.eq('user_id', user!.id);
  } else {
    // Admin/Full: próprios + subordinados não autônomos
    const viewableIds = await getViewablePatientsUserIds(user!.id, false);
    query = query.in('user_id', viewableIds);
  }
  
  const { data } = await query;
  setPatients(data || []);
};
```

---

### **Exemplo 2: Verificar Acesso a Card**

```typescript
// components/AddCardDialog.tsx
import { useCardPermissions } from '@/hooks/useCardPermissions';

const { canViewCard } = useCardPermissions();

const availableCards = AVAILABLE_DASHBOARD_CHARTS.filter(card => 
  canViewCard(card.id)
);
```

---

### **Exemplo 3: Proteger Rota**

```typescript
// App.tsx
<Route 
  path="/financial" 
  element={
    <ProtectedRoute>
      <PermissionRoute path="/financial">
        <Layout><Financial /></Layout>
      </PermissionRoute>
    </ProtectedRoute>
  } 
/>
```

---

### **Exemplo 4: Validar Acesso a Paciente**

```typescript
// pages/PatientDetail.tsx
import { canAccessPatient } from '@/lib/checkPatientAccess';

useEffect(() => {
  const validateAccess = async () => {
    const access = await canAccessPatient(user.id, patientId, isAdmin);
    
    if (!access.allowed) {
      toast({
        title: "Acesso negado",
        description: access.reason,
        variant: "destructive"
      });
      navigate('/patients');
    }
  };
  
  validateAccess();
}, [user, patientId]);
```

---

## 🐛 DEBUGGING

### **Problema: Usuário não vê seus próprios dados**

1. Verificar role no AuthContext: `isAdmin`, `isSubordinate`, `isAccountant`
2. Verificar `subordinate_autonomy_settings` no Supabase
3. Verificar logs do `useSubordinatePermissions`:
   ```javascript
   console.log('[useSubordinatePermissions]', permissions);
   ```
4. Verificar se RLS policies estão corretas

---

### **Problema: Cards financeiros aparecem quando não deveriam**

1. Verificar `hasFinancialAccess` na tabela `subordinate_autonomy_settings`
2. Verificar mapeamento do card em `src/types/cardTypes.ts`:
   ```typescript
   'dashboard-actual-revenue': {
     requiresFinancialAccess: true, // Deve estar marcado
   }
   ```
3. Verificar `canViewCard()` retorna false:
   ```javascript
   console.log(canViewCard('dashboard-actual-revenue')); // deve ser false
   ```

---

### **Problema: Query retorna dados que não deveria**

1. Verificar se `shouldFilterToOwnData()` está sendo usado
2. Verificar se filtro está sendo aplicado ANTES do `.select()`:
   ```typescript
   // ❌ ERRADO
   await supabase.from('patients').select('*').then(applyFilter);
   
   // ✅ CORRETO
   let query = supabase.from('patients').select('*');
   query = await applyPatientsFilter(query, userId, shouldFilter);
   await query;
   ```
3. Verificar RLS policies no Supabase

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

Ao adicionar nova funcionalidade:

- [ ] Definir domínio em `src/types/permissions.ts`
- [ ] Adicionar rota em `src/lib/routePermissions.ts`
- [ ] Criar card config em `src/types/cardTypes.ts` (se aplicável)
- [ ] Implementar filtragem de query usando `queryFilters.ts`
- [ ] Validar acesso usando `checkPatientAccess.ts` (se aplicável)
- [ ] Testar com diferentes perfis:
  - [ ] Admin/Full
  - [ ] Subordinate com managesOwnPatients = true
  - [ ] Subordinate com managesOwnPatients = false
  - [ ] Subordinate com hasFinancialAccess = false
  - [ ] Accountant

---

## 🔒 SEGURANÇA

### **Princípios de Segurança Implementados:**

1. **Defense in Depth**: Múltiplas camadas de validação
2. **Least Privilege**: Usuários têm apenas acesso necessário
3. **Fail Secure**: Em caso de erro, negar acesso
4. **Server-Side Validation**: Nunca confiar apenas no client
5. **Audit Trail**: Logs de acesso administrativo

### **NUNCA FAZER:**

❌ Confiar apenas em localStorage para verificar permissões
❌ Filtrar dados DEPOIS de carregar no client
❌ Usar apenas CSS para esconder dados sensíveis
❌ Assumir que role garantido no login permanece válido (sempre revalidar)
❌ Expor IDs de outros usuários em URLs públicas

### **SEMPRE FAZER:**

✅ Validar permissões no servidor (RLS + Edge Functions)
✅ Filtrar queries ANTES de executar
✅ Revalidar acesso em ações críticas
✅ Logar acessos administrativos
✅ Usar tipos TypeScript para prevenir erros

---

## 📊 TABELAS DO BANCO DE DADOS

### `subordinate_autonomy_settings`

```sql
CREATE TABLE subordinate_autonomy_settings (
  id UUID PRIMARY KEY,
  subordinate_id UUID REFERENCES profiles(id),
  manager_id UUID REFERENCES profiles(id),
  manages_own_patients BOOLEAN DEFAULT false,
  has_financial_access BOOLEAN DEFAULT false,
  nfse_emission_mode TEXT DEFAULT 'own_company',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### `user_roles`

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TYPE app_role AS ENUM ('admin', 'therapist', 'accountant');
```

---

## 🚀 PRÓXIMOS PASSOS (SPRINT 6+)

1. **Interface de Gestão de Permissões**
   - Tela para Admin gerenciar autonomia de subordinados
   - Visualização clara de permissões atuais

2. **Auditoria de Acesso**
   - Logs detalhados de acessos a dados sensíveis
   - Relatórios de atividade por usuário

3. **Notificações de Mudança de Permissão**
   - Notificar subordinados quando permissões mudarem
   - Histórico de alterações de permissões

4. **Testes Automatizados**
   - Unit tests para hooks de permissão
   - Integration tests para fluxos completos
   - E2E tests com diferentes perfis

---

## 📚 REFERÊNCIAS

- [Documentação Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [React Context API](https://react.dev/learn/passing-data-deeply-with-context)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

---

**Última atualização**: Sprint 5 - Data Query Filtering
**Autor**: Sistema de Permissões Granulares Espaço Mindware
