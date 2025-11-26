# 🤖 Guia de Invocação ChatGPT - Sistema Espaço Mindware

## 📋 Sobre Este Documento

Este documento contém uma série de prompts sequenciais para invocar o ChatGPT e colocá-lo a par do sistema Espaço Mindware. Os prompts são projetados para serem copiados e colados em sequência, permitindo que o ChatGPT absorva a arquitetura completa do sistema antes de iniciar qualquer trabalho.

**Fluxo de Trabalho:**
1. Cole os prompts na sequência indicada
2. Após a invocação completa, defina o escopo da atividade específica
3. O Lovable fornecerá lista de arquivos relevantes para aquela atividade
4. Trabalhe de forma iterativa com feedback entre ChatGPT → Lovable → Desenvolvedor

**Time de Trabalho:**
- **Desenvolvedor (você):** define requisitos e valida resultados
- **Lovable (AI 1):** arquiteto do sistema, conhece todos os arquivos e contexto real
- **ChatGPT (AI 2):** auxilia em análise, planejamento e propostas de implementação

---

## 🚀 PROMPT 1 - Arquitetura Fundacional & Backend

```
Olá! Vou te colocar a par de um sistema completo de gestão clínica multi-tenant chamado Espaço Mindware. Vou fazer isso em etapas para você absorver bem. Começamos pela arquitetura fundacional e backend.

### ARQUITETURA GERAL

**Stack Tecnológica:**
- Frontend: React 18 + TypeScript + Vite
- UI: Tailwind CSS + Radix UI + shadcn/ui
- Backend: Supabase (PostgreSQL + Edge Functions)
- State: React Query (@tanstack/react-query)
- Routing: React Router v6

**Modelo Multi-Tenant:**
- Sistema multi-organização REAL
- Cada `organization` isola completamente seus dados
- Isolamento via `organization_id` em TODAS as tabelas sensíveis
- Row Level Security (RLS) forte em todas as tabelas

### BANCO DE DADOS (Supabase/PostgreSQL)

**Tabelas Core de Organização:**
- `organizations`: cadastro de organizações (CNPJ, legal_name, whatsapp_enabled)
- `organization_owners`: vincula users a orgs (is_primary flag para owner principal)
- `organization_levels`: níveis hierárquicos dentro da org
- `organization_positions`: posições/cargos vinculados a levels
- `user_positions`: vincula users a positions (permite múltiplas positions)

**Tabelas Core de Usuários:**
- `auth.users`: gerenciado pelo Supabase Auth (não acessível diretamente)
- `profiles`: perfil estendido dos users (nome, contato, professional_role_id, organization_id)
- `professional_roles`: papéis profissionais (psicólogo, psiquiatra, nutricionista, etc.)
- `clinical_approaches`: abordagens clínicas (TCC, Junguiana, etc.) vinculadas a roles

**Tabelas Core de Pacientes:**
- `patients`: cadastro de pacientes (name, CPF, birth_date, session_value, frequency, etc.)
  - `user_id`: terapeuta responsável (FK para auth.users)
  - `organization_id`: org do paciente
  - `status`: active/inactive
- `sessions`: sessões realizadas (date, status, value, paid, nfse_issued_id)
- `clinical_complaints`: queixas clínicas (CID-10, gravidade, curso, risco)
  - `is_active`: boolean - só UMA queixa ativa por paciente
- `complaint_medications`, `complaint_symptoms`, `complaint_specifiers`: relacionamentos
- `session_evaluations`: avaliações psíquicas completas (JSONBs com funções mentais)
- `patient_files`: arquivos do paciente (categoria, is_clinical flag)

**Tabelas de Permissões (Sistema Novo - Pós FASE 11):**
- `level_role_settings`: configurações de role por level (role_type, financial_access, flags clínicos)
- `level_permission_sets`: permissões granulares por domain e level
- `level_sharing_config`: domínios compartilháveis entre levels
- `peer_sharing`: compartilhamento peer-to-peer entre usuários (shared_domains)

**Tabelas Financeiras:**
- `nfse_issued`: notas fiscais emitidas (status, focusnfe_ref, pdf_url, xml_url)
- `nfse_payments`: pagamentos registrados
- `payment_allocations`: vínculo entre payments e nfse
- `organization_nfse_config`: config NFSe por organização
- `nfse_certificates`: certificados digitais

**Tabelas de Layout (Persistência de UI):**
- `patient_overview_layouts`: layout de cards da aba Visão Geral do paciente
  - `user_id` + `patient_id` = UNIQUE
  - `layout_json`: JSONB com grid completo
  - `organization_id`: para isolamento

### ROW LEVEL SECURITY (RLS)

**Função Central:**
- `current_user_organization()`: retorna organization_id do user autenticado
- Usada em TODAS as policies para isolamento multi-tenant

**Helper Functions:**
- `get_level_organization_id(level_id)`: resolve org_id a partir de um level
- `has_role(user_id, role)`: verifica role do usuário

**Padrão de Policies (exemplo: `patients`):**
1. `patients_admin_all`: admins veem tudo
2. `patients_org_select`: users veem apenas da própria org
3. `patients_org_insert`: users inserem apenas na própria org
4. `patients_org_update`: users atualizam apenas da própria org (e próprios pacientes)
5. `patients_org_delete`: users deletam apenas da própria org (e próprios pacientes)

**Triggers Automáticos:**
- Todas as tabelas com `organization_id` têm trigger que auto-preenche com `current_user_organization()` no INSERT
- Garante que NUNCA um registro fique sem org_id

### EDGE FUNCTIONS (Backend Lógico)

Localizadas em `supabase/functions/`:
- `issue-nfse`: emissão de NFS-e
- `cancel-nfse`: cancelamento de NFS-e
- `send-whatsapp`, `send-whatsapp-reply`: integração WhatsApp
- `whatsapp-webhook`: recebe webhooks do WhatsApp
- `export-patient-data`: exportação LGPD
- `send-consent-form`, `submit-consent-form`: gestão de consentimento
- `auto-mark-sessions`: marca sessões como atendidas automaticamente
- `check-consent-expiry`, `send-compliance-reminders`: conformidade LGPD

**Helpers Compartilhados:**
- `supabase/functions/_shared/organizationNFSeConfigHelper.ts`: busca config NFSe (org ou legacy)
- `supabase/functions/_shared/rateLimit.ts`: rate limiting
- `supabase/functions/_shared/sessionUtils.ts`: utilitários de sessão

Entendeu essa parte da arquitetura? Confirme e vou para o próximo prompt sobre o sistema de permissões.
```

