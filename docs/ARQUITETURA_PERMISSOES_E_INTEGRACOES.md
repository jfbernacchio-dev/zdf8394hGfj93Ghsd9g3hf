# Arquitetura de Permissões e Integrações - Sistema Espaço Mindware

**Documento de Referência Técnica**  
**Última Atualização:** 2025 (pós-ciclo A+W+N)

---

## 1. Sistema de Permissões e Roles

### 1.1 Modelo de Roles Dinâmicos por Organização

O sistema utiliza um modelo hierárquico de permissões baseado em **níveis organizacionais** (organization_levels) e **posições** (organization_positions), substituindo o modelo antigo de roles fixos.

**Tabelas Principais:**
- `organization_levels` - Define níveis hierárquicos dentro de cada organização
- `organization_positions` - Posições específicas dentro de cada nível
- `user_positions` - Vincula usuários às posições
- `level_role_settings` - Configurações de permissão por nível e role
- `level_sharing_config` - Configuração de compartilhamento entre pares do mesmo nível
- `peer_sharing` - Compartilhamento individual entre usuários

### 1.2 Hooks Principais de Permissões

**`useEffectivePermissions`** (`src/hooks/useEffectivePermissions.ts`)
- Hook principal que resolve permissões efetivas do usuário atual
- Substitui hooks legados (`useSubordinatePermissions`, `useLevelPermissions`)
- Fonte de verdade: função `resolveEffectivePermissions(userId)`
- Retorna: `EffectivePermissions` com todos os flags de acesso

**`useDashboardPermissions`** (`src/hooks/useDashboardPermissions.ts`)
- Gerencia permissões específicas para visualização de dashboards
- Integra com sistema de compartilhamento entre pares
- Determina quais cards/seções são visíveis para cada usuário

**`useCardPermissions`** (`src/hooks/useCardPermissions.ts`)
- Verifica permissões para cards individuais
- Determina se dados devem ser filtrados para "own data only"
- Integra com domínios de permissão (clinical, financial, general, etc.)

### 1.3 Biblioteca de Resolução

**`resolveEffectivePermissions`** (`src/lib/resolveEffectivePermissions.ts`)
- Função central que calcula permissões efetivas baseadas em:
  - Global role (`admin`, `psychologist`, `assistant`, `accountant`)
  - Nível hierárquico (`level_number`)
  - Configurações específicas (`level_role_settings`)
  - Status de owner da organização
- **Nota:** Ainda utiliza `subordinate_autonomy_settings` para manter compatibilidade com hierarquia legada, mas permissões são calculadas pelo novo sistema

---

## 2. WhatsApp Integration (Track W)

### 2.1 Arquitetura em Camadas

**W1: Gate Visual (Olimpo Only)**
- Apenas usuários "Olimpo" (whitelist explícita) podem acessar `/whatsapp`
- Implementação: `isOlimpoUser({ userId })` em `src/lib/userUtils.ts`
- Whitelist atual:
  - João Felipe: `cc630372-360c-49e7-99e8-2bd83a3ab75d`
  - Larissa Schwarcz: `19ec4677-5531-4576-933c-38ed70ee0bda`

**W2: Hardening Backend**
- Coluna `whatsapp_enabled` em `organizations` (default: false)
- Edge functions validam `whatsapp_enabled` antes de processar requests
- Apenas organizações autorizadas podem enviar/receber mensagens

**W3: Permissões Organizacionais**
- Sistema de permissões hierárquicas:
  - `canViewSubordinateWhatsapp` - Superior vê conversas de subordinados
  - `canManageSubordinateWhatsapp` - Superior pode responder por subordinados
  - `secretaryCanAccessWhatsapp` - Secretária acessa WhatsApp da organização
- Peer sharing: usuários do mesmo nível podem compartilhar domínio "whatsapp"
- Implementação: `src/lib/whatsappPermissions.ts`

### 2.2 Olimpo Bypass

Usuários Olimpo (whitelist) possuem bypass total de permissões W3:
- Veem todas as conversas da organização
- Podem gerenciar (responder) qualquer conversa
- Query direta em `whatsapp_conversations` filtrada apenas por `organization_id`

**Arquivos Principais:**
- `src/pages/WhatsAppChat.tsx` - Interface principal do chat
- `src/lib/whatsappPermissions.ts` - Helper de permissões
- `src/lib/userUtils.ts` - Identificação de usuários Olimpo
- Edge functions: `send-whatsapp`, `send-whatsapp-reply`, `whatsapp-webhook`

