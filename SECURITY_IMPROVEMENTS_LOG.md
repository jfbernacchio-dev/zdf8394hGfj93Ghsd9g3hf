# Log de Melhorias de Segurança - NFSe & Gestão de Pacientes

## Data: 2025-11-05

### 🔒 Correções Críticas Implementadas

#### 1. **Proteção de Senhas de Certificados NFSe** ✅
**Problema**: Senhas de certificados poderiam ser acessadas sem auditoria adequada.

**Solução Implementada**:
- Criada tabela `credential_access_log` para rastrear todos os acessos a credenciais sensíveis
- Todas as descriptografias agora são logadas com:
  - ID do usuário
  - Tipo de credencial (certificado, token API)
  - Ação realizada
  - IP e User-Agent
  - Timestamp
- Retenção de 12 meses nos logs de acesso
- Edge functions atualizadas para registrar cada acesso

**Tabelas Afetadas**: `nfse_certificates`, `credential_access_log`

---

#### 2. **Tokens da API FocusNFE com Auditoria** ✅
**Problema**: Tokens da API FocusNFE descriptografados sem registro de acesso.

**Solução Implementada**:
- Mesma solução de auditoria da correção #1
- Todo acesso aos tokens (homologação e produção) é registrado
- Edge functions atualizadas:
  - `decrypt-credentials`
  - `issue-nfse`
  - `cancel-nfse`
  - `check-nfse-status`
- Frontend atualizado em `NFSeConfig.tsx` para incluir metadata de auditoria

**Tabelas Afetadas**: `nfse_config`, `credential_access_log`

---

#### 3. **Registros de Consentimento LGPD Imutáveis** ✅
**Problema**: Registros de consentimento LGPD poderiam ser modificados ou deletados.

**Solução Implementada**:
- Adicionadas políticas RLS que bloqueiam UPDATE e DELETE
- Políticas criadas:
  - `"Consent submissions cannot be modified"`
  - `"Consent submissions cannot be deleted"`
- Consentimentos agora são permanentes e inalteráveis após criação
- Apenas criação (INSERT) é permitida

**Tabelas Afetadas**: `consent_submissions`

---

#### 4. **Logs de Auditoria Protegidos** ✅
**Problema**: Logs de auditoria poderiam ser deletados antes do período de retenção.

**Solução Implementada**:
- Política RLS atualizada para verificar `retention_until` antes de permitir deleção
- Apenas logs com retenção expirada (`retention_until < now()`) podem ser deletados
- Administradores não podem mais deletar logs arbitrariamente
- Política: `"Audit logs can only be deleted after retention period"`

**Tabelas Afetadas**: `admin_access_log`

---

#### 5. **Visibilidade de Incidentes de Segurança para Terapeutas Afetados** ✅
**Problema**: Terapeutas não podiam ver incidentes de segurança que os afetavam.

**Solução Implementada**:
- Adicionada coluna `metadata` (jsonb) na tabela `security_incidents`
- Nova política RLS: `"Therapists can view incidents affecting them"`
- Terapeutas agora podem ver incidentes onde `metadata.affected_user_ids` contém seu ID
- Administradores mantêm visibilidade total

**Tabelas Afetadas**: `security_incidents`

---

#### 6. **Distinção entre Arquivos Clínicos e Administrativos** ✅
**Problema**: Arquivos de pacientes não tinham distinção entre clínicos e administrativos.

**Solução Implementada**:
- Adicionada coluna `is_clinical` (boolean) na tabela `patient_files`
- Checkbox no formulário de upload para marcar arquivos clínicos
- Badge visual "Clínico" nos arquivos marcados
- Índice criado para performance: `idx_patient_files_category`
- Preparação para controles de acesso granulares futuros
- Comentários no banco de dados explicando a distinção

**Componentes Atualizados**: `PatientFiles.tsx`
**Tabelas Afetadas**: `patient_files`

---

### 📊 Infraestrutura de Auditoria

#### Nova Tabela: `credential_access_log`
```sql
- id (uuid, PK)
- user_id (uuid, FK -> auth.users)
- credential_type (text) -- 'nfse_certificate', 'focusnfe_token'
- credential_id (uuid) -- ID do registro de credencial
- action (text) -- 'decrypt', 'view', 'use'
- ip_address (text)
- user_agent (text)
- created_at (timestamptz)
- retention_until (timestamptz) -- 12 meses
```

**Políticas RLS**:
- Admins podem visualizar todos os logs
- Usuários podem inserir seus próprios logs (via edge functions)

---

### 🔐 Funções Atualizadas

#### Edge Functions:
1. **decrypt-credentials** - Agora registra todos os acessos
2. **issue-nfse** - Passa metadata de auditoria
3. **cancel-nfse** - Passa metadata de auditoria
4. **check-nfse-status** - Passa metadata de auditoria

#### Frontend:
1. **NFSeConfig.tsx** - Inclui `credentialType` e `credentialId` nas chamadas de descriptografia
2. **PatientFiles.tsx** - Suporte completo para arquivos clínicos vs administrativos

---

### 📈 Melhorias de Segurança Adicionais

1. **Comentários de Segurança**:
   - Tabelas sensíveis agora têm comentários alertando sobre requisitos de auditoria
   - Colunas de credenciais marcadas como `ENCRYPTED` e `SENSITIVE`

2. **Índices de Performance**:
   - `idx_credential_access_log_user_created` (user_id, created_at DESC)
   - `idx_credential_access_log_type` (credential_type, created_at DESC)
   - `idx_patient_files_category` (category, is_clinical)

3. **Triggers**:
   - `set_credential_log_retention` aplica retenção de 12 meses automaticamente

---

### ✅ Status de Conformidade

#### LGPD:
- ✅ Consentimentos imutáveis
- ✅ Logs de acesso a dados sensíveis (12 meses)
- ✅ Distinção entre dados clínicos e administrativos
- ✅ Auditoria completa de acesso a credenciais

#### Segurança:
- ✅ Proteção contra manipulação de registros críticos
- ✅ Retenção forçada de logs de auditoria
- ✅ Visibilidade de incidentes para usuários afetados
- ✅ Rastreamento completo de acesso a credenciais

---

### 📝 Próximos Passos Recomendados

1. **Monitoramento**: Configurar alertas para acessos anormais em `credential_access_log`
2. **Revisão Regular**: Analisar logs de acesso a credenciais mensalmente
3. **Treinamento**: Educar equipe sobre a importância de marcar arquivos clínicos corretamente
4. **MFA**: Considerar implementar autenticação multifator para admins
5. **Backup**: Garantir que `credential_access_log` está incluído nos backups

---

### 🔍 Como Verificar as Correções

```sql
-- Verificar logs de acesso a credenciais
SELECT * FROM credential_access_log ORDER BY created_at DESC LIMIT 10;

-- Verificar políticas de consentimento
SELECT * FROM pg_policies WHERE tablename = 'consent_submissions';

-- Verificar política de retenção de audit logs
SELECT * FROM pg_policies WHERE tablename = 'admin_access_log' AND policyname LIKE '%retention%';

-- Verificar arquivos clínicos
SELECT category, is_clinical, COUNT(*) 
FROM patient_files 
GROUP BY category, is_clinical;
```

---

**Implementado por**: Sistema Lovable AI  
**Revisado**: Aguardando revisão do administrador  
**Ambiente**: Produção (Lovable Cloud)