---

## 🔐 PROMPT 2 - Sistema de Permissões & Domains

```
Ótimo! Agora vamos ao sistema de permissões, que é CRUCIAL para entender qualquer funcionalidade do sistema.

### DOMAINS LÓGICOS DO SISTEMA

Existem apenas **3 domains oficiais** para controle de acesso:

1. **`clinical`**: Dados clínicos sensíveis
   - Queixas, diagnósticos, medicações, sintomas
   - Avaliações de sessão (exame mental)
   - Evolução do paciente (gráficos de funções psíquicas)
   - Arquivos marcados como `is_clinical = true`

2. **`financial`**: Dados financeiros
   - Valores de sessão, pagamentos, pendências
   - NFSe (emissão, cancelamento, status)
   - Fechamentos, relatórios financeiros
   - Faturamento mensal

3. **`administrative`**: Dados administrativos gerais
   - Timeline de sessões, frequência, taxa de comparecimento
   - Contato do paciente (telefone, email)
   - Dados pessoais (CPF, idade, responsável)
   - Consentimento LGPD
   - Dados não-sensíveis do paciente

**IMPORTANTE:** Não existe domain "sessions" ou "contact" isolado. Sessões e contato são `administrative`.

### TIPOS DE PERMISSÃO

**Arquivo:** `src/types/permissions.ts`

```typescript
type PermissionDomain = 'financial' | 'administrative' | 'clinical' | 'media' | 'marketing' | 'general' | 'charts' | 'team'
type AccessLevel = 'none' | 'read' | 'write' | 'full'

interface DomainPermissions {
  financial: AccessLevel
  administrative: AccessLevel
  clinical: AccessLevel
  media: AccessLevel
  general: AccessLevel
  charts: AccessLevel
  team: AccessLevel
}
```

### RESOLUÇÃO DE PERMISSÕES EFETIVAS

**Arquivo Central:** `src/lib/resolveEffectivePermissions.ts`

Esta função é a **fonte única da verdade** para permissões. Ela:
1. Recebe `userId`
2. Consulta múltiplas fontes:
   - `profiles` (role, org)
   - `organization_owners` (is_primary)
   - `level_role_settings` (configurações do level)
   - `peer_sharing` (compartilhamentos horizontais)
   - `level_sharing_config` (compartilhamentos verticais)
3. Retorna objeto consolidado:

```typescript
{
  // Flags globais
  isOrganizationOwner: boolean
  canAccessClinical: boolean
  financialAccess: 'none' | 'read' | 'full'
  canAccessMarketing: boolean
  canAccessWhatsapp: boolean
  canViewTeamFinancialSummary: boolean
  
  // Permissões de domínio
  domainPermissions: DomainPermissions
  
  // Ownership e subordinados
  canManageAllPatients: boolean
  canManageOwnPatients: boolean
  subordinateIds: string[]
  sharedDataFrom: string[]
  
  // NFSe
  usesOrgCompanyForNfse: boolean
}
```

### HOOK DE PERMISSÕES DE CARDS

**Arquivo:** `src/hooks/useCardPermissions.ts`

Expõe função principal: `canViewCard(cardId)`

Lógica:
1. Busca metadados do card no registry
2. Extrai `domain` e flags (`requiresOwnership`)
3. Cruza com `resolveEffectivePermissions`:

**Regras por Domain:**
- **clinical**: requer `canAccessClinical === true`
- **financial**: requer `financialAccess === 'read' | 'full'`
- **administrative**: sempre visível, EXCETO se `requiresOwnership === true`

**`requiresOwnership` (administrative apenas):**
- Usado para dados administrativos sensíveis: contato, CPF, dados pessoais
- Regra: pode ver SE:
  - É organization owner (`isOrganizationOwner === true`) OU
  - É terapeuta responsável (`patient.user_id === currentUser.id`)

### HOOK DE PERMISSÕES EFETIVAS (Frontend)

**Arquivo:** `src/hooks/useEffectivePermissions.ts`

Hook React que:
1. Carrega permissões via `resolveEffectivePermissions(userId)`
2. Retorna objeto com:
   - `permissions`: resultado completo
   - `loading`: boolean
   - `error`: Error | null
   - Flags diretas: `canAccessClinical`, `financialAccess`, etc.

**Uso típico:**
```typescript
const { permissions, loading, canAccessClinical, financialAccess } = useEffectivePermissions()