### 2.3 Tabelas do WhatsApp

- `whatsapp_conversations` - Conversas vinculadas a `user_id` e `organization_id`
- `whatsapp_messages` - Mensagens de cada conversa
- RLS: Apenas usuários com permissões adequadas podem acessar conversas

**Referências:**
- `docs/DIAGNOSTICO_WHATSAPP_COMPLETO.md` - Diagnóstico técnico completo
- `docs/HOTFIX_W3.3_RELATORIO.md` - Correção da query de conversas

---

## 3. NFSe Integration (Track N)

### 3.1 Migração para Configuração Organizacional

**Modelo Novo (Preferido):**
- Tabela: `organization_nfse_config`
- Configuração centralizada por organização
- Owner da organização configura certificado e dados fiscais
- Subordinados utilizam empresa da organização automaticamente

**Modelo Legado (Fallback):**
- Tabelas: `nfse_config`, `nfse_certificates`
- Configuração individual por usuário (marcada com `is_legacy = true`)
- Mantido para compatibilidade durante migração

### 3.2 Comportamento de Subordinados

**Subordinado com `uses_org_company_for_nfse = true`:**
- Utiliza configuração da `organization_nfse_config` (empresa do manager/owner)
- Emite notas com CNPJ da organização
- Não se torna owner da organização

**Subordinado com empresa própria (`uses_org_company_for_nfse = false`):**
- Mantém configuração individual em `nfse_config` (legado)
- Emite notas com seu próprio CNPJ
- Configuração marcada como `is_legacy = true`

### 3.3 Edge Functions

Todas as edge functions de NFSe utilizam o helper unificado:
- `supabase/functions/_shared/organizationNFSeConfigHelper.ts`
- Lógica de fallback: tenta `organization_nfse_config` → fallback para config legada
- Functions: `issue-nfse`, `cancel-nfse`, `download-nfse-pdf`, `send-nfse-email`

### 3.4 Páginas de Frontend

**Comportamento por Tipo de Usuário:**
- **Owner/Admin:** Configura `organization_nfse_config`
- **Subordinado (manager_company):** Usa config organizacional, sem acesso à edição
- **Subordinado (own_company):** Edita apenas sua config legada
- **Contabilista:** Visualiza histórico e gerencia emissões

**Arquivos Principais:**
- `src/pages/OrganizationNFSeConfig.tsx` - Config organizacional
- `src/pages/NFSeConfig.tsx` - Config individual (legado)
- `src/pages/NFSeHistory.tsx` - Histórico de notas
- `src/components/IssueNFSeDialog.tsx` - Emissão de notas

**Referências:**
- `docs/FASE_N1_RELATORIO_COMPLETO.md` - Auditoria inicial
- `docs/FASE_N2_RELATORIO_COMPLETO.md` - Correções de RLS
- `docs/FASE_N3_RELATORIO_COMPLETO.md` - Migração para config organizacional
- `docs/FASE_N4_RELATORIO_COMPLETO.md` - Consolidação final

---

## 4. Infraestrutura de Organizações

### 4.1 Tabelas Principais

- `organizations` - Organizações do sistema
  - `whatsapp_enabled` - Habilita WhatsApp para a organização
  - `cnpj`, `legal_name` - Dados fiscais
- `organization_owners` - Define owners de cada organização
  - `is_primary` - Flag para owner principal
- `organization_nfse_config` - Configuração fiscal por organização

### 4.2 Funções SQL de Resolução

- `resolve_organization_for_user(user_id)` - Resolve `organization_id` de um usuário
- `current_user_organization()` - Retorna organização do usuário autenticado
- `get_organization_hierarchy_info(user_id)` - Retorna dados hierárquicos completos
- `get_all_subordinates(user_id)` - Lista subordinados recursivamente
- `get_all_superiors(user_id)` - Lista superiores recursivamente

### 4.3 Auto-Set de organization_id

Triggers automáticos setam `organization_id` em tabelas principais:
- `auto_set_organization_from_user` - Para tabelas com `user_id`
- `auto_set_organization_from_patient` - Para tabelas com `patient_id`
- `auto_set_organization_from_complaint` - Para tabelas clínicas
- `auto_set_organization_from_nfse` - Para alocações de pagamento
- Impede mudança de `organization_id` após criação (segurança)

