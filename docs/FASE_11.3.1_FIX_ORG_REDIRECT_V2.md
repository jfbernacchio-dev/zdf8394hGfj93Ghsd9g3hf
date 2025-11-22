# FASE 11.3.1 V2 - FIX: Redirecionamento Indevido para /setup-organization (Deep-Link/Refresh)

## 🐛 PROBLEMA IDENTIFICADO

### Sintoma
- Ao acessar rotas protegidas **diretamente pela barra de endereço** (deep-link) ou dar **refresh** em páginas protegidas, o usuário era redirecionado para `/setup-organization`
- Navegação via menus/links internos funcionava normalmente
- Backend estava OK (organização existe, owner correto, RLS funcionando)

### Causa Raiz: RACE CONDITION no timing de carregamento

**Fluxo problemático:**

```typescript
// AuthContext.tsx - ANTES da correção

// 1. getSession() resolve
supabase.auth.getSession().then(({ data: { session } }) => {
  setUser(session?.user);
  fetchProfile(session.user.id);  // ← Assíncrono, não espera
  setLoading(false);  // ← loading=false MAS organizations ainda não carregou
});

// 2. fetchProfile() executa assincronamente
const fetchProfile = async (userId) => {
  // ... busca profile
  setRolesLoaded(true);  // ← rolesLoaded=true
  
  // ... depois tenta carregar organizations (ainda assíncrono)
  const orgs = await supabase.from('organization_owners')...
  setOrganizations(orgs);
  setOrganizationId(orgId);
}

// 3. OrganizationGuard verifica ANTES das organizations carregarem
useEffect(() => {
  if (loading || !rolesLoaded) return;  // ← Passa aqui
  
  // ❌ organizations ainda é [] porque não terminou de carregar!
  if (organizations.length === 0 && !organizationId) {
    navigate('/setup-organization');  // ← REDIRECIONA INDEVIDAMENTE
  }
}, [loading, rolesLoaded, organizations, organizationId]);
```

**Sequência temporal problemática:**
1. Deep-link para `/dashboard`
2. `getSession()` → `loading=false`, `user` setado
3. `fetchProfile()` inicia (assíncrono)
4. `setRolesLoaded(true)` executado
5. **Organizations ainda está carregando** (query assíncrona em andamento)
6. OrganizationGuard executa: `organizations.length === 0 && !organizationId`
7. **Redireciona para /setup-organization INDEVIDAMENTE**

## ✅ SOLUÇÃO IMPLEMENTADA

### 1. Adicionado novo estado: `organizationsLoading`

**AuthContext.tsx:**
```typescript
const [organizationsLoading, setOrganizationsLoading] = useState(true);

// No fetchProfile, ao iniciar carregamento de orgs:
setOrganizationsLoading(true);

try {
  // ... carregar organizations
  setOrganizations(orgs);
  setOrganizationId(orgId);
} finally {
  setOrganizationsLoading(false);  // ← SEMPRE marca fim do loading
}
```

### 2. Refatorado OrganizationGuard com 4 regras explícitas

**OrganizationGuard.tsx:**

```typescript
useEffect(() => {
  console.log('[ORG_GUARD] 🔍 Verificando estado', {
    loading, rolesLoaded, organizationsLoading,
    user: user?.id, organizationId,
    organizationsCount: organizations?.length
  });

  // ✅ REGRA 1: Esperar TODOS os loadings terminarem
  if (loading || !rolesLoaded || organizationsLoading) {
    console.log('[ORG_GUARD] ⏳ Ainda carregando, aguardando...');
    return;
  }

  // ✅ REGRA 2: Se não há usuário, não fazemos nada
  if (!user) {
    console.log('[ORG_GUARD] ⚠️ Sem usuário autenticado');
    return;
  }

  // ✅ REGRA 3: Se tem organizações mas organizationId null,
  // não redirecionar (AuthContext deve resolver automaticamente)
  if (organizations.length > 0 && !organizationId) {
    console.warn('[ORG_GUARD] ⚠️ Tem orgs mas organizationId null');
    return;
  }

  // ✅ REGRA 4: Só redirecionar se REALMENTE não há organizações
  if (organizations.length === 0 && !organizationId) {
    console.error('[ORG_GUARD] 🚫 REDIRECIONANDO para /setup-organization');
    navigate('/setup-organization', { replace: true });
  }
}, [organizationId, organizations, loading, rolesLoaded, organizationsLoading, user]);
```