if (!canAccessClinical) return <AccessDenied />
```

### PROTEÇÃO EM CAMADAS

**1. Nível de Rota:**
- `src/components/PermissionRoute.tsx`: wrapper de rotas
- Verifica permissões antes de renderizar página

**2. Nível de Card:**
- Filtro preventivo: lista de cards visíveis é filtrada via `canViewCard()`
- Proteção interna: card retorna `null` se não pode ver

**3. Nível de Query:**
- Backend: RLS garante isolamento por org
- Frontend: queries filtram por `user_id` quando necessário (ex: pacientes do terapeuta)

**4. Nível de Dados:**
- RLS no Supabase é a última camada
- Mesmo que frontend falhe, backend bloqueia

### ARQUIVOS DE PERMISSÃO (Referência)

```
src/types/permissions.ts              - Tipos de permissão
src/lib/resolveEffectivePermissions.ts - Lógica central de resolução
src/hooks/useEffectivePermissions.ts   - Hook React
src/hooks/useCardPermissions.ts        - Permissões de cards
src/lib/checkPatientAccess.ts          - Helpers de acesso a paciente
src/lib/checkPermissions.ts            - Helpers de rotas
src/lib/routePermissions.ts            - Config de permissões por rota
```

Entendeu o sistema de permissões? É CRUCIAL que qualquer funcionalidade nova respeite esses 3 domains e use `canViewCard()` / `resolveEffectivePermissions`. Confirme e vou para o frontend.
```

---

## ⚛️ PROMPT 3 - Estrutura Frontend & Sistema de Cards

```
Perfeito! Agora vamos à estrutura do frontend e ao sistema de cards que foi implementado na TRACK C1.

### ESTRUTURA DE DIRETÓRIOS

```
src/
├── components/          - Componentes reutilizáveis
│   ├── ui/             - Componentes shadcn/ui (Button, Card, Dialog, etc.)
│   ├── organogram/     - Componentes do organograma
│   └── [outros]        - Componentes específicos do sistema
├── pages/              - Páginas/rotas da aplicação
├── hooks/              - Custom hooks React
├── lib/                - Bibliotecas e utilitários
├── types/              - TypeScript types
├── contexts/           - React Contexts (AuthContext)
└── integrations/       - Integrações externas
    └── supabase/       - Cliente Supabase (auto-gerado)