---

## 5. Sistema de Clinical Templates (Infraestrutura)

### 5.1 Tabelas Criadas

- `clinical_templates` - Templates de evolução clínica
  - Vinculados a `organization_id` e `professional_role_id`
  - Campos: `template_name`, `template_content`, `is_default`
- RLS: Apenas usuários da organização podem acessar templates

### 5.2 Estado Atual

**✅ Infraestrutura Criada:**
- Tabela, types, helper básico (`src/lib/clinicalTemplates.ts`)
- RLS configurado

**⏳ Integração Pendente (Fase Futura):**
- Uso em `ClinicalEvolution.tsx`
- Uso em formulários de Sessão
- Uso em formulários de Queixa
- Interface de gestão de templates

---

## 6. Segurança e Row Level Security (RLS)

### 6.1 Princípios de Segurança

- **Defense in Depth:** Múltiplas camadas (RLS, hooks, edge functions)
- **Least Privilege:** Usuários veem apenas o necessário
- **Fail-Safe Defaults:** Sem permissão explícita = sem acesso
- **Separation of Duties:** Roles diferentes para funções críticas

### 6.2 Checagem de Segurança

Comando disponível para validação:
```bash
./security-check.sh
```

Verifica:
- RLS habilitado em todas as tabelas
- Policies configuradas corretamente
- Dados sensíveis protegidos

---

## 7. Referências e Documentação

### 7.1 Documentos de Fase

**Permissões e Organização:**
- `PERMISSIONS_SYSTEM.md` - Sistema completo de permissões
- `ARQUITETURA_SISTEMA_REFERENCE.md` - Visão geral da arquitetura

**WhatsApp (Track W):**
- `docs/DIAGNOSTICO_WHATSAPP_COMPLETO.md`
- `docs/HOTFIX_W3.2_RELATORIO.md`
- `docs/HOTFIX_W3.3_RELATORIO.md`

**NFSe (Track N):**
- `docs/FASE_N1_RELATORIO_COMPLETO.md`
- `docs/FASE_N2_RELATORIO_COMPLETO.md`
- `docs/FASE_N3_RELATORIO_COMPLETO.md`
- `docs/FASE_N4_RELATORIO_COMPLETO.md`

**Migração e Níveis:**
- `docs/FASE_123_RELATORIO_COMPLETO.md` - Migração de subordinados para níveis
- `src/pages/MigrationWizard.tsx` - Ferramenta de migração

### 7.2 Helpers e Utilities

**Permissões:**
- `src/lib/resolveEffectivePermissions.ts` - Resolução de permissões
- `src/lib/checkPermissions.ts` - Validação de rotas
- `src/lib/routePermissions.ts` - Configuração de rotas protegidas

**WhatsApp:**
- `src/lib/whatsappPermissions.ts` - Permissões hierárquicas
- `src/lib/userUtils.ts` - Identificação de usuários especiais

**NFSe:**
- `supabase/functions/_shared/organizationNFSeConfigHelper.ts` - Helper unificado
- `src/lib/patientFinancialUtils.ts` - Cálculos financeiros

**Organizações:**
- `src/lib/organizations.ts` - Helpers de organização
- `src/lib/organizationFilters.ts` - Filtros por organização

---

## 8. Convenções e Boas Práticas

### 8.1 Nomenclatura

- Hooks: `use[Feature][Aspect]` (ex: `useEffectivePermissions`)
- Helpers: `[action][Entity]` (ex: `resolveEffectivePermissions`)
- Componentes: PascalCase (ex: `WhatsAppChat`)

### 8.2 Estrutura de Código

- Hooks de permissão: `src/hooks/use*Permissions.ts`
- Helpers de negócio: `src/lib/[domain]*.ts`
- Edge functions: `supabase/functions/[action]-[entity]/`
- Documentação: `docs/FASE_[N]_*.md` ou `docs/[TOPIC]_*.md`

### 8.3 Fluxo de Desenvolvimento

1. **Análise:** Entender requisito e arquitetura atual
2. **Planejamento:** Definir mudanças necessárias (frontend, backend, DB)
3. **Implementação:** Seguir princípios de segurança e clean code
4. **Testes:** Validar com múltiplos tipos de usuário
5. **Documentação:** Atualizar este documento e criar relatórios de fase

---

**Fim do Documento**