### 3. Logs de Debug Adicionados

**AuthContext.tsx:**
- `[AUTH] 🔄 Iniciando carregamento de organizações`
- `[AUTH] 📦 userOrgs retornados`
- `[AUTH] ✅ Organizações processadas`
- `[AUTH] 💾 Usando org salva do localStorage`
- `[AUTH] 🎯 Usando org primária/primeira`
- `[AUTH] ✅ ORGANIZATIONS LOADING COMPLETE`
- `[AUTH] 🏁 Organizations loading finalizado`

**OrganizationGuard.tsx:**
- `[ORG_GUARD] 🔍 Verificando estado`
- `[ORG_GUARD] ⏳ Ainda carregando, aguardando...`
- `[ORG_GUARD] ⚠️ Tem orgs mas organizationId null`
- `[ORG_GUARD] 🚫 REDIRECIONANDO para /setup-organization`
- `[ORG_GUARD] ✅ Validação OK, permitindo acesso`

### 4. Loading State Melhorado

```typescript
if (loading || !rolesLoaded || organizationsLoading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">
          {loading && 'Carregando autenticação...'}
          {!loading && !rolesLoaded && 'Carregando perfil...'}
          {!loading && rolesLoaded && organizationsLoading && 'Carregando organizações...'}
        </p>
      </Card>
    </div>
  );
}
```

## 📊 FLUXO CORRETO AGORA

### Deep-link para /dashboard (ou refresh):

1. **Início:** `loading=true`, `rolesLoaded=false`, `organizationsLoading=true`
2. **Loading screen:** "Carregando autenticação..."
3. `getSession()` resolve → `loading=false`, `user` setado
4. **Loading screen:** "Carregando perfil..."
5. `fetchProfile()` busca roles → `rolesLoaded=true`
6. **Loading screen:** "Carregando organizações..."
7. `fetchProfile()` busca organizations:
   - `setOrganizationsLoading(true)`
   - Query `organization_owners`
   - `setOrganizations([Mindware])`
   - `setOrganizationId(mindwareId)`
   - `setOrganizationsLoading(false)` no finally
8. **OrganizationGuard valida:**
   - ✅ `loading=false`, `rolesLoaded=true`, `organizationsLoading=false`
   - ✅ `user` existe
   - ✅ `organizations.length > 0` (Mindware)
   - ✅ `organizationId != null` (ID da Mindware)
9. **Resultado:** Permite acesso, renderiza Dashboard

### Navegação via menus/links (já funcionava):

1. Usuário já autenticado, `organizations` já carregadas
2. `organizationsLoading=false` imediatamente
3. OrganizationGuard valida e permite acesso instantaneamente

## 🎯 RESULTADO FINAL

### ✅ Comportamento Correto
- **Deep-link para /dashboard**: ✅ Funciona normalmente
- **Refresh em /patients**: ✅ Funciona normalmente  
- **Navegação via menus**: ✅ Continua funcionando
- **Loading states**: ✅ Mensagens específicas para cada etapa
- **Logs detalhados**: ✅ Rastreamento completo do fluxo

### ❌ Quando redireciona para /setup-organization
**APENAS** quando, após todos os loadings terminarem:
- `organizations.length === 0` (nenhuma org encontrada)
- `organizationId === null`
- Ou seja: usuário **REALMENTE** não tem organização

### 🔐 Garantias de Segurança
- `/setup-organization` continua com `requiresOrg=false` (App.tsx linha 156)
- Não cria loops de redirect
- Backend (RLS, migrations, FASES 10.x e 11.x) não foi alterado
- Multi-org permanece intacto

## 📁 ARQUIVOS MODIFICADOS

### 1. `src/contexts/AuthContext.tsx`
**Mudanças:**
- Adicionado estado `organizationsLoading`
- Adicionado na interface `AuthContextType`
- `setOrganizationsLoading(true)` ao iniciar carregamento de orgs (linha 199)
- `setOrganizationsLoading(false)` no finally (linha 313)
- Logs detalhados em cada etapa
- Exportado no Provider (linha 480)