```

### PÁGINAS PRINCIPAIS

**Gestão de Pacientes:**
- `src/pages/Patients.tsx`: listagem de pacientes
- `src/pages/PatientDetail.tsx`: hub do paciente (CENTRAL)
- `src/pages/NewPatient.tsx`, `EditPatient.tsx`: CRUD paciente

**Clínico:**
- `src/pages/ClinicalComplaintForm.tsx`: formulário de queixa clínica
- `src/pages/SessionEvaluationForm.tsx`: avaliação de sessão (exame mental)
- `src/components/ClinicalEvolution.tsx`: evolução do paciente (gráficos)

**Financeiro:**
- `src/pages/Financial.tsx`: visão financeira geral
- `src/pages/NFSeHistory.tsx`: histórico de NFS-e
- `src/pages/PaymentControl.tsx`: controle de pagamentos

**Administrativo:**
- `src/pages/Schedule.tsx`: agenda de sessões
- `src/pages/Dashboard.tsx`: dashboard geral do sistema
- `src/pages/TeamManagement.tsx`: gestão de equipe
- `src/pages/Organogram.tsx`: organograma da organização

### PATIENTDETAIL.TSX - O HUB DO PACIENTE

**Localização:** `src/pages/PatientDetail.tsx`

Este é o componente MAIS IMPORTANTE do sistema. Ele:

1. **Carrega dados do paciente:**
   - Busca `patients` by ID
   - Carrega queixa clínica ativa (`clinical_complaints` WHERE `is_active = true`)
   - Carrega relationships: medications, symptoms, specifiers
   - Carrega sessões, arquivos, etc.

2. **Apresenta 4 abas principais:**
   - **Visão Geral**: sistema de cards customizável (TRACK C1)
   - **Evolução**: `ClinicalEvolution` com avaliações e gráficos
   - **Sessões**: lista de sessões com filtros
   - **Arquivos**: `PatientFiles` com upload/download

3. **Resolve permissões:**
   - Usa `useEffectivePermissions()` para saber o que o user pode ver
   - Passa contexto de ownership: `isTherapistOfPatient = patient.user_id === currentUserId`

4. **Gerencia estado de layout:**
   - Aba "Visão Geral" usa `usePatientOverviewLayout()`
   - Sincroniza com Supabase (`patient_overview_layouts`)

### SISTEMA DE CARDS (TRACK C1 - VISÃO GERAL)

**Arquitetura:**

1. **Registry de Cards:**
   - `src/lib/patientOverviewCardRegistry.tsx`: define TODOS os cards disponíveis
   - Cada card tem:
     - `id`: identificador único
     - `title`, `description`: metadados
     - `domain`: 'clinical' | 'financial' | 'administrative'
     - `component`: React component a renderizar
     - `requiresOwnership`: boolean (para administrative sensível)
     - `defaultSize`: { w, h, minW, minH, maxW, maxH }

2. **Cards Disponíveis (12 total):**

   **Clinical (3 cards):**
   - `patient-complaint-summary`: resumo da queixa ativa (CID-10, gravidade, curso)
   - `patient-medications-list`: lista de medicações atuais (até 5)
   - `patient-diagnoses-list`: diagnósticos únicos por CID-10

   **Financial (3 cards):**
   - `patient-financial-month`: faturamento do mês atual
   - `patient-pending-sessions`: sessões não pagas
   - `patient-nfse-status`: status de emissão de NFS-e

   **Administrative (6 cards):**
   - `patient-sessions-timeline`: últimas 8 sessões com badges de status
   - `patient-session-frequency`: frequência média (semanal/quinzenal/mensal)
   - `patient-attendance-rate`: taxa de comparecimento (últimos 3 meses)
   - `patient-contact-info`: telefone, email (requiresOwnership)
   - `patient-consent-status`: status LGPD
   - `patient-personal-data`: CPF, idade, responsável (requiresOwnership)

3. **Hook de Layout:**
   - `src/hooks/usePatientOverviewLayout.ts`: gerencia layout de cards
   - **Fonte da verdade:** Supabase (`patient_overview_layouts`)
   - **Cache:** localStorage para carregamento rápido
   - **API:**
     - `layout`: layout atual (array de grid items)
     - `visibleCards`: IDs de cards visíveis
     - `addCard(id)`, `removeCard(id)`: CRUD de cards
     - `onLayoutChange(newLayout)`: atualiza layout (auto-save com debounce)
     - `resetLayout()`: volta ao default

4. **Fluxo de Renderização:**
   ```
   PatientDetail
   └─> usePatientOverviewLayout() ────┐
       ├─> Carrega de Supabase         │
       ├─> Mescla com default          │
       └─> Retorna layout + visibleCards
                                        │
   └─> useCardPermissions()            │
       └─> canViewCard(id) para cada card
                                        │
   └─> Filtra cards visíveis ──────────┘
       └─> Renderiza grid com react-grid-layout
   ```

5. **Persistência:**
   - **Tabela:** `patient_overview_layouts`
   - **UNIQUE:** `(user_id, patient_id)`
   - **Campos:** `layout_json` (JSONB), `organization_id`, `version`
   - **RLS:** user só acessa próprio layout
   - **Auto-save:** debounce de 1500ms após mudança

6. **Proteção Dupla:**
   - **Filtro preventivo:** lista de cards já vem filtrada por `canViewCard()`
   - **Proteção interna:** cada card valida novamente e retorna `null` se não pode ver

### HOOKS DE LAYOUT (Referência)

```
src/hooks/usePatientOverviewLayout.ts  - Layout da aba Visão Geral (patient)
src/hooks/useDashboardLayout.ts        - Layout do Dashboard geral (sistema)
src/hooks/useLayoutTemplates.ts        - Templates de layout
```

### COMPONENTES DE UI CUSTOMIZADOS

**Cards Redimensionáveis:**
- `src/components/ResizableCard.tsx`: wrapper de card com resize
- `src/components/ResizableSection.tsx`: seção redimensionável
- Usa `react-grid-layout` internamente

**Grid de Cards:**
- `src/components/GridCardContainer.tsx`: container do grid
- Suporta drag & drop, resize, responsividade

### LIBRARIES E UTILITÁRIOS

```
src/lib/patientOverviewCardRegistry.tsx  - Registry de cards da Visão Geral
src/lib/dashboardCardRegistry.tsx        - Registry de cards do Dashboard
src/lib/dashboardLayoutUtils.ts          - Utilitários de layout
src/lib/defaultLayoutPatientOverview.ts  - Layout default da Visão Geral
src/lib/defaultLayoutDashboard.ts        - Layout default do Dashboard
```

Ficou claro o sistema de cards e a estrutura do PatientDetail? Esse é o padrão que vamos replicar para outras áreas na TRACK C2. Confirme e vou para funcionalidades clínicas.
```

---

## 🩺 PROMPT 4 - Funcionalidades Clínicas & Templates

```
Excelente! Agora vamos às funcionalidades clínicas, que são o core da TRACK C2.

### QUEIXA CLÍNICA (Clinical Complaint)

**Página:** `src/pages/ClinicalComplaintForm.tsx`

**Modelagem de Dados:**
- Tabela principal: `clinical_complaints`
- Relacionamentos:
  - `complaint_medications`: medicações associadas
  - `complaint_symptoms`: sintomas reportados
  - `complaint_specifiers`: especificadores diagnósticos

**Campos Principais:**
```typescript
{
  patient_id: UUID
  created_by: UUID (user que criou)
  organization_id: UUID
  
  // Diagnóstico
  cid_code: string (ex: "F32.1")
  cid_title: string (ex: "Episódio depressivo moderado")
  cid_group: string (ex: "F30-F39")
  has_no_diagnosis: boolean
  
  // Gravidade e Curso
  severity: 'mild' | 'moderate' | 'severe' | null
  functional_impairment: 'none' | 'mild' | 'moderate' | 'severe' | null
  suicidality: 'none' | 'ideation' | 'plan' | 'attempt' | null
  aggressiveness: 'none' | 'verbal' | 'physical' | null
  
  // Temporal
  onset_type: 'acute' | 'insidious' | null
  onset_duration_weeks: number
  course: 'chronic' | 'episodic' | 'single_episode' | null
  
  // Outros
  clinical_notes: text
  comorbidities: JSONB
  vulnerabilities: text[]
  
  // Flag de queixa ativa (CRUCIAL)
  is_active: boolean
}
```

**Regra de Negócio CRÍTICA:**
- **UM paciente tem UMA queixa ativa por vez** (`is_active = true`)
- Ao criar nova queixa ativa, TODAS as outras do mesmo `patient_id` devem ser setadas `is_active = false`
- Histórico de queixas antigas fica disponível para consulta, mas NÃO pode ser "reativado"
- A queixa ativa é usada para alimentar cards clínicos da Visão Geral

**Relacionamentos:**

1. **Medications (`complaint_medications`):**
   ```typescript
   {
     complaint_id: UUID
     class: string (ex: "ISRS")
     substance: string (ex: "Sertralina")
     dosage: string (ex: "50mg")
     frequency: string (ex: "1x ao dia")
     start_date, end_date: date
     is_current: boolean
     adverse_effects: text
   }
   ```

2. **Symptoms (`complaint_symptoms`):**
   ```typescript
   {
     complaint_id: UUID
     symptom_label: string (ex: "Insônia")
     category: string (ex: "Sono")
     is_present: boolean
     intensity: number (0-100)
     frequency: string
     notes: text
   }
   ```

3. **Specifiers (`complaint_specifiers`):**
   ```typescript
   {
     complaint_id: UUID
     specifier_type: string (ex: "Com características melancólicas")
     specifier_value: string
   }
   ```

**Integração com Visão Geral:**
- `PatientDetail` carrega queixa ativa via query: `SELECT * FROM clinical_complaints WHERE patient_id = ? AND is_active = true ORDER BY created_at DESC LIMIT 1`
- Cards clínicos (`patient-complaint-summary`, `patient-medications-list`, `patient-diagnoses-list`) recebem essa queixa via props

### AVALIAÇÃO DE SESSÃO (Session Evaluation)

**Página:** `src/pages/SessionEvaluationForm.tsx`

**Modelagem de Dados:**
- Tabela: `session_evaluations`
- Um registro por sessão avaliada
- Campos: `session_id`, `patient_id`, `evaluated_by`, `organization_id`

**Estrutura de Dados:**
Cada avaliação contém **12 blocos JSONB**, um por função psíquica:

1. **Consciência (`consciousness_data`):**
   - `level`: -100 a +100 (obnubilação ↔ hipervigilância)
   - `field`: -100 a +100 (estreitado ↔ ampliado)
   - Flags: `disoriented_time`, `disoriented_space`, `oriented_auto`, `derealization`, `depersonalization`

2. **Orientação (`orientation_data`):**
   - Flags booleanas: `time`, `space`, `person`, `situation`
   - `reality_judgment`: 'intact' | 'impaired' | 'absent'
   - `insight`: 0-100

3. **Atenção (`attention_data`):**
   - `range`: 0-100 (amplitude)
   - `concentration`: 0-100
   - `distractibility`: boolean

4. **Sensopercepção (`sensoperception_data`):**
   - `global_perception`: 'normal' | 'hypoperception' | 'hyperperception'
   - Flags de modalidades: `visual`, `auditory`, `tactile`, `olfactory`, `kinesthetic`, `mixed`

5. **Memória (`memory_data`):**
   - `fixation`: 0-100 (memória imediata)
   - `recall`: 0-100 (evocação)
   - Flags: `amnesia`, `hypermnesia`, `paramnesia`

6. **Pensamento (`thought_data`):**
   - `course`: -100 a +100 (lentificado ↔ acelerado)
   - Flags: `incoherent`, `tangential`, `circumstantial`, `obsessive`, `delusional`, `overvalued`, `dissociated`

7. **Linguagem (`language_data`):**
   - `speech_rate`: -100 a +100 (diminuído ↔ acelerado)
   - `articulation`: 'normal' | 'dysarthric' | 'scanning' | 'aphasic'

8. **Humor (`mood_data`):**
   - `polarity`: -100 a +100 (depressivo ↔ maníaco)
   - `lability`: 0-100
   - `adequacy`: 'adequate' | 'inadequate'
   - `emotional_responsiveness`: boolean

9. **Vontade (`will_data`):**
   - `volitional_energy`: -100 a +100 (hipobulia ↔ hiperbulia)
   - `impulse_control`: -100 a +100 (impulsividade ↔ controle excessivo)
   - `ambivalence`: boolean

10. **Psicomotricidade (`psychomotor_data`):**
    - `motor_activity`: -100 a +100 (retardo ↔ agitação)
    - `tone_gestures`: 'normal' | 'hypotonic' | 'hypertonic' | 'rigid'
    - `facial_expressiveness`: 0-100

11. **Inteligência (`intelligence_data`):**
    - `abstract_reasoning`: 0-100
    - `learning_capacity`: 0-100
    - `adaptive_capacity`: 'normal' | 'below_expected' | 'above_expected'

12. **Personalidade (`personality_data`):**
    - `self_coherence`: 0-100
    - `self_boundaries`: 'normal' | 'diffuse' | 'rigid'
    - `affective_stability`: 0-100
    - Flags de traços: `anxious`, `avoidant`, `obsessive`, `antisocial`, `borderline`, `histrionic`, `narcissistic`

**Geração de Resumo Clínico:**
- Função `generateSummary(evaluation)`: converte JSONBs em texto psiquiátrico
- Usado em `ClinicalEvolution` para exibir resumo textual de cada avaliação

### EVOLUÇÃO DO PACIENTE (Clinical Evolution)

**Componente:** `src/components/ClinicalEvolution.tsx`

Este componente tem 2 abas internas:

#### Aba 1: Avaliação de Sessões

**Estrutura:**
- **Sidebar (esquerda):** lista de sessões atendidas
  - Filtro por período: all / last_month / last_3_months / last_year
  - Badges: "Avaliação" (se tem `session_evaluations`), "Notas", "Arquivos"
  - Click seleciona sessão

- **Painel (direita):**
  - Se sessão SEM avaliação: botão "Adicionar Avaliação" → `SessionEvaluationForm`
  - Se sessão COM avaliação:
    - **Resumo Clínico:** texto gerado de `generateSummary()`
    - **Anotações Clínicas:** textarea para `sessions.notes`
    - **Upload de Arquivos:** `SessionFileUpload` (codifica session_id no filename)
    - **Grade de 12 cards** de funções psíquicas:
      - Cada card mostra função + síntese textual + mini indicadores visuais
      - Cores por severidade: normal (verde), moderate (amarelo), severe (vermelho)

#### Aba 2: Evolução do Paciente (Gráficos)

**Estrutura:**
- Carrega série temporal de `session_evaluations` (JOIN com `sessions` para date)
- Aplica filtro de período compartilhado
- Renderiza **12 gráficos** (Recharts):
  - Line charts: consciência, humor, pensamento, linguagem, vontade, psicomotricidade, atenção, personalidade
  - Pie charts: orientação (alterações), sensopercepção (modalidades)
  - Radar charts: memória, inteligência

**Layout:**
- Usa `DEFAULT_EVOLUTION_LAYOUT` (definido em `src/lib/defaultLayoutEvolution.ts`)
- Suporta resize via `ResizableSection` / `ResizableCard`
- **Persistência:** localStorage apenas (NÃO em Supabase ainda)
- Modo de edição: `isEditMode` com diálogo "Salvar/Cancelar"

### TEMPLATES - ESTADO ATUAL & FUTURO (TRACK C2)

**Estado Atual:**
- Tabelas `professional_roles` e `clinical_approaches` existem no banco
- Frontend HARDCODED para "Template Psicopatológico Básico" (psicólogos/psiquiatras)
- Todas as funções mentais de `SessionEvaluationForm` assumem esse template
- Todos os campos de `ClinicalComplaintForm` assumem esse template

**Objetivo TRACK C2:**
1. Formalizar código atual como "Template Psicopatológico Básico"
2. Criar camada de Template Resolution:
   - Hook: `useActiveTemplate()` (a ser criado)
   - Lê `profiles.professional_role_id` + `profiles.active_clinical_approach_id` (campo a criar)
   - Retorna: `{ professionalTemplate: 'psychology_basic', approachTemplates: ['tcc'] }`

3. Adaptar formulários para serem "dirigidos por template":
   - `ClinicalComplaintForm` renderiza campos baseado em template
   - `SessionEvaluationForm` renderiza funções baseado em template
   - Cards clínicos da Visão Geral têm metadado `requiredTemplates`

4. Preparar para futuro:
   - Outros roles (nutricionista, fonoaudiólogo) terão templates próprios
   - Outras abordagens (TCC, Junguiana) poderão adicionar campos extras
   - Templates são POR USUÁRIO, não por paciente

Ficou claro o modelo clínico atual e a direção da C2? Confirme e vou para o último prompt sobre fluxo de trabalho.
```