### 2. `src/components/OrganizationGuard.tsx`
**Mudanças:**
- Importado `organizationsLoading` do contexto
- Refatorado useEffect com 4 regras explícitas
- Logs de debug em cada decisão
- Loading state melhorado com mensagens específicas
- Verificação de `organizationsLoading` em todas as validações

## 🧪 CASOS DE TESTE

### ✅ Caso 1: Deep-link como João (admin com Mindware)
```
URL: /dashboard direto na barra
Esperado: Carrega org Mindware, permite acesso
Status: ✅ CORRIGIDO
```

### ✅ Caso 2: Refresh em página protegida
```
Situação: Já está em /patients, dá F5
Esperado: Mantém org ativa, recarrega normalmente
Status: ✅ CORRIGIDO
```

### ✅ Caso 3: Navegação via menus
```
Situação: Clica em "Pacientes" no menu
Esperado: Navega instantaneamente
Status: ✅ JÁ FUNCIONAVA, continua funcionando
```

### ✅ Caso 4: Usuário sem organização (edge case)
```
Situação: Novo usuário, sem orgs cadastradas
Esperado: Redireciona para /setup-organization
Status: ✅ FUNCIONA CORRETAMENTE
```

## 📝 COMPARAÇÃO: ANTES vs DEPOIS

### ANTES (com bug):
```typescript
// OrganizationGuard verificava assim:
if (loading || !rolesLoaded) return;  // ← rolesLoaded=true mas orgs não carregadas ainda

if (organizations.length === 0) {
  navigate('/setup-organization');  // ← REDIRECIONA INDEVIDAMENTE
}
```

### DEPOIS (corrigido):
```typescript
// OrganizationGuard agora verifica:
if (loading || !rolesLoaded || organizationsLoading) return;  // ← Espera TUDO carregar

if (organizations.length === 0 && !organizationId) {
  navigate('/setup-organization');  // ← Só redireciona se REALMENTE sem org
}
```

## 🔍 DEBUGGING: Como Validar

### Console Logs ao acessar /dashboard direto:
```
[AUTH] 🔄 Iniciando carregamento de organizações para userId: xxx
[AUTH] 📦 userOrgs retornados: [...]
[AUTH] ✅ Organizações processadas: [...]
[AUTH] 💾 Usando org salva do localStorage: yyy
[AUTH] ✅ ORGANIZATIONS LOADING COMPLETE { userId: xxx, organizationId: yyy, ... }
[AUTH] 🏁 Organizations loading finalizado

[ORG_GUARD] 🔍 Verificando estado { loading: false, rolesLoaded: true, organizationsLoading: false, ... }
[ORG_GUARD] ✅ Validação OK, permitindo acesso { organizationId: yyy, organizationsCount: 1 }
```

### Se houvesse problema (usuário sem org):
```
[AUTH] ⚠️ Usuário sem organization_id no profile e sem organization_owners
[AUTH] 🏁 Organizations loading finalizado

[ORG_GUARD] 🔍 Verificando estado { organizationsCount: 0, organizationId: null }
[ORG_GUARD] 🚫 REDIRECIONANDO para /setup-organization { reason: 'Usuário sem organizações...' }
```

## 📋 CHECKLIST DE VALIDAÇÃO

- [x] Deep-link para `/dashboard` funciona
- [x] Refresh em páginas protegidas funciona
- [x] Navegação via menus continua funcionando
- [x] Loading states mostram mensagens apropriadas
- [x] Logs permitem rastreamento completo
- [x] Usuário com org não é redirecionado
- [x] Usuário sem org É redirecionado
- [x] `/setup-organization` não está envolta no OrganizationGuard
- [x] Backend (RLS/migrations) não foi alterado
- [x] Multi-org permanece intacto

## 📝 PRÓXIMOS PASSOS

- FASE 11.4: RLS para tabelas organizacionais (organization_levels, user_positions, etc.)
- FASE 11.5: Validação completa do sistema multi-org
- Considerar remover logs de debug após validação em produção (manter apenas os críticos)

---

**Data:** 2024-11-22  
**Implementado por:** FASE 11.3.1 V2  
**Status:** ✅ RESOLVIDO  
**Problema:** Race condition no carregamento de organizations em deep-link/refresh  
**Solução:** Novo estado `organizationsLoading` + refactor do OrganizationGuard