---

## 🔄 PROMPT 5 - Fluxo de Trabalho & Documentação

```
Perfeito! Último prompt: fluxo de trabalho entre nós três e onde encontrar documentação.

### FLUXO DE TRABALHO (VOCÊ + LOVABLE + CHATGPT)

**Esquema de Back-and-Forth:**

1. **Desenvolvedor (você) define escopo:**
   - "Quero implementar X funcionalidade"
   - "Há problema Y acontecendo, precisa debug"
   - "Vou fazer refactor de Z"

2. **Lovable analisa e prepara contexto:**
   - Lê arquivos relevantes (tem acesso completo ao código real)
   - Verifica arquitetura atual, RLS, permissions
   - Identifica conflitos ou dependências
   - **Gera prompt corretivo** para você enviar ao ChatGPT

3. **Você envia o prompt ao ChatGPT:**
   - ChatGPT absorve as correções/esclarecimentos
   - ChatGPT devolve "mapa mental atualizado" e dúvidas restantes

4. **Lovable responde dúvidas do ChatGPT:**
   - Valida entendimento
   - Corrige mal-entendidos
   - Fornece schemas SQL, trechos de código, etc.
   - Define decisões de arquitetura

5. **ChatGPT propõe solução:**
   - Arquitetura detalhada
   - Planejamento de implementação
   - Identificação de riscos

6. **Lovable valida e implementa:**
   - Revisa proposta do ChatGPT
   - Ajusta conforme necessidade
   - **Implementa as mudanças no código real**
   - Testa e valida

7. **Iteração:**
   - Se algo não funcionou, volta ao passo 3 com ajustes
   - Se funcionou, parte para próxima feature

**Princípios do Time:**
- **Lovable é o arquiteto:** conhece o código real, valida tudo
- **ChatGPT é o analista:** absorve contexto, propõe soluções
- **Você é o product owner:** define o que fazer, valida resultado final

### DOCUMENTAÇÃO TÉCNICA DISPONÍVEL

**Arquitetura & Permissions:**
- `docs/ARQUITETURA_PERMISSOES_E_INTEGRACOES.md`: visão geral do sistema
- `PERMISSIONS_SYSTEM.md`: sistema de permissões (Sprints 0-5)
- `docs/FASE_11.5_AUDITORIA_FINAL_E_HARDENING_RLS.md`: auditoria RLS multi-org
- `docs/FASE_11.1_RLS_CLINICO.md`: RLS das tabelas clínicas
- `docs/FASE_11.3_RLS_AGENDA_NOTIFICACOES.md`: RLS de agenda e notificações
- `docs/FASE_11.4_RLS_CORE_ORGANIZATIONAL.md`: RLS do core organizacional

**Sistema de Cards & Layouts:**
- `docs/TRACK_C1_CHANGELOG.md`: changelog completo da TRACK C1 (Visão Geral)
- `docs/TRACK_C1_PATIENT_OVERVIEW_QA.md`: Q&A da implementação
- `src/hooks/DASHBOARD_LAYOUT_USAGE.md`: guia de uso do sistema de layouts
- `src/lib/DASHBOARD_LAYOUT_SYSTEM.md`: arquitetura do sistema de layouts

**Integrações:**
- `GUIA_NFSE.md`: integração NFSe (FocusNFE)
- `docs/DIAGNOSTICO_WHATSAPP_COMPLETO.md`: integração WhatsApp

**Tipos e Configurações:**
- `src/types/permissions.ts`: tipos de permissão
- `src/types/cardTypes.ts`: tipos de cards do Dashboard
- `src/types/patientOverviewCardTypes.ts`: tipos de cards da Visão Geral
- `src/integrations/supabase/types.ts`: tipos auto-gerados do Supabase (READ-ONLY)

### CONVENÇÕES DE CÓDIGO

**Naming:**
- Hooks: `use[Nome]` (ex: `usePatientOverviewLayout`)
- Helpers: `[verbo][Nome]` (ex: `resolveEffectivePermissions`)
- Components: `PascalCase` (ex: `PatientDetail`)
- Files: match component name (ex: `PatientDetail.tsx`)

**Estrutura de Hooks:**
```typescript
export function useMyHook() {
  const [state, setState] = useState()
  const { user } = useAuth()
  
  useEffect(() => {
    // side effects
  }, [deps])
  
  return {
    // estado público
    // funções públicas
  }
}
```

**Estrutura de Libs:**
```typescript
// src/lib/myLib.ts
export function myFunction() {
  // lógica pura, sem side effects
}

export async function myAsyncFunction() {
  // pode fazer queries ao Supabase
}
```

**Componentes:**
```typescript
// src/components/MyComponent.tsx
interface MyComponentProps {
  // props tipadas
}

export function MyComponent({ prop1, prop2 }: MyComponentProps) {
  // hooks no topo
  // lógica
  // render
}
```

### DECISÕES ARQUITETURAIS CRÍTICAS (NÃO QUEBRAR)

1. **Domains são apenas 3:** clinical, financial, administrative
   - Não criar domains novos como "sessions", "contact", etc.

2. **Queixa ativa é única:** 1 paciente = 1 queixa ativa
   - Visão Geral sempre trabalha com essa queixa única

3. **Supabase é fonte da verdade para layouts:**
   - localStorage é apenas cache
   - Qualquer layout customizável DEVE ter tabela no Supabase

4. **RLS é obrigatório:** toda tabela sensível DEVE ter RLS
   - `organization_id` é obrigatório
   - Triggers automáticos preenchem `organization_id`

5. **Permissões via `resolveEffectivePermissions`:**
   - NUNCA fazer lógica de permissão direta
   - Sempre passar por `useCardPermissions.canViewCard()`

6. **Templates são por usuário, não por paciente:**
   - Um psicólogo não pode ter pacientes em templates diferentes
   - Se mudar abordagem, muda para TODOS os pacientes dele

7. **`SessionEvaluationForm` é específico do template psicopatológico:**
   - Outros roles (nutri, fono) terão formulários próprios
   - Não tentar generalizar demais

### ARQUIVOS CRÍTICOS (NÃO MEXER SEM CONSULTAR)

**Auto-gerados pelo Supabase:**
- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/types.ts`
- `.env`

**Core de Permissões:**
- `src/lib/resolveEffectivePermissions.ts`
- `src/hooks/useCardPermissions.ts`
- `src/types/permissions.ts`

**Registries:**
- `src/lib/patientOverviewCardRegistry.tsx`
- `src/lib/dashboardCardRegistry.tsx`

### PRÓXIMOS PASSOS (QUANDO ENTRAR EM ATIVIDADE)

1. **Desenvolvedor define escopo específico:**
   - Ex: "Implementar sistema de templates para TRACK C2"
   - Ex: "Refatorar ClinicalComplaintForm para ser dirigido por template"

2. **Lovable fornece:**
   - Lista de arquivos relevantes para ler
   - Schemas SQL se necessário
   - Contexto adicional específico daquela área

3. **ChatGPT analisa e propõe:**
   - Arquitetura detalhada
   - Plano de implementação
   - Identificação de riscos

4. **Iteração até conclusão**

### RESUMO FINAL

Você agora tem o contexto completo do sistema:
- ✅ Arquitetura backend (Supabase, RLS, multi-tenant)
- ✅ Sistema de permissões (domains, resolveEffectivePermissions, useCardPermissions)
- ✅ Estrutura frontend (React, hooks, pages, components)
- ✅ Sistema de cards (TRACK C1, Visão Geral, persistência)
- ✅ Funcionalidades clínicas (queixa, avaliação, evolução)
- ✅ Templates (estado atual e direção futura)
- ✅ Fluxo de trabalho (você + Lovable + ChatGPT)

Quando o desenvolvedor vier com um escopo de trabalho:
1. Confirme que você entendeu o contexto geral
2. Peça os arquivos específicos relevantes àquela tarefa
3. Absorva o contexto fino daqueles arquivos
4. Proponha solução alinhada com a arquitetura existente
5. Itere com Lovable até validação

**Está pronto para começar?** Aguarde o desenvolvedor definir o escopo da próxima atividade e o Lovable fornecer os arquivos específicos necessários.
```

---

## 📎 ANEXO - Arquivos para Enviar Conforme Necessário

**Quando pedir arquivos específicos, mencione:**

### Para qualquer atividade clínica (C2):
- `src/pages/PatientDetail.tsx`
- `src/pages/ClinicalComplaintForm.tsx`
- `src/pages/SessionEvaluationForm.tsx`
- `src/components/ClinicalEvolution.tsx`

### Para atividades de layout/cards:
- `src/lib/patientOverviewCardRegistry.tsx`
- `src/hooks/usePatientOverviewLayout.ts`
- `src/hooks/useDashboardLayout.ts`

### Para atividades de permissões:
- `src/lib/resolveEffectivePermissions.ts`
- `src/hooks/useCardPermissions.ts`
- `src/types/permissions.ts`

### Para schemas SQL (quando necessário):
- Lovable pode fornecer via texto (não arquivo)

---

## 🎯 Instruções de Uso

1. **Cole os 5 prompts na sequência** em uma nova conversa com ChatGPT
2. **Aguarde confirmação** do ChatGPT após cada prompt antes de colar o próximo
3. **Após o Prompt 5**, ChatGPT estará pronto para receber escopo de trabalho
4. **Defina a atividade específica** (ex: "Vamos implementar TRACK C2")
5. **Lovable fornecerá lista de arquivos** relevantes para aquela atividade
6. **Envie os arquivos** ao ChatGPT conforme indicado
7. **Itere** entre ChatGPT e Lovable até conclusão

---

**Fim do Guia de Invocação**
