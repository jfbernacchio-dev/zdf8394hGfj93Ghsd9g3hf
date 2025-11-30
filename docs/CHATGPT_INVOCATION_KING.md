# 🔮 CHATGPT INVOCATION KING - Sistema Mindware

**O Documento Supremo de Invocação**

Este documento contém uma sequência de 11 prompts em texto puro que te colocarão completamente a par do sistema **Mindware**, do zero, sem precisar de acesso ao repositório. Após absorver estes prompts, você poderá trabalhar em QUALQUER área do sistema pedindo apenas os arquivos estritamente necessários.

**Tempo estimado de leitura:** 45-60 minutos

---

## 📖 Como Usar Este Documento

1. **Novo Chat:** Abra um novo chat com o ChatGPT (ou outro modelo)
2. **Envio Sequencial:** Envie cada prompt numerado, um por vez
3. **Aguarde Confirmação:** Após cada prompt, aguarde a confirmação de entendimento do modelo antes de prosseguir
4. **Prompt Final:** O último prompt (Prompt 11) define o contrato de trabalho e guardrails
5. **Pronto!** Após todos os prompts, o modelo estará pronto para trabalhar em qualquer funcionalidade

---

## 🌟 Prompt 1 — Visão Geral Filosófica + Propósito do Sistema

```
Olá! Vou te apresentar o **Mindware**, um sistema completo de gestão clínica multi-tenant focado em psicologia e saúde mental. Vou fazer isso em etapas sequenciais. Começamos pela visão geral e propósito.

### O QUE É O MINDWARE

Mindware é uma plataforma SaaS de gestão clínica projetada especificamente para profissionais de psicologia, psiquiatria e áreas relacionadas. É um sistema multi-tenant real onde cada organização (clínica, consultório, grupo de profissionais) tem seus dados completamente isolados.

### PÚBLICO-ALVO

- **Psicólogos clínicos:** profissionais autônomos ou em clínicas
- **Donas de clínica:** gestores de clínicas com múltiplos profissionais
- **Equipe administrativa:** secretárias, assistentes, contadores
- **Psiquiatras e profissionais correlatos:** nutricionistas, terapeutas ocupacionais (suporte futuro)

### PROBLEMAS QUE O SISTEMA RESOLVE

**1. Gestão de Pacientes:**
- Cadastro completo de pacientes com dados pessoais, contatos, responsáveis (para menores)
- Controle de status (ativo/inativo)
- Histórico completo de interações e evolução

**2. Prontuário Clínico Digital:**
- Queixa clínica estruturada com CID-10
- Sintomas, medicações, comorbidades
- Avaliações de sessão baseadas em funções psíquicas (modelo psicopatológico de Dalgalarrondo)
- Evolução temporal com gráficos e interpretações automatizadas

**3. Agenda e Sessões:**
- Controle de sessões agendadas, realizadas, faltadas, canceladas
- Bloqueios de agenda
- Timeline visual
- Cálculo de taxa de comparecimento

**4. Financeiro:**
- Valores de sessão (por sessão ou mensalidade fixa)
- Controle de pagamentos
- Emissão de NFS-e integrada (via FocusNFe)
- Fechamentos mensais
- Métricas de receita, ticket médio, receita perdida (faltas)

**5. Gestão de Equipe:**
- Organograma hierárquico multinível
- Métricas agregadas por terapeuta
- Distribuição de carga de trabalho
- Visibilidade controlada de dados (vertical e horizontal)

**6. Métricas e Dashboards:**
- Dashboard personalizável com drag & drop
- Página /metrics com visões por domínio (Financial, Administrative, Marketing, Team)
- Cards métricos (KPIs numéricos)
- Gráficos interativos com múltiplas escalas de tempo
- Seleção persistente de visualizações

**7. Compliance e LGPD:**
- Consentimento digital de pacientes
- Logs de acesso administrativo
- Exportação de dados para o titular
- Gestão de incidentes de segurança

### FILOSOFIA GERAL DO SISTEMA

**1. Multi-tenant Real:**
- Isolamento total via `organization_id` em todas as tabelas
- Row Level Security (RLS) em 100% das tabelas
- Cada organização vê apenas seus dados
- Suporte a múltiplas organizações por usuário (troca via switcher)

**2. Foco em Psicologia Clínica:**
- Estruturas de dados específicas para psicopatologia
- Templates clínicos configuráveis por papel profissional
- Terminologia e fluxos alinhados com a prática clínica real

**3. Dados e Dashboards:**
- Tudo é mensurável: pacientes, sessões, receita, retenção, churn
- Dashboards são o "cérebro operacional" da clínica
- Decisões baseadas em dados, não em intuição

**4. Permissões Granulares:**
- 3 domínios lógicos: `clinical`, `financial`, `administrative`
- Controle fino de acesso por domínio e nível organizacional
- Visibilidade vertical (hierarquia) e horizontal (pares)

**5. Customização e Flexibilidade:**
- Layouts de cards personalizáveis (drag & drop, resize)
- Seleção de gráficos customizável
- Persistência no Supabase (não apenas localStorage)
- Templates de layout reutilizáveis

**6. Ética e Segurança:**
- Dados clínicos sensíveis protegidos com RLS
- Consentimento explícito para uso de dados
- Auditoria completa de acessos administrativos
- Separação clara entre dados clínicos e administrativos

### STACK TECNOLÓGICA

- **Frontend:** React 18 + TypeScript + Vite
- **UI:** Tailwind CSS + Radix UI + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Row Level Security + Edge Functions)
- **State:** React Query (@tanstack/react-query)
- **Routing:** React Router v6
- **Charts:** Recharts
- **Drag & Drop:** @dnd-kit, react-grid-layout

### MODELO MENTAL DO SISTEMA

Pense no Mindware como uma **"clínica virtual inteligente"** onde:

1. **Pacientes** são o núcleo: tudo gira em torno deles
2. **Sessões** são eventos que geram dados clínicos e financeiros
3. **Métricas** transformam dados em insights acionáveis
4. **Permissões** garantem que cada pessoa vê apenas o que deve
5. **Templates** permitem adaptar o sistema a diferentes abordagens clínicas
6. **Organograma** modela a realidade de clínicas com múltiplos níveis hierárquicos

Entendeu essa visão geral? Confirme e vou para o Prompt 2 sobre arquitetura técnica.
```

---

## 🏗️ Prompt 2 — Arquitetura Técnica Global (Frontend, Backend, Infra, Supabase, RLS)

```
Perfeito! Agora vamos à arquitetura técnica global do Mindware.

### STACK DETALHADA

**Frontend:**
- React 18.3.1 (componentes funcionais, hooks)
- TypeScript (strict mode)
- Vite (bundler e dev server)
- Tailwind CSS 3.x (design system via HSL tokens em `index.css`)
- shadcn/ui (componentes base customizáveis)
- Radix UI (primitivos headless)
- React Query 5.x (cache de dados, refetch automático)
- React Router 6.x (navegação SPA)

**Backend:**
- Supabase (PostgreSQL 15+)
- Row Level Security (RLS) em TODAS as tabelas
- Edge Functions (Deno runtime) para lógica de backend
- Supabase Auth (gerenciamento de usuários e sessões)
- Supabase Storage (arquivos clínicos de pacientes)

**Bibliotecas Principais:**
- `recharts`: gráficos (line, bar, pie, radar)
- `react-grid-layout`: grid drag & drop
- `@dnd-kit`: drag & drop geral (organograma)
- `date-fns`: manipulação de datas
- `zod`: validação de schemas
- `react-hook-form`: formulários
- `sonner`: toasts/notificações

### ARQUITETURA MULTI-TENANT

**Como Funciona na Prática:**

1. **Tabela `organizations`:**
   - Cada clínica/consultório é uma `organization`
   - Campos: `id`, `legal_name`, `cnpj`, `created_by`, `whatsapp_enabled`

2. **Coluna `organization_id` em TODAS as Tabelas Sensíveis:**
   - `patients.organization_id`
   - `sessions.organization_id`
   - `clinical_complaints.organization_id`
   - `profiles.organization_id`
   - etc.

3. **Trigger Automático:**
   - Trigger `auto_set_organization_from_user` dispara no INSERT
   - Preenche `organization_id` automaticamente via função `resolve_organization_for_user(user_id)`
   - Garante que NENHUM registro fica sem `organization_id`

4. **Função Central: `current_user_organization()`**
   - Retorna o `organization_id` do usuário autenticado
   - Usada em TODAS as políticas RLS
   - Exemplo: `organization_id = current_user_organization()`

### ROW LEVEL SECURITY (RLS)

**Padrão de Políticas (exemplo: tabela `patients`):**

```sql
-- SELECT: vê apenas da própria org
CREATE POLICY "patients_org_select"
ON patients FOR SELECT
USING (organization_id = current_user_organization());

-- INSERT: insere apenas na própria org
CREATE POLICY "patients_org_insert"
ON patients FOR INSERT
WITH CHECK (organization_id = current_user_organization());

-- UPDATE: atualiza apenas da própria org E próprios pacientes
CREATE POLICY "patients_org_update"
ON patients FOR UPDATE
USING (user_id = auth.uid() AND organization_id = current_user_organization())
WITH CHECK (user_id = auth.uid() AND organization_id = current_user_organization());

-- DELETE: deleta apenas da própria org E próprios pacientes
CREATE POLICY "patients_org_delete"
ON patients FOR DELETE
USING (user_id = auth.uid() AND organization_id = current_user_organization());

-- Política adicional para admins (vê tudo)
CREATE POLICY "patients_admin_all"
ON patients FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

**Funções Helper de RLS:**
- `has_role(user_id, role)`: verifica role do usuário
- `get_level_organization_id(level_id)`: resolve org_id a partir de um nível
- `is_organization_owner(user_id)`: verifica se é dono da org
- `get_organization_hierarchy_info(user_id)`: retorna dados de hierarquia

**Triggers de RLS:**
- `auto_set_organization_from_user`: preenche `organization_id` automaticamente
- `auto_set_organization_from_patient`: preenche via relacionamento com patient
- `auto_set_organization_from_complaint`: preenche via complaint → patient
- Todos esses triggers impedem que `organization_id` fique NULL ou seja mudado após inserção

### EDGE FUNCTIONS (Backend Lógico)

Localizadas em `supabase/functions/`:

**NFSe (Notas Fiscais):**
- `issue-nfse`: emite nota fiscal via FocusNFe API
- `cancel-nfse`: cancela nota fiscal
- `check-nfse-status`: consulta status de processamento
- `download-nfse-pdf`: faz download do PDF da nota
- `send-nfse-email`: envia nota por email

**WhatsApp:**
- `send-whatsapp`: envia mensagem via Z-API ou Dialog360
- `send-whatsapp-reply`: responde mensagem
- `whatsapp-webhook`: recebe webhooks de mensagens recebidas
- `download-whatsapp-media`: baixa mídias de conversas

**LGPD e Compliance:**
- `export-patient-data`: exporta dados do titular (LGPD)
- `send-consent-form`: envia formulário de consentimento
- `submit-consent-form`: processa submissão de consentimento
- `check-consent-expiry`: verifica validade de consentimentos
- `send-compliance-reminders`: envia lembretes de compliance

**Automações:**
- `auto-mark-sessions`: marca sessões como realizadas automaticamente
- `cleanup-audit-logs`: limpa logs antigos

**Helpers Compartilhados:**
- `supabase/functions/_shared/organizationNFSeConfigHelper.ts`: busca config NFSe
- `supabase/functions/_shared/rateLimit.ts`: rate limiting
- `supabase/functions/_shared/sessionUtils.ts`: utilitários de sessão

### ARQUITETURA FRONTEND

**Estrutura de Diretórios:**

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes shadcn/ui base
│   ├── cards/          # Cards métricos e de dashboard
│   │   └── metrics/    # Cards específicos de /metrics
│   ├── charts/         # Componentes de gráficos
│   │   └── metrics/    # Gráficos específicos de /metrics
│   ├── clinical/       # Componentes clínicos (evolução, templates)
│   └── organogram/     # Componentes do organograma
├── pages/              # Páginas/rotas da aplicação
├── hooks/              # Custom hooks React
├── lib/                # Bibliotecas e utilitários
│   ├── templates/      # Sistema de templates clínicos
│   └── clinical/       # Validações e tipos clínicos
├── types/              # TypeScript types
├── contexts/           # React Contexts (AuthContext)
└── integrations/       # Integrações externas
    └── supabase/       # Cliente Supabase (auto-gerado)
```

**Fluxo de Dados:**

1. **Componente React** usa `useQuery` (React Query)
2. **Hook customizado** (ex: `useTeamData`) encapsula lógica
3. **Cliente Supabase** faz query com RLS automático
4. **RLS no Postgres** filtra dados por `organization_id`
5. **React Query** cacheia resultado
6. **Componente** renderiza dados

**Exemplo de Fluxo Completo:**

```typescript
// 1. Hook customizado
function useTeamData() {
  const { organizationId } = useAuth();
  
  return useQuery({
    queryKey: ['team-data', organizationId],
    queryFn: async () => {
      const { getUserIdsInOrganization } = await import('@/lib/organizationFilters');
      const orgUserIds = await getUserIdsInOrganization(organizationId);
      
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .in('user_id', orgUserIds); // RLS aplica filtro adicional
      
      if (error) throw error;
      return data;
    }
  });
}

// 2. Componente usa hook
function TeamDashboard() {
  const { data: teamSessions, isLoading } = useTeamData();
  
  if (isLoading) return <Skeleton />;
  return <SessionChart data={teamSessions} />;
}
```

**Roteamento:**

- `src/main.tsx`: ponto de entrada, setup de React Query e AuthProvider
- `src/App.tsx`: definição de rotas com React Router
- Rotas protegidas via `<PermissionRoute>` (verifica permissões antes de renderizar)

### INTEGRAÇÃO SUPABASE ↔ FRONTEND

**Cliente Supabase:**
- `src/integrations/supabase/client.ts`: cliente singleton (NÃO EDITAR - auto-gerado)
- `src/integrations/supabase/types.ts`: tipos TypeScript do DB (NÃO EDITAR - auto-gerado)
- Import padrão: `import { supabase } from '@/integrations/supabase/client'`

**AuthContext:**
- `src/contexts/AuthContext.tsx`: contexto global de autenticação
- Provê: `user`, `profile`, `roleGlobal`, `organizationId`, `organizations`, etc.
- Gerencia estado de login, logout, signup
- Carrega permissões efetivas via `resolveEffectivePermissions()`

**Variáveis de Ambiente:**
- `.env`: contém `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`
- NÃO EDITAR manualmente (gerenciado pelo Lovable)

Entendeu a arquitetura técnica? Confirme e vou para o Prompt 3 sobre o banco de dados.
```

---

## 🗄️ Prompt 3 — Banco de Dados Completo: Tabelas, Relações e Uso

```
Ótimo! Agora vamos ao banco de dados completo do Mindware.

### TABELAS CORE DE ORGANIZAÇÃO

**1. `organizations`**
- **Propósito:** Cadastro de organizações (clínicas, consultórios)
- **Campos principais:**
  - `id` (UUID PK)
  - `legal_name` (TEXT): razão social
  - `cnpj` (TEXT): CNPJ formatado
  - `created_by` (UUID): quem criou
  - `whatsapp_enabled` (BOOLEAN): se WhatsApp está ativo
- **Uso:** Isolamento multi-tenant, cada org vê apenas seus dados

**2. `organization_owners`**
- **Propósito:** Vínculo entre users e orgs (quem é dono de qual org)
- **Campos principais:**
  - `user_id` (UUID FK → auth.users)
  - `organization_id` (UUID FK → organizations)
  - `is_primary` (BOOLEAN): se é a org principal do usuário
- **Uso:** Permite usuário ter múltiplas orgs, switch entre elas

**3. `organization_levels`**
- **Propósito:** Níveis hierárquicos dentro da org (ex: Diretoria, Gerência, Operacional)
- **Campos principais:**
  - `id` (UUID PK)
  - `organization_id` (UUID FK → organizations)
  - `level_name` (TEXT): nome do nível
  - `level_number` (INTEGER): número do nível (1 = topo)
- **Uso:** Estrutura hierárquica vertical para permissões

**4. `organization_positions`**
- **Propósito:** Posições/cargos dentro dos níveis (ex: "Diretor Clínico", "Psicólogo Sênior")
- **Campos principais:**
  - `id` (UUID PK)
  - `level_id` (UUID FK → organization_levels)
  - `position_name` (TEXT): nome da posição
  - `parent_position_id` (UUID FK → organization_positions): posição pai (hierarquia)
- **Uso:** Estrutura de árvore para organograma

**5. `user_positions`**
- **Propósito:** Atribui usuários a posições (pode ter múltiplas)
- **Campos principais:**
  - `user_id` (UUID FK → auth.users)
  - `position_id` (UUID FK → organization_positions)
  - `access_expires_at` (TIMESTAMPTZ): acesso temporário (pode ser NULL)
- **Uso:** Define a posição de cada usuário no organograma

### TABELAS CORE DE USUÁRIOS

**6. `auth.users` (gerenciado pelo Supabase Auth)**
- **Propósito:** Usuários do sistema (email/senha)
- **NÃO ACESSÍVEL DIRETAMENTE** via Supabase client (use apenas `auth.uid()` nas policies)

**7. `profiles`**
- **Propósito:** Perfil estendido dos users (dados pessoais e profissionais)
- **Campos principais:**
  - `id` (UUID PK = FK → auth.users)
  - `full_name` (TEXT): nome completo
  - `cpf` (TEXT): CPF (validado com trigger)
  - `crp` (TEXT): número do conselho profissional
  - `birth_date` (DATE): data de nascimento
  - `phone` (TEXT): telefone
  - `professional_role_id` (UUID FK → professional_roles): papel profissional
  - `clinical_approach_id` (UUID FK → clinical_approaches): abordagem clínica
  - `organization_id` (UUID FK → organizations): org principal
  - `work_days` (INTEGER[]): dias de trabalho (0=dom, 6=sáb)
  - `work_start_time`, `work_end_time` (TEXT): horário de trabalho
  - `slot_duration`, `break_time` (INTEGER): duração de sessão e pausa (minutos)
- **Uso:** Dados do terapeuta, configuração de agenda, papel profissional

**8. `user_roles`**
- **Propósito:** Roles globais dos usuários
- **Campos principais:**
  - `user_id` (UUID FK → auth.users)
  - `role` (app_role ENUM): 'admin', 'psychologist', 'assistant', 'accountant'
- **Uso:** Define papel global do usuário (usado em RLS com `has_role()`)

**9. `professional_roles`**
- **Propósito:** Catálogo de papéis profissionais (Psicólogo, Psiquiatra, Nutricionista, etc.)
- **Campos principais:**
  - `id` (UUID PK)
  - `slug` (TEXT UNIQUE): identificador (ex: 'psychologist')
  - `label` (TEXT): nome amigável
  - `is_clinical` (BOOLEAN): se é profissional clínico
  - `is_active` (BOOLEAN): se está ativo
- **Uso:** Determina templates clínicos disponíveis, flags `isClinicalProfessional`

**10. `clinical_approaches`**
- **Propósito:** Catálogo de abordagens clínicas (TCC, Psicanálise, Junguiana, etc.)
- **Campos principais:**
  - `id` (UUID PK)
  - `slug` (TEXT): identificador (ex: 'tcc')
  - `label` (TEXT): nome amigável
  - `professional_role_id` (UUID FK → professional_roles): role associado
  - `is_active`, `is_default` (BOOLEAN): flags
- **Uso:** Futuro suporte a templates específicos por abordagem

### TABELAS CORE DE PACIENTES

**11. `patients`**
- **Propósito:** Cadastro de pacientes
- **Campos principais:**
  - `id` (UUID PK)
  - `user_id` (UUID FK → auth.users): terapeuta responsável
  - `organization_id` (UUID FK → organizations)
  - `name` (TEXT): nome do paciente
  - `email`, `phone`, `cpf` (TEXT): contatos
  - `birth_date` (DATE): data de nascimento
  - `is_minor` (BOOLEAN): se é menor de idade
  - `guardian_name`, `guardian_cpf`, `guardian_phone_1`, `guardian_email` (TEXT): responsável
  - `session_value` (NUMERIC): valor da sessão
  - `frequency` (TEXT): frequência (semanal, quinzenal, mensal)
  - `monthly_price` (BOOLEAN): se paga mensalidade fixa ou por sessão
  - `status` (TEXT): 'active' ou 'inactive'
  - `nfse_issue_to` (TEXT): 'patient' ou 'guardian' (para menores)
  - `no_nfse` (BOOLEAN): se NÃO emite nota fiscal
- **Uso:** Núcleo do sistema, todos os dados giram em torno do paciente
- **Trigger:** `validate_patient_data()` valida CPF com dígitos verificadores

**12. `sessions`**
- **Propósito:** Sessões de terapia (agendadas, realizadas, faltadas)
- **Campos principais:**
  - `id` (UUID PK)
  - `patient_id` (UUID FK → patients)
  - `organization_id` (UUID FK → organizations)
  - `date` (DATE): data da sessão
  - `time` (TEXT): horário
  - `status` (TEXT): 'scheduled', 'attended', 'missed', 'cancelled', 'rescheduled'
  - `value` (NUMERIC): valor cobrado
  - `paid` (BOOLEAN): se foi paga
  - `nfse_issued_id` (UUID FK → nfse_issued): nota fiscal vinculada
  - `manually_marked_nfse` (BOOLEAN): se NF foi marcada manualmente
  - `show_in_schedule` (BOOLEAN): se aparece na agenda
  - `notes` (TEXT): anotações gerais
- **Uso:** Gera dados financeiros (receita) e clínicos (evolução)

**13. `clinical_complaints` (queixa clínica)**
- **Propósito:** Queixa clínica principal do paciente
- **Campos principais:**
  - `id` (UUID PK)
  - `patient_id` (UUID FK → patients)
  - `organization_id` (UUID FK → organizations)
  - `created_by` (UUID FK → auth.users): quem criou
  - `is_active` (BOOLEAN): se está ativa (APENAS UMA ATIVA POR PACIENTE)
  - `cid_code`, `cid_title`, `cid_group` (TEXT): diagnóstico CID-10
  - `has_no_diagnosis` (BOOLEAN): se ainda não tem diagnóstico fechado
  - `severity` (TEXT): 'leve', 'moderado', 'grave'
  - `onset_type` (TEXT): 'agudo', 'insidioso', 'crônico'
  - `onset_duration_weeks` (INTEGER): duração em semanas
  - `course` (TEXT): 'contínuo', 'episódico', 'progressivo', 'remitente'
  - `suicidality`, `aggressiveness`, `functional_impairment` (TEXT): avaliações de risco
  - `vulnerabilities` (TEXT[]): vulnerabilidades identificadas
  - `clinical_notes` (TEXT): anotações clínicas
  - `comorbidities` (JSONB): comorbidades estruturadas
- **Uso:** Estrutura a queixa do paciente, base para evolução clínica
- **REGRA CRÍTICA:** Apenas UMA queixa com `is_active = true` por paciente

**14. `complaint_medications`**
- **Propósito:** Medicações psiquiátricas do paciente
- **Campos principais:**
  - `id` (UUID PK)
  - `complaint_id` (UUID FK → clinical_complaints)
  - `class` (TEXT): classe da medicação (ex: 'antidepressivo')
  - `substance` (TEXT): substância ativa (ex: 'sertralina')
  - `dosage` (TEXT): dosagem (ex: '50mg')
  - `frequency` (TEXT): frequência (ex: '1x ao dia')
  - `is_current` (BOOLEAN): se está em uso atual
  - `start_date`, `end_date` (DATE): período de uso
  - `adverse_effects`, `notes` (TEXT): efeitos e observações
- **Uso:** Registro completo de medicações psiquiátricas

**15. `complaint_symptoms`**
- **Propósito:** Sintomas da queixa
- **Campos principais:**
  - `id` (UUID PK)
  - `complaint_id` (UUID FK → clinical_complaints)
  - `symptom_label` (TEXT): nome do sintoma
  - `category` (TEXT): categoria do sintoma
  - `is_present` (BOOLEAN): se está presente
  - `intensity` (INTEGER): intensidade 0-10
  - `frequency` (TEXT): 'raro', 'ocasional', 'frequente', 'constante'
- **Uso:** Rastreamento de sintomas ao longo do tratamento

**16. `complaint_specifiers`**
- **Propósito:** Especificadores da queixa (ex: "com características melancólicas")
- **Campos principais:**
  - `id` (UUID PK)
  - `complaint_id` (UUID FK → clinical_complaints)
  - `specifier_type` (TEXT): tipo do especificador
  - `specifier_value` (TEXT): valor do especificador
- **Uso:** Detalha características específicas do diagnóstico

**17. `session_evaluations`**
- **Propósito:** Avaliação psicopatológica da sessão (exame mental)
- **Campos principais:**
  - `id` (UUID PK)
  - `session_id` (UUID FK → sessions)
  - `patient_id` (UUID FK → patients)
  - `evaluated_by` (UUID FK → auth.users)
  - `consciousness_data` (JSONB): consciência (nível, campo, autopercepção)
  - `orientation_data` (JSONB): orientação (tempo, espaço, pessoa, situação)
  - `attention_data` (JSONB): atenção (concentração, distrabilidade)
  - `memory_data` (JSONB): memória (fixação, evocação, amnésia)
  - `mood_data` (JSONB): humor (polaridade, labilidade, adequação)
  - `thought_data` (JSONB): pensamento (curso, conteúdo, obsessões, delírios)
  - `language_data` (JSONB): linguagem (articulação, ritmo)
  - `sensoperception_data` (JSONB): sensopercepção (alucinações)
  - `intelligence_data` (JSONB): inteligência (raciocínio abstrato)
  - `will_data` (JSONB): vontade (energia volitiva, ambivalência)
  - `psychomotor_data` (JSONB): psicomotricidade (atividade motora)
  - `personality_data` (JSONB): personalidade (coerência do eu, estabilidade afetiva)
- **Uso:** Registro estruturado das 12 funções psíquicas de Dalgalarrondo
- **Modelo:** Template `psychology_basic` (pode ter outros no futuro)

**18. `patient_files`**
- **Propósito:** Arquivos anexos do paciente (PDFs, imagens, etc.)
- **Campos principais:**
  - `id` (UUID PK)
  - `patient_id` (UUID FK → patients)
  - `uploaded_by` (UUID FK → auth.users)
  - `file_path` (TEXT): path no Supabase Storage
  - `file_name`, `file_type` (TEXT): metadados
  - `category` (TEXT): categoria do arquivo
  - `is_clinical` (BOOLEAN): se é arquivo clínico sensível
- **Uso:** Armazenamento de documentos, laudos, exames, etc.

### TABELAS FINANCEIRAS

**19. `nfse_issued` (notas fiscais emitidas)**
- **Propósito:** Registro de notas fiscais eletrônicas emitidas
- **Campos principais:**
  - `id` (UUID PK)
  - `patient_id` (UUID FK → patients)
  - `user_id` (UUID FK → auth.users): terapeuta emissor
  - `session_ids` (UUID[]): array de sessões nesta nota
  - `service_value`, `iss_value`, `net_value` (NUMERIC): valores
  - `status` (TEXT): 'processing', 'issued', 'error', 'cancelled'
  - `focusnfe_ref` (TEXT): referência no FocusNFe
  - `nfse_number` (TEXT): número da nota fiscal
  - `pdf_url`, `xml_url` (TEXT): URLs dos documentos
  - `verification_code` (TEXT): código de verificação
  - `issue_date` (DATE): data de emissão
  - `error_message` (TEXT): erro se houver
- **Uso:** Controle completo do ciclo de vida da NFS-e

**20. `nfse_payments` (pagamentos registrados)**
- **Propósito:** Registro de pagamentos recebidos (para conciliação futura)
- **Campos principais:**
  - `id` (UUID PK)
  - `user_id` (UUID FK → auth.users)
  - `payment_date` (DATE): data do pagamento
  - `amount` (NUMERIC): valor
  - `payment_method` (TEXT): método (PIX, boleto, etc.)
  - `has_proof` (BOOLEAN): se tem comprovante
  - `proof_file_path` (TEXT): path do comprovante
- **Uso:** Rastreamento de recebimentos

**21. `payment_allocations`**
- **Propósito:** Vínculo entre pagamentos e notas fiscais
- **Campos principais:**
  - `payment_id` (UUID FK → nfse_payments)
  - `nfse_id` (UUID FK → nfse_issued)
  - `allocated_amount` (NUMERIC): valor alocado
- **Uso:** Permite vincular pagamentos parciais a múltiplas notas

**22. `nfse_config`, `nfse_certificates`, `organization_nfse_config`**
- **Propósito:** Configurações de emissão de NFS-e (legado e organizacional)
- **Campos principais:** tokens FocusNFe, certificados A1, regime tributário, etc.
- **Uso:** Parametrização da integração com FocusNFe

### TABELAS DE PERMISSÕES (Sistema Novo - Pós FASE 11)

**23. `level_role_settings`**
- **Propósito:** Configurações de permissões por nível organizacional e role
- **Campos principais:**
  - `level_id` (UUID FK → organization_levels)
  - `role_type` (app_role): 'admin', 'psychologist', 'assistant', 'accountant'
  - `can_access_clinical` (BOOLEAN): acesso a dados clínicos
  - `financial_access` (TEXT): 'none', 'summary', 'full'
  - `can_access_marketing` (BOOLEAN): acesso a métricas de marketing
  - `can_access_whatsapp` (BOOLEAN): acesso ao WhatsApp integrado
  - `clinical_visible_to_superiors` (BOOLEAN): superiores veem dados clínicos
  - `peer_agenda_sharing`, `peer_clinical_sharing` (TEXT): compartilhamento horizontal
  - `can_edit_schedules` (BOOLEAN): pode editar agendas
  - `can_view_team_financial_summary` (BOOLEAN): vê resumo financeiro da equipe
  - `uses_org_company_for_nfse` (BOOLEAN): usa empresa da org ou própria para NF
- **Uso:** Define permissões granulares por nível e role

**24. `level_permission_sets`**
- **Propósito:** Permissões granulares por domínio e nível (LEGADO, em migração)
- **Campos principais:**
  - `level_id` (UUID FK → organization_levels)
  - `domain` (TEXT): 'clinical', 'financial', 'administrative'
  - `access_level` (TEXT): 'none', 'read', 'full'
- **Uso:** Sistema antigo de permissões, sendo substituído por `level_role_settings`

**25. `level_sharing_config`**
- **Propósito:** Configuração de compartilhamento de dados entre níveis
- **Campos principais:**
  - `level_id` (UUID FK → organization_levels)
  - `shared_domains` (TEXT[]): domínios compartilhados com pares do mesmo nível
- **Uso:** Compartilhamento horizontal (peers)

**26. `peer_sharing`**
- **Propósito:** Compartilhamento peer-to-peer entre usuários
- **Campos principais:**
  - `sharer_user_id`, `receiver_user_id` (UUID FK → auth.users)
  - `shared_domains` (TEXT[]): domínios compartilhados
  - `is_bidirectional` (BOOLEAN): se é recíproco
- **Uso:** Compartilhamento horizontal individual

### TABELAS DE LAYOUT (Persistência de UI)

**27. `user_layout_preferences`**
- **Propósito:** Layouts customizados de dashboards
- **Campos principais:**
  - `user_id` (UUID FK → auth.users)
  - `layout_type` (TEXT): 'dashboard', 'metrics-grid', 'metrics-charts-selection'
  - `layout_config` (JSONB): configuração completa do layout
  - `version` (INTEGER): versão do layout
- **Uso:** Persistência de layouts de cards (drag & drop, resize)

**28. `patient_overview_layouts`**
- **Propósito:** Layouts customizados da aba "Visão Geral" do paciente
- **Campos principais:**
  - `user_id` (UUID FK → auth.users)
  - `patient_id` (UUID FK → patients): layout específico para este paciente
  - `layout_json` (JSONB): grid completo
  - `version` (INTEGER): versão
- **Uso:** Personalização do layout de cards por paciente

**29. `layout_profiles`**
- **Propósito:** Templates de layout salvos
- **Campos principais:**
  - `user_id` (UUID FK → auth.users)
  - `profile_name` (TEXT): nome do template
  - `layout_configs` (JSONB): configs de múltiplos layouts
- **Uso:** Reutilização de layouts favoritos

### TABELAS DE CATÁLOGOS

**30. `cid_catalog`**
- **Propósito:** Catálogo completo de CID-10
- **Campos principais:**
  - `code` (TEXT): código CID (ex: 'F32.0')
  - `title` (TEXT): descrição
  - `group_code`, `group_name` (TEXT): grupo e categoria
- **Uso:** Autocompletar diagnósticos

**31. `cid_symptom_packs`**
- **Propósito:** Pacotes de sintomas pré-definidos por CID
- **Campos principais:**
  - `code` (TEXT FK → cid_catalog): código CID
  - `symptoms` (JSONB): array de sintomas
  - `specifiers` (JSONB): array de especificadores
- **Uso:** Sugestão automática de sintomas ao selecionar um CID

**32. `medication_catalog`**
- **Propósito:** Catálogo de medicações psiquiátricas
- **Campos principais:**
  - `class` (TEXT): classe farmacológica
  - `substance` (TEXT): substância ativa
  - `indications` (JSONB): indicações terapêuticas
  - `cid_codes` (TEXT[]): CIDs relacionados
- **Uso:** Autocompletar medicações

### TABELAS AUXILIARES

**33. `schedule_blocks`**
- **Propósito:** Bloqueios de agenda (férias, compromissos, etc.)
- **Campos principais:**
  - `user_id` (UUID FK → auth.users)
  - `day_of_week` (INTEGER): 0-6
  - `start_time`, `end_time` (TEXT): horários
  - `start_date`, `end_date` (DATE): período do bloqueio
  - `reason` (TEXT): motivo
- **Uso:** Cálculo de ocupação real da agenda

**34. `session_history`**
- **Propósito:** Histórico de reagendamentos
- **Campos principais:**
  - `patient_id` (UUID FK → patients)
  - `old_day`, `old_time`, `new_day`, `new_time` (TEXT)
  - `changed_at` (TIMESTAMPTZ)
- **Uso:** Auditoria de mudanças de horário

**35. `admin_access_log`**
- **Propósito:** Log de acessos administrativos (LGPD)
- **Campos principais:**
  - `admin_id` (UUID FK → auth.users)
  - `access_type` (TEXT): tipo de acesso
  - `accessed_patient_id`, `accessed_user_id` (UUID): quem foi acessado
  - `access_reason` (TEXT): justificativa
  - `ip_address`, `user_agent` (TEXT): metadados técnicos
  - `retention_until` (TIMESTAMPTZ): data de expiração do log
- **Uso:** Compliance LGPD, rastreabilidade de acessos sensíveis

**36. `consent_submissions`**
- **Propósito:** Submissões de consentimento LGPD
- **Campos principais:**
  - `patient_id` (UUID FK → patients)
  - `submission_type` (TEXT): tipo de consentimento
  - `accepted_at` (TIMESTAMPTZ)
  - `ip_address`, `user_agent` (TEXT): prova digital
  - `token` (UUID): token de acesso único
- **Uso:** Registro de consentimentos digitais

Entendeu o banco de dados completo? Confirme e vou para o Prompt 4 sobre estrutura frontend.
```

---

## 📁 Prompt 4 — Mapa de Diretórios e Arquivos Importantes (Frontend)

```
Excelente! Agora vamos mapear toda a estrutura de diretórios frontend do Mindware.

### ESTRUTURA COMPLETA DE src/

```
src/
├── components/          # Componentes reutilizáveis organizados por função
│   ├── ui/             # shadcn/ui base (button, card, dialog, etc.) - 40+ componentes
│   ├── cards/          # Cards de dashboards
│   │   └── metrics/    # Cards específicos de /metrics (financial, admin, marketing, team)
│   ├── charts/         # Componentes de gráficos
│   │   └── metrics/    # Gráficos específicos de /metrics (por domínio)
│   ├── clinical/       # Componentes clínicos
│   └── organogram/     # Componentes do organograma (drag & drop)
├── pages/              # 40+ páginas/rotas
├── hooks/              # 20+ custom hooks
├── lib/                # Bibliotecas, utilitários, registries
│   ├── templates/      # Sistema de templates clínicos
│   │   └── psychopathologyBasic/  # Template psicopatológico padrão
│   └── clinical/       # Validações e tipos clínicos
├── types/              # TypeScript types organizados por domínio
├── contexts/           # React Contexts (AuthContext principal)
└── integrations/       # Integrações externas
    └── supabase/       # Cliente e tipos (AUTO-GERADOS, NÃO EDITAR)
```

### PÁGINAS CRÍTICAS (src/pages/)

**1. `PatientDetail.tsx` (2497 linhas) - HUB DO PACIENTE**
- **Propósito:** Página central do paciente, ponto de entrada para tudo relacionado a ele
- **Abas:**
  - **Visão Geral:** grid customizável com 12 cards (TRACK C1)
  - **Evolução:** `ClinicalEvolution` com gráficos de funções psíquicas
  - **Sessões:** lista filtrada de sessões com status
  - **Arquivos:** `PatientFiles` com upload/download
- **Hooks principais:**
  - `usePatientOverviewLayout()`: gerencia layout da Visão Geral
  - `useEffectivePermissions()`: resolve permissões do usuário
  - `useCardPermissions()`: valida visibilidade de cada card
  - `useActiveClinicalTemplates()`: carrega templates clínicos ativos
- **Funcionalidades:**
  - Edição inline de sessões
  - Emissão de NFS-e
  - Marcação de pagamentos
  - Validação de acesso com `checkPatientAccessLevel()`

**2. `Metrics.tsx` (1245 linhas) - DASHBOARD DE MÉTRICAS**
- **Propósito:** Página de métricas com 4 domínios (Financial, Administrative, Marketing, Team)
- **Estrutura:**
  - **Seletor de Domínio:** Financial / Administrative / Marketing / Team (baseado em permissões)
  - **Grade de Cards Métricos:** cards numéricos (KPIs) em grid drag & drop
  - **Aba de Gráficos:** sub-abas por categoria (Distribuições, Desempenho, Tendências, Retenção)
- **Hooks principais:**
  - `useDashboardLayout('metrics-grid')`: gerencia layout dos cards métricos
  - `useMetricsChartsSelection()`: gerencia seleção de gráficos (persistida no Supabase)
  - `useChartTimeScale()`: determina escala temporal automática dos gráficos
  - `useTeamData()`: carrega IDs dos subordinados
  - `useOwnData()`: filtra dados próprios vs equipe
- **Queries complexas:**
  - Carrega patients, sessions, profiles, schedule_blocks
  - Calcula métricas via `systemMetricsUtils` e `teamMetricsCalculations`
  - Gera trends temporais com `getFinancialTrends()`
- **Funcionalidades:**
  - Filtro de período (semana, mês, ano, custom)
  - Toggle edit mode para reorganizar cards
  - Dialog de adicionar/remover cards
  - Dialog de adicionar/remover gráficos
  - Persistência automática com debounce

**3. `DashboardExample.tsx` (838 linhas) - DASHBOARD PERSONALIZÁVEL**
- **Propósito:** Dashboard geral do sistema (demonstração de funcionalidades)
- **Estrutura:** Seções colapsáveis com cards drag & drop
- **Seções padrão:**
  - `dashboard-financial`: Receita Esperada, Realizada, Valores Pendentes
  - `dashboard-administrative`: Pacientes Ativos, Sessões Esperadas, Realizadas
  - `dashboard-team`: cards de equipe (se tem subordinados)
- **Hooks principais:**
  - `useDashboardLayout()`: gerencia layout completo
  - `useDashboardPermissions()`: filtra cards por permissões
  - `useChartTimeScale()`: escalas de tempo para gráficos
  - `useOwnData()`, `useTeamData()`: separação de dados próprios vs equipe
- **Funcionalidades:**
  - Seções colapsáveis
  - Charts com escala temporal configurável
  - Filtro de período global

**4. `Patients.tsx` - LISTAGEM DE PACIENTES**
- **Propósito:** Lista todos os pacientes do terapeuta
- **Funcionalidades:** filtros, busca, ordenação, criação

**5. `Schedule.tsx` - AGENDA**
- **Propósito:** Visualização de agenda semanal com drag & drop de sessões

**6. `Financial.tsx` - VISÃO FINANCEIRA GERAL**
- **Propósito:** Dashboards e relatórios financeiros (página legada, substituída por /metrics)

**7. `Organogram.tsx` - ORGANOGRAMA**
- **Propósito:** Visualização e edição da hierarquia organizacional
- **Componente principal:** `OrganogramView` (drag & drop de posições e usuários)

**8. Formulários Clínicos:**
- `ClinicalComplaintForm.tsx`: cadastro de queixa clínica
- `SessionEvaluationForm.tsx`: avaliação de sessão (12 funções psíquicas)

**9. Gerenciamento:**
- `LevelPermissionsManagement.tsx`: configuração de permissões por nível
- `TeamManagement.tsx`: gestão de equipe e subordinados
- `NFSeConfig.tsx`: configuração de emissão de notas fiscais

### COMPONENTES CRÍTICOS (src/components/)

**GridCardContainer.tsx:**
- Wrapper que renderiza grid de cards usando `react-grid-layout`
- Props: `layout`, `onLayoutChange`, `children`, `isEditMode`
- Suporta drag & drop e resize
- Grid de 12 colunas responsivo

**MetricsAddCardDialog.tsx:**
- Dialog para adicionar/remover cards na página /metrics
- Filtra cards por domínio e permissões
- Integrado com `useDashboardLayout`

**AddCardDialog.tsx:**
- Dialog genérico para adicionar cards em dashboards
- Usado em DashboardExample e outras páginas

**ClinicalEvolution.tsx (2192 linhas):**
- Componente MASSIVO que exibe evolução do paciente
- **Sub-abas:**
  - Sessões: lista de sessões realizadas
  - Interpretação: resumo textual da última avaliação
  - Gráficos: visualizações temporais das funções psíquicas
- **Gráficos gerados:**
  - LineChart: evolução temporal de cada função
  - RadarChart: snapshot multidimensional
  - PieChart: distribuições de categorias
- **Templates:** usa `activeRoleTemplate.evolutionInterpreter` para gerar texto interpretativo

**ResizableCard.tsx, ResizableSection.tsx:**
- Wrappers para cards com resize horizontal
- Usados em dashboards antigos (pré-grid-layout)

**Organogram Components:**
- `OrganogramView.tsx`: view principal do organograma
- `OrganogramNode.tsx`: nó individual (posição)
- `UserTag.tsx`: tag de usuário arrastável
- Usa `@dnd-kit` para drag & drop

### HOOKS CRÍTICOS (src/hooks/)

**Layouts:**
- `useDashboardLayout.ts`: gerencia layouts de dashboards (Supabase + localStorage)
- `usePatientOverviewLayout.ts`: gerencia layout da Visão Geral do paciente
- `useMetricsChartsSelection.ts`: gerencia seleção de gráficos em /metrics

**Dados:**
- `useTeamData.ts`: retorna `subordinateIds` (array de IDs dos subordinados)
- `useOwnData.ts`: filtra dados próprios vs equipe
- `useOrganogramData.ts`: carrega dados do organograma

**Permissões:**
- `useEffectivePermissions.ts`: carrega permissões efetivas do usuário
- `useCardPermissions.ts`: valida visibilidade de cards específicos
- `useDashboardPermissions.ts`: permissões de dashboards

**Utilitários:**
- `useChartTimeScale.ts`: determina escala temporal automática (dia, semana, mês)
- `useActiveClinicalTemplates.ts`: resolve templates clínicos ativos do usuário

### REGISTRIES (src/lib/)

**metricsCardRegistry.tsx:**
- Mapeia cardId → componente React para cards métricos
- Define metadados: título, descrição, domínio, layout padrão
- Função: `getMetricsCardById()`, `getMetricsCardsByDomain()`, `canUserViewCard()`

**metricsChartsRegistry.tsx:**
- Mapeia chartId → componente React para gráficos de métricas
- Define: domínio, sub-aba, categoria, `buildProps()` (factory de props)
- Função: `getMetricsChartById()`, `getChartsByDomainAndSubTab()`
- **buildProps():** recebe `MetricsChartPropsContext` e retorna props específicas do chart

**dashboardCardRegistry.tsx:**
- Mapeia cardId → componente React para cards do DashboardExample
- Componentes inline (não arquivos separados)

**patientOverviewCardRegistry.tsx:**
- Mapeia cardId → componente React para cards da Visão Geral do paciente
- 12 cards MVP: financial (3), clinical (3), administrative (6)

**templateRegistry.ts:**
- Mapeia templateId → `ClinicalTemplate`
- Define templates disponíveis: `psychology_basic`, `tcc` (stub)
- Mapeamentos: `ROLE_TO_TEMPLATE`, `APPROACH_TO_TEMPLATE`

### UTILITÁRIOS CRÍTICOS (src/lib/)

**systemMetricsUtils.ts (1243 linhas):**
- Todas as funções de cálculo de métricas
- Funções principais:
  - `getFinancialSummary()`: sumário financeiro do período
  - `getFinancialTrends()`: séries temporais
  - `getRetentionAndChurn()`: métricas de retenção
  - `calculateOccupationRate()`: taxa de ocupação
- Lida com pacientes mensalistas (conta 1x por mês)
- Filtra sessões ocultas (`show_in_schedule = false`)

**teamMetricsCalculations.ts:**
- Cálculos de métricas de equipe (agregação)
- `getTeamMetricsSummary()`: sumário completo de equipe
- `calculateRevenueByTherapist()`: receita por terapeuta
- `calculateTeamOccupation()`: ocupação agregada

**resolveEffectivePermissions.ts:**
- **Fonte única da verdade** para permissões
- `resolveEffectivePermissions(userId)`: retorna objeto `EffectivePermissions`
- Consulta: `level_role_settings`, `user_positions`, `organization_hierarchy_info`
- Retorna flags: `canAccessClinical`, `financialAccess`, `canAccessMarketing`, etc.

Entendeu a estrutura de arquivos? Confirme e vou para o Prompt 5 sobre hooks e registries.
```

---

## 🪝 Prompt 5 — Hooks Críticos, Registries e Fluxos de Dados

**[TEXTO PARA COLAR EM UM NOVO CHAT]**

```
Agora vou explicar o MOTOR INTERNO do Mindware: como os dados fluem através de hooks React customizados, como os registries organizam componentes, e como tudo isso se integra para criar as páginas funcionais.

### ARQUITETURA DE FLUXO DE DADOS

O Mindware segue um padrão de fluxo unidirecional:

**Supabase DB → Hooks → Registries → Componentes → UI**

1. **Supabase DB:** fonte única da verdade (multi-tenant, RLS aplicado)
2. **Hooks:** camada de abstração que query o DB, transforma dados, calcula métricas
3. **Registries:** mapeamento centralizado de IDs → componentes + metadados
4. **Componentes:** UI inteligente que consome hooks
5. **UI:** Renderização final no navegador

### HOOKS CRÍTICOS DE LAYOUT E PERSISTÊNCIA

#### **useDashboardLayout** (src/hooks/useDashboardLayout.ts)

**Propósito:** Hook universal para gerenciar layouts customizáveis de dashboards com drag & drop.

**Interface completa:**
```typescript
const {
  layout,              // Layout[] atual (items com x, y, w, h)
  loading,             // boolean: carregando do Supabase?
  saving,              // boolean: salvando no Supabase?
  isModified,          // boolean: layout foi modificado desde o load?
  hasUnsavedChanges,   // boolean: há mudanças pendentes de save?
  updateCardWidth,     // (cardId, newWidth) => void
  updateCardOrder,     // (newLayout: Layout[]) => void
  saveLayout,          // () => Promise<void> - salvar manualmente
  resetLayout          // () => Promise<void> - resetar para defaultLayout
} = useDashboardLayout(layoutType: string, defaultLayout: Layout[]);
```

**Fluxo interno:**
1. **Load:** Query `user_layout_preferences` WHERE `user_id = auth.uid()` AND `layout_type = layoutType`
2. Se encontrar → parse `layout_config.items` e set como estado
3. Se não encontrar → usa `defaultLayout` fornecido
4. **Update:** Quando usuário arrasta/redimensiona, `updateCardOrder` é chamado
5. **Auto-save:** Debounced 500ms → `UPDATE user_layout_preferences SET layout_config = ...`
6. **Optimistic UI:** Estado local atualiza imediatamente, save é async

**Padrão de uso em Metrics.tsx:**
```typescript
const defaultLayoutMetrics = [
  { i: 'metrics-revenue-total', x: 0, y: 0, w: 4, h: 2 },
  { i: 'metrics-avg-per-session', x: 4, y: 0, w: 4, h: 2 },
  // ... mais cards
];

const { layout, updateCardOrder } = useDashboardLayout('metrics-grid', defaultLayoutMetrics);

<GridCardContainer
  layout={layout}
  cards={metricsCards}
  onLayoutChange={updateCardOrder}  // Chamado automaticamente por react-grid-layout
/>
```

**Persistência no Supabase:**
```sql
-- Estrutura da linha salva
INSERT INTO user_layout_preferences (user_id, layout_type, layout_config, version)
VALUES (
  'uuid-do-usuario',
  'metrics-grid',
  '{"items": [{"i": "metrics-revenue-total", "x": 0, "y": 0, "w": 4, "h": 2}, ...]}',
  1
);
```

#### **useMetricsChartsSelection** (src/hooks/useMetricsChartsSelection.ts)

**Propósito:** Gerenciar quais gráficos estão selecionados/visíveis na aba de Gráficos do Metrics.tsx.

**Interface:**
```typescript
const {
  selectedCharts,        // Set<string> de IDs selecionados
  isLoading,             // boolean
  toggleChart,           // (chartId: string) => void
  toggleCategory,        // (category: string, domain: string) => void
  isChartSelected        // (chartId: string) => boolean
} = useMetricsChartsSelection();
```

**Fluxo:**
1. Load de `user_layout_preferences` com `layout_type = 'metrics-charts-selection'`
2. Parse `layout_config.selectedChartIds` → Set
3. `toggleChart(id)`: adiciona ou remove ID do Set
4. Auto-save debounced → UPDATE no Supabase
5. Metrics.tsx filtra `metricsChartsRegistry` apenas por IDs selecionados

**Uso em Metrics.tsx:**
```typescript
const { selectedCharts, toggleChart } = useMetricsChartsSelection();

// Filtrar gráficos
const chartsToRender = Object.values(METRICS_CHARTS_REGISTRY)
  .filter(chart => selectedCharts.has(chart.id));

// Renderizar
chartsToRender.map(chart => {
  const props = chart.buildProps(propsContext);
  return <chart.component key={chart.id} {...props} />;
});
```

#### **usePatientOverviewLayout** (src/hooks/usePatientOverviewLayout.ts)

Similar a `useDashboardLayout`, mas específico para PatientDetail.tsx aba Overview. Permite customizar layout de cards específicos do paciente.

### HOOKS DE DADOS FINANCEIROS

#### **useFinancialSummary** (src/hooks/financial/useFinancialSummary.ts)

**Propósito:** Fornecer métricas financeiras agregadas do período.

**Interface:**
```typescript
const {
  totalRevenue,           // number: receita total
  avgPerSession,          // number: receita / sessões attended
  forecastRevenue,        // number: previsão baseada em pacientes ativos
  avgPerActivePatient,    // number: receita / pacientes únicos
  lostRevenue,            // number: soma de sessões missed/cancelled
  comparisonWithPrevious, // objeto com % de mudança vs período anterior
  isLoading,
  error
} = useFinancialSummary(dateRange, userId?);
```

**Lógica interna (via systemMetricsUtils.ts):**

**1. Query sessões do período:**
```typescript
const { data: sessions } = await supabase
  .from('sessions')
  .select('*, patients!inner(user_id, status)')
  .gte('date', dateRange.from)
  .lte('date', dateRange.to)
  .eq('organization_id', currentOrgId);

// Se userId fornecido, filtrar por pacientes desse terapeuta
if (userId) {
  filteredSessions = sessions.filter(s => s.patients.user_id === userId);
}
```

**2. Calcular métricas:**
```typescript
// Total Revenue
const attendedSessions = sessions.filter(s => s.status === 'attended');
totalRevenue = attendedSessions.reduce((sum, s) => sum + s.value, 0);

// Avg per Session
avgPerSession = totalRevenue / attendedSessions.length;

// Forecast Revenue (baseado em pacientes ativos)
const activePatients = await supabase.from('patients')
  .select('*')
  .eq('status', 'active')
  .eq('user_id', userId);

forecastRevenue = activePatients.reduce((sum, p) => {
  // Se mensalista: 1x session_value
  // Se não: frequência × session_value × semanas no período
  return sum + calculateExpectedRevenue(p, dateRange);
}, 0);

// Lost Revenue
const missedSessions = sessions.filter(s => s.status IN ('missed', 'cancelled'));
lostRevenue = missedSessions.reduce((sum, s) => sum + s.value, 0);
```

**3. Comparação com período anterior:**
```typescript
const previousDateRange = {
  from: subDays(dateRange.from, daysBetween),
  to: subDays(dateRange.to, daysBetween)
};

const previousMetrics = await calculateMetrics(previousDateRange);

comparisonWithPrevious = {
  totalRevenue: {
    value: totalRevenue - previousMetrics.totalRevenue,
    percentChange: ((totalRevenue / previousMetrics.totalRevenue) - 1) * 100
  },
  // ... para cada métrica
};
```

**Observações importantes:**
- **Pacientes mensalistas:** sistema conta apenas 1 sessão por mês (campo `monthly_price = true`)
- **Sessões ocultas:** `show_in_schedule = false` são ignoradas nos cálculos
- **Multi-tenant:** sempre filtra por `organization_id = current_user_organization()`

#### **useRevenueTrends** (src/hooks/financial/useRevenueTrends.ts)

Retorna série temporal para gráfico de linha:
```typescript
const { data } = useRevenueTrends(dateRange, userId);
// data: Array<{ date: string, revenue: number, sessions: number }>

// Agrupamento automático:
// - Período ≤ 31 dias → agrupar por dia
// - Período ≤ 90 dias → agrupar por semana
// - Período > 90 dias → agrupar por mês
```

### HOOKS DE DADOS DE EQUIPE (TEAM METRICS)

#### **useTeamMetrics** (src/hooks/team/useTeamMetrics.ts)

**Propósito:** Métricas agregadas da equipe do usuário logado.

**Conceito de "Equipe":**
- Se usuário é gestor → equipe = todos os subordinados recursivamente (`get_all_subordinates()`)
- Se usuário é terapeuta sem subordinados → equipe = apenas ele mesmo
- Hierarquia vem do organograma (níveis → posições → usuários)

**Interface:**
```typescript
const {
  teamTotalRevenue,            // number
  teamActivePatientsCount,     // number
  teamSessionsCount,           // number
  avgRevenuePerTherapist,      // number
  teamAttendanceRate,          // number (% de comparecimento)
  avgOccupationRate,           // number (% de slots ocupados)
  avgTicket,                   // number (valor médio por sessão)
  breakdown: {
    byTherapist: Array<{ userId, name, revenue, patients, sessions }>,
    byWeek: Array<{ week, revenue, sessions }>
  },
  isLoading,
  error
} = useTeamMetrics(dateRange, selectedUserIds?);
```

**Fluxo interno:**
```typescript
// 1. Identificar subordinados
const { data: subordinates } = await supabase.rpc('get_all_subordinates', {
  _user_id: auth.uid()
});
const subordinateIds = subordinates.map(s => s.subordinate_user_id);
subordinateIds.push(auth.uid()); // incluir o próprio

// Se selectedUserIds fornecido, filtrar apenas esses
const teamIds = selectedUserIds || subordinateIds;

// 2. Query sessões da equipe
const { data: sessions } = await supabase
  .from('sessions')
  .select('*, patients!inner(user_id, name)')
  .in('patients.user_id', teamIds)
  .gte('date', dateRange.from)
  .lte('date', dateRange.to);

// 3. Calcular métricas agregadas (via teamMetricsCalculations.ts)
const metrics = getTeamMetricsSummary(sessions, profiles, scheduleBlocks, dateRange);

// 4. Breakdown por terapeuta
const byTherapist = teamIds.map(id => {
  const therapistSessions = sessions.filter(s => s.patients.user_id === id);
  return {
    userId: id,
    name: profiles.find(p => p.id === id).full_name,
    revenue: sum(therapistSessions.filter(s => s.status === 'attended').map(s => s.value)),
    patients: new Set(therapistSessions.map(s => s.patient_id)).size,
    sessions: therapistSessions.filter(s => s.status === 'attended').length
  };
});
```

**Cálculo de Taxa de Ocupação da Equipe:**
```typescript
// Para cada terapeuta:
// 1. Obter work_days, work_start_time, work_end_time, slot_duration, break_time do profile
// 2. Calcular slots disponíveis no período
const availableSlots = calculateAvailableSlotsForTherapist(profile, dateRange, scheduleBlocks);

// 3. Contar sessões attended no período
const filledSlots = sessions.filter(s => s.status === 'attended').length;

// 4. Ocupação do terapeuta = filledSlots / availableSlots
const occupationRate = (filledSlots / availableSlots) * 100;

// 5. Média da equipe
avgOccupationRate = mean(teamMembers.map(m => m.occupationRate));
```

#### **useOrganogramData** (src/hooks/useOrganogramData.ts)

**Propósito:** Carregar e gerenciar dados completos do organograma.

**Interface:**
```typescript
const {
  organizationTree,      // OrganogramNode[] - árvore hierárquica
  levelPermissions,      // LevelPermission[] - permissões por nível
  isLoading,
  // Mutations:
  movePosition,          // (positionId, newParentId) => Promise<void>
  assignUser,            // (userId, positionId) => Promise<void>
  renamePosition,        // (positionId, newName) => Promise<void>
  createPosition,        // (levelId, name, parentId) => Promise<void>
  deletePosition         // (positionId) => Promise<void>
} = useOrganogramData();
```

**Estrutura OrganogramNode:**
```typescript
interface OrganogramNode {
  position_id: string;
  position_name: string;
  level_id: string;
  level_name: string;
  level_number: number;
  users: Array<{
    user_id: string;
    full_name: string;
  }>;
  children: OrganogramNode[];  // Recursivo
}
```

**Construção da árvore (lógica interna):**
```typescript
// 1. Query todos os níveis da organização
const { data: levels } = await supabase
  .from('organization_levels')
  .select('*')
  .eq('organization_id', currentOrgId)
  .order('level_number');

// 2. Query todas as posições
const { data: positions } = await supabase
  .from('organization_positions')
  .select('*')
  .in('level_id', levels.map(l => l.id));

// 3. Query todas as associações user → position
const { data: userPositions } = await supabase
  .from('user_positions')
  .select('*, profiles(full_name)');

// 4. Construir árvore recursivamente
function buildTree(parentId: string | null, levelId: string): OrganogramNode[] {
  const children = positions
    .filter(p => p.parent_position_id === parentId && p.level_id === levelId)
    .map(pos => ({
      position_id: pos.id,
      position_name: pos.position_name,
      level_id: pos.level_id,
      level_name: levels.find(l => l.id === pos.level_id).level_name,
      level_number: levels.find(l => l.id === pos.level_id).level_number,
      users: userPositions
        .filter(up => up.position_id === pos.id)
        .map(up => ({ user_id: up.user_id, full_name: up.profiles.full_name })),
      children: buildTree(pos.id, pos.level_id) // Recursivo
    }));
  return children;
}

// 5. Começar do topo (level_number = 1, parent = null)
const tree = buildTree(null, levels[0].id);
```

### REGISTRIES: ARQUITETURA DETALHADA

#### **metricsCardRegistry.tsx** (src/lib/metricsCardRegistry.tsx)

**Propósito:** Mapear IDs de cards métricos para componentes React + metadados.

**Estrutura completa de uma definição:**
```typescript
export interface MetricsCardDefinition {
  id: string;                    // ex: 'metrics-revenue-total'
  title: string;                 // ex: 'Receita Total'
  description: string;           // ex: 'Receita total realizada no período'
  domain: 'financial' | 'administrative' | 'marketing' | 'team';
  component: ComponentType<MetricsCardBaseProps>;  // Componente React
  defaultLayout: {
    x: number,  // Posição X no grid (0-11, grid de 12 colunas)
    y: number,  // Posição Y no grid (0-∞)
    w: number,  // Largura em colunas (1-12)
    h: number,  // Altura em unidades (1 unidade ≈ 100px)
    minW?: number, maxW?: number,  // Limites de resize
    minH?: number, maxH?: number
  };
  requiredPermission?: 'financial_access' | 'administrative_access' | 'marketing_access' | 'team_access';
}
```

**Inventário completo de cards (19 cards):**

**Financial (5):**
1. `metrics-revenue-total` — Receita total realizada
2. `metrics-avg-per-session` — Valor médio por sessão
3. `metrics-forecast-revenue` — Receita prevista (forecast)
4. `metrics-avg-per-active-patient` — Receita média por paciente ativo
5. `metrics-lost-revenue` — Receita perdida (faltas + cancelamentos)

**Administrative (3):**
6. `metrics-active-patients` — Total de pacientes ativos
7. `metrics-occupation-rate` — Taxa de ocupação da agenda
8. `metrics-missed-rate` — Taxa de faltas

**Marketing (4):**
9. `metrics-website-visitors` — Visitantes únicos (MOCK)
10. `metrics-website-views` — Visualizações de páginas (MOCK)
11. `metrics-website-ctr` — CTR - Taxa de cliques (MOCK)
12. `metrics-website-conversion` — Taxa de conversão (MOCK)

**Team (7):**
13. `metrics-team-total-revenue` — Receita total da equipe
14. `metrics-team-active-patients` — Pacientes ativos da equipe
15. `metrics-team-sessions` — Sessões realizadas pela equipe
16. `metrics-team-average-revenue-per-therapist` — Faturamento médio por terapeuta
17. `metrics-team-attendance-rate` — Taxa de comparecimento da equipe
18. `metrics-team-average-occupation-rate` — Ocupação média da equipe
19. `metrics-team-average-ticket` — Ticket médio da equipe

**Funções helper:**
```typescript
// Buscar card por ID
const card = getMetricsCardById('metrics-revenue-total');

// Listar cards de um domínio
const financialCards = getMetricsCardsByDomain('financial');

// Validar permissão de um usuário para um card
const canView = canUserViewCard('metrics-revenue-total', ['financial_access', 'team_access']);
// retorna true (card requer financial_access, usuário tem)
```

**Uso em Metrics.tsx:**
```typescript
// 1. Obter cards do domínio ativo
const domainCards = getMetricsCardsByDomain(activeDomain); // 'financial', 'team', etc.

// 2. Filtrar por permissões do usuário
const { permissions } = useEffectivePermissions();
const visibleCards = domainCards.filter(card =>
  canUserViewCard(card.id, permissions)
);

// 3. Renderizar
visibleCards.map(cardDef => {
  const CardComponent = cardDef.component;
  return (
    <GridCardContainer.Item key={cardDef.id} id={cardDef.id}>
      <CardComponent
        dateRange={dateRange}
        userId={selectedUserId}
      />
    </GridCardContainer.Item>
  );
});
```

#### **metricsChartsRegistry.tsx** (src/lib/metricsChartsRegistry.tsx)

**Propósito:** Mapear IDs de gráficos para componentes + sistema dinâmico de props via `buildProps`.

**Estrutura de uma definição:**
```typescript
export interface MetricsChartDefinition {
  id: string;                    // ex: 'revenue-over-time'
  title: string;                 // ex: 'Receita ao Longo do Tempo'
  description: string;           // ex: 'Evolução da receita no período'
  domain: 'financial' | 'administrative' | 'clinical' | 'team';
  category: 'overview' | 'trends' | 'distribution' | 'composition';
  component: ComponentType<any>; // Componente do gráfico (Recharts)
  buildProps: (context: MetricsChartPropsContext) => Record<string, any>;
  order: number;                 // Ordem de exibição
  requiredPermission?: string;
}

interface MetricsChartPropsContext {
  dateRange: { from: Date, to: Date };
  userId?: string;
  selectedUserIds?: string[];    // Para filtros de equipe
  organizationId: string;
  // Outros contextos futuros
}
```

**Sistema buildProps — O Coração da Flexibilidade:**

`buildProps` é uma **factory function** que:
1. Recebe contexto global (período, filtros, userId)
2. Executa lógica condicional
3. Retorna props específicas para aquele gráfico

**Exemplo real:**
```typescript
'revenue-over-time': {
  id: 'revenue-over-time',
  component: RevenueOverTimeChart,
  buildProps: (context) => {
    // Lógica: período longo? Agrupar por semana em vez de dia
    const daysBetween = differenceInDays(context.dateRange.to, context.dateRange.from);
    const groupBy = daysBetween > 90 ? 'week' : 'day';
    
    return {
      dateRange: context.dateRange,
      userId: context.userId,
      groupBy,
      showComparison: daysBetween <= 31  // Só mostrar comparação se ≤ 31 dias
    };
  },
  // ...
}
```

**Categorias de gráficos:**
- **overview:** Visão geral resumida do domínio
- **trends:** Evoluções temporais (linhas, áreas)
- **distribution:** Comparações entre entidades (barras, radar)
- **composition:** Composição de valores (pie, treemap, stacked bars)

**Uso em Metrics.tsx:**
```typescript
const propsContext: MetricsChartPropsContext = {
  dateRange,
  userId: selectedUserId,
  selectedUserIds,
  organizationId: currentOrgId
};

// Filtrar gráficos
const allCharts = Object.values(METRICS_CHARTS_REGISTRY)
  .filter(chart => chart.domain === activeDomain);

const { selectedCharts } = useMetricsChartsSelection();
const chartsToRender = allCharts
  .filter(chart => selectedCharts.has(chart.id))
  .sort((a, b) => a.order - b.order);

// Agrupar por categoria
const chartsByCategory = groupBy(chartsToRender, 'category');

// Renderizar tabs
<Tabs>
  {Object.entries(chartsByCategory).map(([category, charts]) => (
    <TabsContent key={category} value={category}>
      <div className="grid gap-6">
        {charts.map(chart => {
          // buildProps é chamado aqui, dinamicamente
          const props = chart.buildProps(propsContext);
          const ChartComponent = chart.component;
          
          return (
            <ChartComponent key={chart.id} {...props} />
          );
        })}
      </div>
    </TabsContent>
  ))}
</Tabs>
```

### FLUXO COMPLETO DE DADOS: EXEMPLO REAL

**Cenário:** Usuário abre `/metrics`, seleciona período 01-30 Nov, domínio "financial".

**Passo a passo:**

1. **Metrics.tsx monta:**
   ```typescript
   const [dateRange] = useState({ from: new Date('2024-11-01'), to: new Date('2024-11-30') });
   const [activeDomain] = useState('financial');
   ```

2. **useDashboardLayout carrega layout:**
   ```typescript
   const { layout } = useDashboardLayout('metrics-grid', defaultLayoutMetrics);
   // Query: SELECT layout_config FROM user_layout_preferences WHERE user_id = ? AND layout_type = 'metrics-grid'
   // Retorna: layout salvo ou usa defaultLayoutMetrics
   ```

3. **Renderização de cards:**
   ```typescript
   const cards = getMetricsCardsByDomain('financial');
   // Retorna: 5 cards (revenue-total, avg-per-session, forecast, avg-per-patient, lost)
   
   cards.map(card => <card.component dateRange={dateRange} />);
   ```

4. **Dentro de MetricsRevenueTotalCard:**
   ```typescript
   const { totalRevenue, comparisonWithPrevious } = useFinancialSummary(dateRange);
   
   // useFinancialSummary executa:
   // - Query sessions no período
   // - Filtra status = 'attended'
   // - Soma values
   // - Calcula comparação com período anterior
   // - Retorna: { totalRevenue: 45000, comparisonWithPrevious: { percentChange: +12.5 } }
   
   return (
     <Card>
       <CardTitle>Receita Total</CardTitle>
       <div className="text-3xl">R$ 45.000,00</div>
       <div className="text-green-600">↑ 12.5% vs período anterior</div>
     </Card>
   );
   ```

5. **Usuário clica na tab "Gráficos":**
   ```typescript
   const { selectedCharts } = useMetricsChartsSelection();
   // Query: SELECT layout_config FROM user_layout_preferences WHERE layout_type = 'metrics-charts-selection'
   // Retorna Set: {'revenue-over-time', 'revenue-by-therapist', ...}
   
   const chartsToRender = Object.values(METRICS_CHARTS_REGISTRY)
     .filter(c => c.domain === 'financial' && selectedCharts.has(c.id));
   
   chartsToRender.map(chart => {
     const props = chart.buildProps({ dateRange, userId: null, organizationId });
     return <chart.component {...props} />;
   });
   ```

6. **RevenueOverTimeChart renderiza:**
   ```typescript
   // Props recebidas via buildProps: { dateRange, groupBy: 'day' }
   const { data } = useRevenueTrends(dateRange, groupBy);
   // Query series temporal agrupada por dia
   // Retorna: [{ date: '2024-11-01', revenue: 1500 }, { date: '2024-11-02', revenue: 1800 }, ...]
   
   return (
     <ResponsiveContainer>
       <LineChart data={data}>
         <XAxis dataKey="date" />
         <YAxis />
         <Line dataKey="revenue" stroke="hsl(var(--primary))" />
       </LineChart>
     </ResponsiveContainer>
   );
   ```

7. **Usuário arrasta um card:**
   ```typescript
   // GridCardContainer detecta via react-grid-layout
   onLayoutChange(newLayout);
   
   // useDashboardLayout recebe
   updateCardOrder(newLayout);
   
   // Debounce 500ms
   // UPDATE user_layout_preferences SET layout_config = newLayout WHERE ...
   
   // UI atualiza imediatamente (optimistic)
   ```

### INTEGRAÇÃO ENTRE HOOKS, REGISTRIES E COMPONENTES

**Padrão "Adicionar novo card métrico":**

1. **Criar componente do card** (ex: `MetricsNewKpiCard.tsx`):
   ```typescript
   export const MetricsNewKpiCard: React.FC<MetricsCardBaseProps> = ({ dateRange, userId }) => {
     const { newKpiValue } = useNewKpiData(dateRange, userId);
     return <Card>...</Card>;
   };
   ```

2. **Adicionar ao registry** (`metricsCardRegistry.tsx`):
   ```typescript
   'metrics-new-kpi': {
     id: 'metrics-new-kpi',
     title: 'Novo KPI',
     description: 'Descrição do novo KPI',
     domain: 'financial',
     component: MetricsNewKpiCard,
     defaultLayout: { x: 0, y: 4, w: 4, h: 2 },
     requiredPermission: 'financial_access'
   }
   ```

3. **Usar em qualquer dashboard:**
   ```typescript
   // Metrics.tsx automaticamente lista o novo card
   const cards = getMetricsCardsByDomain('financial');
   // Agora inclui 'metrics-new-kpi'
   ```

**Padrão "Adicionar novo gráfico":**

1. **Criar componente do gráfico** (ex: `NewTrendChart.tsx`):
   ```typescript
   interface NewTrendChartProps {
     dateRange: DateRange;
     userId?: string;
   }
   
   export const NewTrendChart: React.FC<NewTrendChartProps> = ({ dateRange, userId }) => {
     const { data } = useNewTrendData(dateRange, userId);
     return <LineChart data={data}>...</LineChart>;
   };
   ```

2. **Adicionar ao registry** (`metricsChartsRegistry.tsx`):
   ```typescript
   'new-trend': {
     id: 'new-trend',
     title: 'Nova Tendência',
     description: 'Análise de tendência X',
     domain: 'financial',
     category: 'trends',
     component: NewTrendChart,
     buildProps: (context) => ({
       dateRange: context.dateRange,
       userId: context.userId
     }),
     order: 10,
     requiredPermission: 'financial_access'
   }
   ```

3. **Disponível automaticamente:**
   - Metrics.tsx lista o gráfico
   - Usuário pode selecionar via MetricsAddCardDialog
   - Seleção persiste via useMetricsChartsSelection

**Este Prompt te deu o "motor interno" do sistema. Você agora entende como dados fluem desde o Supabase, passam por hooks, são organizados via registries, e chegam aos componentes React.**

Compreendeu o fluxo de dados e hooks? Confirme e vamos para o Prompt 6 sobre Módulos Funcionais.
```

---

## 📦 Prompt 6 — Módulos Funcionais: Clínico, Financeiro, Administrativo, Marketing, Team

**[TEXTO PARA COLAR EM UM NOVO CHAT]**

```
Agora vou mapear os MÓDULOS FUNCIONAIS do Mindware: como cada domínio (clínico, financeiro, administrativo, marketing, team) se manifesta na UI, nos dados, e nas decisões de negócio.

### CONCEITO DE "DOMÍNIOS"

O Mindware é organizado em 5 domínios principais:

1. **Clinical** — Atendimento psicológico, prontuários, evoluções, templates
2. **Financial** — Receita, faturamento, forecasting, NFSe
3. **Administrative** — Gestão operacional, pacientes, agenda, ocupação
4. **Marketing** — Aquisição, conversão, site (parcialmente implementado)
5. **Team** — Gestão de equipe, hierarquia, métricas agregadas

Cada domínio tem:
- **Páginas** específicas
- **Cards métricos** dedicados
- **Gráficos** de análise
- **Hooks** de dados
- **Tabelas** no banco
- **Permissões** de acesso

### DOMÍNIO CLINICAL (Clínico)

**Propósito:** Gerenciar o processo terapêutico completo, desde cadastro do paciente até alta, incluindo registro de evoluções clínicas.

**Páginas principais:**
- `PatientDetail.tsx` — Visão 360° do paciente (tab Evolução, Sessões, Documentos)
- `ClinicalEvolution.tsx` — Interface de registro de evolução clínica
- `Patients.tsx` — Listagem e gestão de pacientes

**Tabelas do banco:**
- `patients` — Cadastro de pacientes (nome, CPF, frequência, status, valor)
- `sessions` — Registro de sessões (data, status: scheduled/attended/missed/cancelled)
- `clinical_complaints` — Queixas clínicas (CID, diagnóstico, severidade)
- `complaint_symptoms`, `complaint_specifiers`, `complaint_medications` — Detalhes das queixas
- `session_evaluations` — Avaliações psicológicas estruturadas (exame do estado mental)
- `patient_files` — Arquivos anexados aos pacientes (storage bucket)
- `consent_submissions` — Consentimentos LGPD

**Fluxo clínico completo:**

1. **Cadastro do Paciente:**
   - Página: `Patients.tsx` → botão "Novo Paciente"
   - Dialog: `PatientFormDialog.tsx`
   - Dados coletados: nome, CPF, email, telefone, frequência (semanal/quinzenal/mensal), valor da sessão, data de início
   - Para menores: campos de responsável (guardian_name, guardian_cpf, guardian_phone)
   - Validação: CPF via função `validate_cpf()` (dígitos verificadores)
   - Insert: `INSERT INTO patients (...) VALUES (...)`

2. **Agendamento de Sessões:**
   - Página: `Schedule.tsx` ou `PatientDetail.tsx` tab Sessões
   - Sistema pode criar sessões automaticamente baseado em:
     - `session_day` (ex: "Segunda-feira")
     - `session_time` (ex: "14:00")
     - `frequency` (semanal/quinzenal/mensal)
   - Ou criação manual via `SessionFormDialog`
   - Insert: `INSERT INTO sessions (patient_id, date, time, value, status) VALUES (...)`
   - Status inicial: `'scheduled'`

3. **Registro de Evolução Clínica:**
   - **Quando?** Após sessão realizada (status = 'attended')
   - **Onde?** `ClinicalEvolution.tsx` ou `PatientDetail.tsx` tab Evolução
   - **Sistema de Templates:**
     - `templateRegistry.ts` define templates disponíveis por abordagem clínica
     - Templates pré-definidos: `psychology_basic` (genérico), `tcc` (TCC), etc.
     - Usuário seleciona template → sistema renderiza campos dinamicamente
     - Campos comuns: queixa principal, objetivos da sessão, intervenções, humor, próximos passos
   - **Salvamento:**
     - Notas são salvas como JSON em tabela dedicada (possivelmente `session_evaluations` ou tabela futura)
     - Vinculadas a `session_id`
   - **Visualização:**
     - Timeline de evoluções em PatientDetail tab Evolução
     - Ordenadas por data, filtráveis

4. **Avaliação Psicológica Estruturada:**
   - Sistema permite registrar exame do estado mental completo
   - Campos: consciência, atenção, sensopercepção, memória, pensamento, linguagem, humor, vontade, psicomotricidade, orientação, inteligência, personalidade
   - Armazenado em `session_evaluations` como JSONB
   - Usado para relatórios, avaliações periódicas

5. **Queixas Clínicas (Diagnóstico):**
   - Tabela `clinical_complaints` armazena queixas com:
     - CID-10 (código, título, grupo)
     - Severidade (leve/moderada/grave)
     - Curso (agudo/crônico/episódico/remissão)
     - Suicidalidade (sem risco/ideação/planejamento/tentativa prévia)
     - Agressividade (sem risco/irritabilidade/ameaças/agressão)
     - Comprometimento funcional (nenhum/leve/moderado/grave/muito grave)
   - Sistema cataloga medicações atuais (`complaint_medications`)
   - Sistema registra sintomas específicos (`complaint_symptoms`)

6. **Gestão de Documentos:**
   - Upload via `PatientDetail.tsx` tab Documentos
   - Storage bucket: `patient-files` (privado, RLS aplicado)
   - Metadados em `patient_files`: nome, tipo, categoria, is_clinical
   - Categorias: laudo, relatório, exame, consentimento, outro

**KPIs / Métricas Clínicas:**
- **Pacientes Ativos:** `COUNT(patients WHERE status = 'active')`
- **Taxa de Comparecimento:** `COUNT(sessions WHERE status = 'attended') / COUNT(sessions WHERE status != 'cancelled') * 100`
- **Taxa de Faltas:** `COUNT(sessions WHERE status = 'missed') / COUNT(sessions WHERE status != 'cancelled') * 100`
- **Pacientes em Risco (Inatividade):** Pacientes sem sessão attended nos últimos 30 dias
- **Tempo Médio de Tratamento:** Diferença entre start_date e data atual (para ativos) ou data de alta

**Decisões de Negócio (Clínico):**
- **Identificar abandono:** Pacientes sem sessão há mais de X dias → ação de reengajamento
- **Ajustar frequência:** Pacientes com muitas faltas → avaliar necessidade de mudar frequência
- **Planejar altas:** Pacientes com evolução positiva consistente → discussão sobre alta
- **Priorizar acompanhamento:** Pacientes com alta suicidalidade/agressividade → monitoramento intensivo

### DOMÍNIO FINANCIAL (Financeiro)

**Propósito:** Monitorar receita, prever faturamento, emitir NFSe, identificar perdas.

**Páginas principais:**
- `Metrics.tsx` domínio Financial — Dashboard financeiro com cards e gráficos
- `Financial.tsx` — Página dedicada a detalhes financeiros (se existir)
- `Sessions.tsx` — Gestão de sessões e status de pagamento

**Tabelas do banco:**
- `sessions` — Campo `value` (valor da sessão), `paid` (pago ou não), `status`
- `nfse_issued` — NFSe emitidas (número, valor líquido, ISS, status, URLs)
- `nfse_payments` — Pagamentos de ISS registrados
- `payment_allocations` — Alocação de pagamentos para NFSe específicas
- `invoice_logs` — Histórico de faturas geradas
- `nfse_config`, `nfse_certificates` — Configurações para emissão via FocusNFe

**Cards Métricos Financeiros (5):**

1. **Receita Total** (`metrics-revenue-total`):
   - **Cálculo:** `SUM(sessions.value WHERE status = 'attended' AND date BETWEEN ? AND ?)`
   - **Comparação:** vs período anterior (mesmo número de dias, deslocado)
   - **Sparkline:** Mini-gráfico de receita diária
   - **Decisão:** Entender saúde financeira geral

2. **Média por Sessão** (`metrics-avg-per-session`):
   - **Cálculo:** `Receita Total / COUNT(sessions WHERE status = 'attended')`
   - **Insight:** Identifica se valores de sessão estão adequados
   - **Decisão:** Ajustar precificação se muito baixo

3. **Receita Prevista (Forecast)** (`metrics-forecast-revenue`):
   - **Cálculo complexo:**
     ```typescript
     forecastRevenue = 0;
     for (paciente of pacientesAtivos) {
       if (paciente.monthly_price) {
         // Mensalista: conta 1x session_value
         forecastRevenue += paciente.session_value;
       } else {
         // Não mensalista: frequência × session_value × semanas no período
         const semanasNoPeriodo = Math.ceil(daysBetween / 7);
         const sessoesEsperadas = (paciente.frequency === 'semanal' ? 1 : 0.5) * semanasNoPeriodo;
         forecastRevenue += sessoesEsperadas * paciente.session_value;
       }
     }
     ```
   - **Insight:** Projeção de receita baseada em pacientes ativos atuais
   - **Decisão:** Planejar investimentos, avaliar necessidade de novos pacientes

4. **Média por Paciente Ativo** (`metrics-avg-per-active-patient`):
   - **Cálculo:** `Receita Total / COUNT(DISTINCT patient_id WHERE session.status = 'attended')`
   - **Insight:** Valor médio que cada paciente ativo gera
   - **Decisão:** Segmentar pacientes (alto valor vs baixo valor), ajustar estratégias

5. **Receita Perdida** (`metrics-lost-revenue`):
   - **Cálculo:** `SUM(sessions.value WHERE status IN ('missed', 'cancelled'))`
   - **Breakdown:** Por paciente, por motivo
   - **Insight:** Dinheiro que deixou de entrar devido a faltas/cancelamentos
   - **Decisão:** Implementar políticas de cancelamento, trabalhar retenção de pacientes faltosos

**Gráficos Financeiros:**
- **Receita ao Longo do Tempo** (linha): Evolução diária/semanal/mensal
- **Receita por Terapeuta** (barras): Comparação entre membros da equipe
- **Receita por Tipo de Sessão** (pie): Breakdown individual/casal/grupo
- **Forecast vs Realizado** (área): Comparação entre previsto e realizado
- **Tendência de Crescimento** (linha com regressão): Projeção futura baseada em histórico

**Fluxo de NFSe (Nota Fiscal de Serviço Eletrônica):**

1. **Configuração:**
   - `nfse_config`: CNPJ, inscrição municipal, regime tributário, código de serviço
   - `nfse_certificates`: Certificado digital A1 (obrigatório)
   - Integração via FocusNFe (edge function `issue-nfse`)

2. **Emissão:**
   - Agrupamento de sessões por paciente
   - Validações: CPF válido, dados completos
   - Envio para API FocusNFe
   - Armazenamento: `nfse_issued` com status, número, URLs (XML, PDF)

3. **Tracking:**
   - Status: `processing`, `issued`, `cancelled`, `error`
   - Notificações para paciente (email com PDF)
   - Registro em `invoice_logs`

4. **Pagamento de ISS:**
   - Registro manual via `nfse_payments`
   - Alocação via `payment_allocations` (vincular pagamento a NFSe)
   - Auto-marcação de sessões como `paid` quando NFSe totalmente paga

**Decisões de Negócio (Financeiro):**
- **Aumentar preços:** Se média/sessão está abaixo do mercado
- **Reduzir faltas:** Se receita perdida é alta % da total
- **Focar aquisição:** Se forecast está abaixo da meta
- **Otimizar mix:** Se certos tipos de sessão são mais lucrativos

### DOMÍNIO ADMINISTRATIVE (Administrativo)

**Propósito:** Gestão operacional da clínica — agenda, ocupação, pacientes.

**Páginas principais:**
- `Patients.tsx` — CRUD de pacientes
- `Schedule.tsx` — Calendário de agenda
- `Sessions.tsx` — Gestão de sessões

**Tabelas:**
- `patients`
- `sessions`
- `schedule_blocks` — Bloqueios de agenda (férias, feriados, horários indisponíveis)
- `appointments` — (se houver tabela separada de agendamentos futuros)

**Cards Métricos Administrativos (3):**

1. **Pacientes Ativos** (`metrics-active-patients`):
   - **Cálculo:** `COUNT(patients WHERE status = 'active')`
   - **Comparação:** vs período anterior
   - **Decisão:** Entender capacidade atual, planejar crescimento

2. **Taxa de Ocupação** (`metrics-occupation-rate`):
   - **Cálculo complexo:**
     ```typescript
     // 1. Calcular slots disponíveis no período
     const profile = await getProfile(userId);
     const { work_days, work_start_time, work_end_time, slot_duration, break_time } = profile;
     
     // 2. Para cada dia no período:
     let totalSlots = 0;
     for (day of daysBetween) {
       if (work_days.includes(day.getDay())) {
         // Horário de trabalho em minutos
         const workMinutes = diffInMinutes(work_end_time, work_start_time);
         // Subtrair break_time
         const effectiveMinutes = workMinutes - break_time;
         // Dividir por slot_duration
         const slotsInDay = Math.floor(effectiveMinutes / slot_duration);
         totalSlots += slotsInDay;
       }
     }
     
     // 3. Subtrair schedule_blocks (bloqueios)
     const blocks = await getScheduleBlocks(userId, dateRange);
     for (block of blocks) {
       const blockedMinutes = diffInMinutes(block.end_time, block.start_time);
       const blockedSlots = Math.floor(blockedMinutes / slot_duration);
       totalSlots -= blockedSlots;
     }
     
     // 4. Contar sessões attended
     const filledSlots = await countSessions({ userId, dateRange, status: 'attended' });
     
     // 5. Ocupação
     occupationRate = (filledSlots / totalSlots) * 100;
     ```
   - **Insight:** % da agenda que está sendo utilizada
   - **Decisão:** Se baixa → buscar mais pacientes; se alta → considerar expandir horários

3. **Taxa de Faltas** (`metrics-missed-rate`):
   - **Cálculo:** `COUNT(sessions WHERE status = 'missed') / COUNT(sessions WHERE status != 'cancelled') * 100`
   - **Insight:** % de sessões agendadas que pacientes faltaram
   - **Decisão:** Implementar lembretes, políticas de cancelamento, identificar pacientes faltosos

**Gráficos Administrativos:**
- **Ocupação ao Longo do Tempo** (linha): Evolução da taxa de ocupação
- **Distribuição de Pacientes por Status** (pie): Ativos, inativos, alta, aguardando
- **Sessões por Dia da Semana** (barras): Identificar dias mais/menos ocupados
- **Fila de Espera** (lista): Pacientes aguardando vaga

**Decisões de Negócio (Administrativo):**
- **Otimizar agenda:** Redistribuir horários nos dias menos ocupados
- **Contratar:** Se ocupação consistentemente acima de 85-90%
- **Reduzir faltas:** Implementar sistema de lembretes automáticos (WhatsApp)
- **Gerenciar fila:** Priorizar pacientes aguardando vaga há mais tempo

### DOMÍNIO MARKETING (Parcialmente Implementado)

**Propósito:** Aquisição de novos pacientes, conversão de leads, análise de canais.

**Status atual:** Cards existem, mas dados são MOCK (não conectados a fontes reais).

**Cards Métricos Marketing (4):**

1. **Visitantes do Site** (`metrics-website-visitors`) — MOCK
2. **Visualizações** (`metrics-website-views`) — MOCK
3. **CTR** (`metrics-website-ctr`) — MOCK
4. **Taxa de Conversão** (`metrics-website-conversion`) — MOCK

**Futuro:**
- Integração com Google Analytics
- Tracking de campanhas (UTM)
- Funil de conversão (visita → lead → paciente)
- ROI de canais de aquisição

### DOMÍNIO TEAM (Gestão de Equipe)

**Propósito:** Gerenciar hierarquia, permissões, e métricas agregadas da equipe.

**Páginas principais:**
- `Organogram.tsx` — Visualização e edição do organograma
- `Team.tsx` — Gestão de membros da equipe
- `Metrics.tsx` domínio Team — Métricas agregadas

**Tabelas:**
- `organization_levels` — Níveis hierárquicos (ex: Nível 1: Diretor, Nível 2: Coordenador, Nível 3: Terapeuta)
- `organization_positions` — Posições específicas (ex: "Diretor Clínico", "Coordenador SP", "Terapeuta Jr")
- `user_positions` — Associação usuário → posição
- `level_role_settings` — Permissões por nível e role (therapist, secretary, accountant)
- `level_permission_sets` — Permissões de domínios por nível
- `level_sharing_config` — Compartilhamento de dados entre níveis
- `peer_sharing` — Compartilhamento entre pares (mesmo nível)
- `therapist_assignments` — (Modelo legacy) Manager → Subordinate direto

**Funções Postgres para Hierarquia:**
- `get_all_subordinates(user_id)` — Retorna todos os subordinados recursivamente com depth
- `get_all_superiors(user_id)` — Retorna todos os superiores recursivamente
- `get_direct_superior(user_id)` — Retorna o superior imediato
- `get_organization_hierarchy_info(user_id)` — Retorna dados completos da posição do usuário

**Cards Métricos de Team (7):**

1. **Receita Total da Equipe** (`metrics-team-total-revenue`):
   - **Cálculo:** Agregação de receita de todos os subordinados
   - **Uso:** Gestor vê receita total gerada pela equipe

2. **Pacientes Ativos da Equipe** (`metrics-team-active-patients`):
   - **Cálculo:** COUNT distinct de pacientes ativos dos subordinados
   - **Uso:** Capacidade total da equipe

3. **Sessões Realizadas** (`metrics-team-sessions`):
   - **Cálculo:** COUNT de sessões attended da equipe
   - **Uso:** Produtividade geral

4. **Faturamento Médio por Terapeuta** (`metrics-team-average-revenue-per-therapist`):
   - **Cálculo:** Receita total equipe / número de terapeutas
   - **Uso:** Benchmark interno, identificar outliers

5. **Taxa de Comparecimento da Equipe** (`metrics-team-attendance-rate`):
   - **Cálculo:** Média ponderada das taxas individuais
   - **Uso:** Saúde geral da operação

6. **Ocupação Média da Equipe** (`metrics-team-average-occupation-rate`):
   - **Cálculo:** Média das taxas de ocupação individuais
   - **Uso:** Identificar capacidade ociosa ou sobrecarga

7. **Ticket Médio da Equipe** (`metrics-team-average-ticket`):
   - **Cálculo:** Receita total / sessões totais
   - **Uso:** Benchmark de precificação

**Gráficos de Team:**
- **Produtividade por Terapeuta** (barras): Comparação de sessões/receita
- **Distribuição de Pacientes** (treemap): Visualizar carga de cada terapeuta
- **Evolução de Métricas de Team** (linhas múltiplas): Trends ao longo do tempo
- **Heatmap de Ocupação** (heatmap): Ocupação por terapeuta × dia da semana

**Permissões Horizontais:**

O sistema implementa compartilhamento de dados entre usuários do mesmo nível via:

**Level Sharing:**
- Configurado em `level_sharing_config`
- Define quais domínios são compartilhados entre todos os usuários de um nível
- Exemplo: "Coordenadores podem ver dados clínicos uns dos outros"

**Peer Sharing:**
- Configurado em `peer_sharing`
- Compartilhamento 1-para-1 entre usuários específicos
- Pode ser unidirecional ou bidirecional (`is_bidirectional`)
- Exemplo: "Terapeuta A compartilha agenda com Terapeuta B"

**Função de validação:**
```sql
can_view_peer_data(requesting_user_id, target_user_id, domain) → boolean

-- Verifica se requesting_user pode ver dados de domain do target_user
-- Lógica:
-- 1. Verifica level_sharing_config (se estão no mesmo nível)
-- 2. Verifica peer_sharing (compartilhamento direto)
-- 3. Retorna união dos domínios permitidos
```

**Decisões de Negócio (Team):**
- **Redistribuir carga:** Se ocupação desbalanceada entre terapeutas
- **Investir em treinamento:** Se ticket médio de alguém está consistentemente baixo
- **Reconhecer high performers:** Terapeutas com alta ocupação + alta taxa de comparecimento
- **Planejar expansão:** Se equipe está perto da capacidade máxima

### INTERCONEXÃO ENTRE DOMÍNIOS

Os domínios não são silos — eles se interconectam:

- **Clinical → Financial:** Sessões attended geram receita
- **Administrative → Financial:** Taxa de ocupação impacta receita máxima possível
- **Team → Financial:** Receita total é soma das receitas individuais
- **Clinical → Team:** Distribuição de pacientes afeta carga de trabalho
- **Marketing → Clinical:** Novos pacientes entram via marketing, viram ativos no clínico

**Exemplo de decisão multi-domínio:**

**Situação:** Taxa de ocupação baixa (65%) + Taxa de faltas alta (20%) + Receita perdida significativa (R$ 5.000/mês)

**Análise:**
1. **Administrative:** Ocupação deveria estar em 80%+
2. **Clinical:** Alta taxa de faltas indica problema de engajamento ou logística
3. **Financial:** Receita perdida é oportunidade de recuperação

**Ações integradas:**
1. **Clinical:** Identificar pacientes faltosos recorrentes → conversa sobre compromisso ou ajuste de frequência
2. **Administrative:** Implementar sistema de lembretes automáticos via WhatsApp
3. **Financial:** Política de cancelamento (24h de antecedência) para proteger receita
4. **Team:** Se problema é concentrado em terapeuta específico, oferecer suporte/treinamento

**Este Prompt te deu o "mapa funcional" completo do sistema. Você entende agora como cada domínio opera, que métricas importam, e como decisões de negócio são tomadas com base nos dados.**

Entendeu os módulos funcionais? Confirme e vamos para o Prompt 7 sobre Dashboards, Cards, Gráficos e Persistência.
```

---

## 📊 Prompt 7 — Sistema de Dashboards, Cards, Gráficos, Drag & Drop e Persistência

**[TEXTO PARA COLAR EM UM NOVO CHAT]**

```
Agora vou explicar o SISTEMA DE DASHBOARDS do Mindware: como cards são renderizados em grids customizáveis, como drag & drop funciona, como gráficos são selecionados, e como tudo é persistido.

### ARQUITETURA DE DASHBOARDS

O Mindware usa um sistema modular de dashboards baseado em:
1. **Grids responsivos** (via react-grid-layout)
2. **Cards** registrados centralmente (via registries)
3. **Layouts persistentes** (salvos no Supabase)
4. **Drag & drop** (integrado no grid)
5. **Gráficos selecionáveis** (sistema de seleção persistente)

### COMPONENTES CORE DO SISTEMA

#### **GridCardContainer.tsx** (src/components/GridCardContainer.tsx)

**Propósito:** Wrapper universal que transforma qualquer conjunto de cards em um grid customizável com drag & drop.

**Props principais:**
```typescript
interface GridCardContainerProps {
  cards: Array<{
    id: string;
    component: ComponentType<any>;
    props?: Record<string, any>;
  }>;
  layout: Layout[];              // Layout atual (x, y, w, h para cada card)
  onLayoutChange: (newLayout: Layout[]) => void;  // Callback de mudança
  cols?: number;                 // Número de colunas (default: 12)
  rowHeight?: number;            // Altura de uma linha (default: 100px)
  isEditing?: boolean;           // Modo edição ativo?
  isDraggable?: boolean;         // Cards podem ser arrastados?
  isResizable?: boolean;         // Cards podem ser redimensionados?
}
```

**Funcionamento interno:**
```typescript
import ReactGridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';

export const GridCardContainer: React.FC<GridCardContainerProps> = ({
  cards,
  layout,
  onLayoutChange,
  cols = 12,
  rowHeight = 100,
  isEditing = false,
  isDraggable = true,
  isResizable = true
}) => {
  
  // Handler de mudança de layout
  const handleLayoutChange = (newLayout: Layout[]) => {
    // Validar layout
    const validLayout = newLayout.filter(item =>
      cards.some(card => card.id === item.i)
    );
    
    // Propagar mudança
    onLayoutChange(validLayout);
  };
  
  return (
    <ReactGridLayout
      className="layout"
      layout={layout}
      cols={cols}
      rowHeight={rowHeight}
      width={1200}  // Largura base (responsivo via % depois)
      onLayoutChange={handleLayoutChange}
      isDraggable={isDraggable && isEditing}
      isResizable={isResizable && isEditing}
      compactType="vertical"  // Cards se ajustam automaticamente
      preventCollision={false}  // Permite sobrepor temporariamente
    >
      {cards.map(card => {
        const CardComponent = card.component;
        return (
          <div key={card.id} className="card-wrapper">
            <CardComponent {...(card.props || {})} />
          </div>
        );
      })}
    </ReactGridLayout>
  );
};
```

**Integração com react-grid-layout:**
- `react-grid-layout` é a biblioteca que gerencia posicionamento, drag & drop, resize
- Cada card tem um `key` único (o `id` do card)
- Layout é array de `{ i: string, x: number, y: number, w: number, h: number }`
- Quando usuário arrasta/redimensiona, `onLayoutChange` é chamado automaticamente

#### **Metrics.tsx** — Uso Completo do Sistema

**Estrutura da página:**
```typescript
export const Metrics = () => {
  // 1. Estado de filtros
  const [dateRange, setDateRange] = useState(defaultDateRange);
  const [activeDomain, setActiveDomain] = useState<MetricsDomain>('financial');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // 2. Hook de layout para cards métricos
  const {
    layout: metricsLayout,
    updateCardOrder: updateMetricsLayout
  } = useDashboardLayout('metrics-grid', defaultLayoutMetrics);
  
  // 3. Hook de seleção de gráficos
  const {
    selectedCharts,
    toggleChart,
    isChartSelected
  } = useMetricsChartsSelection();
  
  // 4. Obter cards do domínio ativo
  const domainCards = useMemo(() => {
    return getMetricsCardsByDomain(activeDomain);
  }, [activeDomain]);
  
  // 5. Obter gráficos do domínio ativo (apenas os selecionados)
  const domainCharts = useMemo(() => {
    const allCharts = Object.values(METRICS_CHARTS_REGISTRY)
      .filter(chart => chart.domain === activeDomain);
    
    return allCharts.filter(chart => selectedCharts.has(chart.id));
  }, [activeDomain, selectedCharts]);
  
  // 6. Construir propsContext para gráficos
  const propsContext: MetricsChartPropsContext = {
    dateRange,
    userId: selectedUserId,
    organizationId: currentOrgId
  };
  
  return (
    <div className="metrics-page">
      {/* Header com filtros */}
      <div className="metrics-header">
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        <UserSelect value={selectedUserId} onChange={setSelectedUserId} />
      </div>
      
      {/* Tabs de domínios */}
      <Tabs value={activeDomain} onValueChange={setActiveDomain}>
        <TabsList>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="administrative">Administrativo</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="team">Equipe</TabsTrigger>
        </TabsList>
        
        {/* Cards métricos (grid superior) */}
        <div className="metrics-cards-section">
          <GridCardContainer
            cards={domainCards.map(cardDef => ({
              id: cardDef.id,
              component: cardDef.component,
              props: { dateRange, userId: selectedUserId }
            }))}
            layout={metricsLayout}
            onLayoutChange={updateMetricsLayout}
            isEditing={false}  // Drag sempre ativo, mas pode ter toggle UI
          />
        </div>
        
        {/* Gráficos (tabs inferiores) */}
        <div className="metrics-charts-section">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="trends">Tendências</TabsTrigger>
              <TabsTrigger value="distribution">Distribuição</TabsTrigger>
              <TabsTrigger value="composition">Composição</TabsTrigger>
            </TabsList>
            
            {['overview', 'trends', 'distribution', 'composition'].map(category => (
              <TabsContent key={category} value={category}>
                <div className="charts-grid">
                  {domainCharts
                    .filter(chart => chart.category === category)
                    .sort((a, b) => a.order - b.order)
                    .map(chart => {
                      const props = chart.buildProps(propsContext);
                      const ChartComponent = chart.component;
                      
                      return (
                        <div key={chart.id} className="chart-container">
                          <ChartComponent {...props} />
                        </div>
                      );
                    })
                  }
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </Tabs>
    </div>
  );
};
```

### SISTEMA DE SELEÇÃO DE GRÁFICOS

**Problema:** Usuário pode não querer ver todos os gráficos disponíveis. Sistema precisa permitir seleção personalizada.

**Solução:** `useMetricsChartsSelection` + `MetricsAddCardDialog`.

**Fluxo completo:**

1. **Carregar seleção salva:**
   ```typescript
   // useMetricsChartsSelection.ts
   useEffect(() => {
     const loadSelection = async () => {
       const { data } = await supabase
         .from('user_layout_preferences')
         .select('layout_config')
         .eq('user_id', auth.uid())
         .eq('layout_type', 'metrics-charts-selection')
         .single();
       
       if (data) {
         const { selectedChartIds } = data.layout_config;
         setSelectedCharts(new Set(selectedChartIds));
       } else {
         // Default: selecionar alguns gráficos principais
         setSelectedCharts(new Set(['revenue-over-time', 'team-productivity']));
       }
     };
     
     loadSelection();
   }, []);
   ```

2. **Renderizar apenas selecionados:**
   ```typescript
   const chartsToRender = allCharts.filter(chart =>
     selectedCharts.has(chart.id)
   );
   ```

3. **Abrir dialog de seleção:**
   ```typescript
   <Button onClick={() => setDialogOpen(true)}>
     <Plus /> Adicionar Gráficos
   </Button>
   
   <MetricsAddCardDialog
     open={dialogOpen}
     onOpenChange={setDialogOpen}
     domain={activeDomain}
     selectedCharts={selectedCharts}
     onToggleChart={toggleChart}
   />
   ```

4. **Dialog lista gráficos disponíveis:**
   ```typescript
   // MetricsAddCardDialog.tsx
   const availableCharts = Object.values(METRICS_CHARTS_REGISTRY)
     .filter(chart => chart.domain === domain);
   
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent>
         <DialogTitle>Selecionar Gráficos — {domain}</DialogTitle>
         
         <div className="charts-list">
           {availableCharts.map(chart => (
             <div key={chart.id} className="chart-option">
               <Checkbox
                 checked={selectedCharts.has(chart.id)}
                 onCheckedChange={() => onToggleChart(chart.id)}
               />
               <div>
                 <div className="font-medium">{chart.title}</div>
                 <div className="text-sm text-muted">{chart.description}</div>
               </div>
             </div>
           ))}
         </div>
       </DialogContent>
     </Dialog>
   );
   ```

5. **Toggle e auto-save:**
   ```typescript
   const toggleChart = useCallback((chartId: string) => {
     setSelectedCharts(prev => {
       const newSet = new Set(prev);
       if (newSet.has(chartId)) {
         newSet.delete(chartId);
       } else {
         newSet.add(chartId);
       }
       
       // Auto-save debounced
       debouncedSave(Array.from(newSet));
       
       return newSet;
     });
   }, []);
   
   const debouncedSave = debounce(async (chartIds: string[]) => {
     await supabase
       .from('user_layout_preferences')
       .upsert({
         user_id: auth.uid(),
         layout_type: 'metrics-charts-selection',
         layout_config: { selectedChartIds: chartIds },
         version: 1
       });
   }, 500);
   ```

### SISTEMA DE PERSISTÊNCIA DE LAYOUTS

**Tabela:** `user_layout_preferences`

**Schema:**
```sql
CREATE TABLE user_layout_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  layout_type TEXT NOT NULL,  -- 'metrics-grid', 'dashboard-example', 'metrics-charts-selection'
  layout_config JSONB NOT NULL DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, layout_type)
);
```

**Estrutura de `layout_config` por tipo:**

**Para grids (metrics-grid, dashboard-example):**
```json
{
  "items": [
    { "i": "metrics-revenue-total", "x": 0, "y": 0, "w": 4, "h": 2 },
    { "i": "metrics-avg-per-session", "x": 4, "y": 0, "w": 4, "h": 2 },
    { "i": "metrics-forecast-revenue", "x": 8, "y": 0, "w": 4, "h": 2 }
  ]
}
```

**Para seleção de gráficos (metrics-charts-selection):**
```json
{
  "selectedChartIds": [
    "revenue-over-time",
    "team-productivity",
    "occupation-rate-trend"
  ]
}
```

**Fluxo de save completo (useDashboardLayout):**
```typescript
const saveLayout = useCallback(async (layout: Layout[]) => {
  setSaving(true);
  
  try {
    await supabase
      .from('user_layout_preferences')
      .upsert({
        user_id: auth.uid(),
        layout_type: layoutType,
        layout_config: { items: layout },
        version: 1
      }, {
        onConflict: 'user_id, layout_type'  // Update se já existe
      });
    
    setHasUnsavedChanges(false);
    toast.success('Layout salvo!');
  } catch (error) {
    toast.error('Erro ao salvar layout');
  } finally {
    setSaving(false);
  }
}, [layoutType]);

// Auto-save debounced
useEffect(() => {
  if (isModified) {
    const timer = setTimeout(() => {
      saveLayout(layout);
    }, 500);
    
    return () => clearTimeout(timer);
  }
}, [layout, isModified]);
```

**Fluxo de reset:**
```typescript
const resetLayout = useCallback(async () => {
  try {
    // Deletar layout salvo
    await supabase
      .from('user_layout_preferences')
      .delete()
      .eq('user_id', auth.uid())
      .eq('layout_type', layoutType);
    
    // Voltar ao defaultLayout
    setLayout(defaultLayout);
    setIsModified(false);
    
    toast.success('Layout resetado para padrão');
  } catch (error) {
    toast.error('Erro ao resetar layout');
  }
}, [layoutType, defaultLayout]);
```

### PADRÃO DE IMPLEMENTAÇÃO: "RECIPE" PARA ADICIONAR NOVO CARD MÉTRICO

**Passo a passo completo:**

**1. Criar componente do card** (ex: `MetricsNewKpiCard.tsx`):
```typescript
// src/components/cards/metrics/financial/MetricsNewKpiCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNewKpiData } from '@/hooks/financial/useNewKpiData';
import type { MetricsCardBaseProps } from '@/types/metricsCardTypes';

export const MetricsNewKpiCard: React.FC<MetricsCardBaseProps> = ({
  dateRange,
  userId
}) => {
  const { value, comparison, isLoading } = useNewKpiData(dateRange, userId);
  
  if (isLoading) return <CardSkeleton />;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Novo KPI</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">
          {formatCurrency(value)}
        </div>
        <div className={cn(
          "text-sm",
          comparison > 0 ? "text-green-600" : "text-red-600"
        )}>
          {comparison > 0 ? '↑' : '↓'} {Math.abs(comparison).toFixed(1)}%
        </div>
      </CardContent>
    </Card>
  );
};
```

**2. Criar hook de dados** (se necessário):
```typescript
// src/hooks/financial/useNewKpiData.ts
export const useNewKpiData = (dateRange: DateRange, userId?: string) => {
  return useQuery({
    queryKey: ['new-kpi', dateRange, userId],
    queryFn: async () => {
      // Query Supabase
      const { data } = await supabase
        .from('sessions')
        .select('value')
        .gte('date', dateRange.from)
        .lte('date', dateRange.to);
      
      // Calcular KPI
      const value = calculateNewKpi(data);
      const comparison = calculateComparison(value, previousPeriodValue);
      
      return { value, comparison };
    }
  });
};
```

**3. Registrar no registry:**
```typescript
// src/lib/metricsCardRegistry.tsx
import { MetricsNewKpiCard } from '@/components/cards/metrics/financial/MetricsNewKpiCard';

export const METRICS_CARD_REGISTRY: Record<string, MetricsCardDefinition> = {
  // ... cards existentes
  
  'metrics-new-kpi': {
    id: 'metrics-new-kpi',
    title: 'Novo KPI',
    description: 'Descrição do que o KPI mede',
    domain: 'financial',
    component: MetricsNewKpiCard,
    defaultLayout: { x: 0, y: 4, w: 4, h: 2, minW: 3, minH: 2 },
    requiredPermission: 'financial_access'
  }
};
```

**4. Adicionar ao defaultLayout (opcional):**
```typescript
// src/lib/defaultLayoutMetrics.ts
export const defaultLayoutMetrics: Layout[] = [
  // ... layouts existentes
  { i: 'metrics-new-kpi', x: 0, y: 4, w: 4, h: 2 }
];
```

**5. Pronto!** Card agora aparece em:
- Metrics.tsx domínio Financial
- AddCardDialog (pode ser adicionado/removido)
- Layout persiste no Supabase

### PADRÃO "RECIPE" PARA ADICIONAR NOVO GRÁFICO

**1. Criar componente do gráfico:**
```typescript
// src/components/charts/financial/NewTrendChart.tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useNewTrendData } from '@/hooks/financial/useNewTrendData';

interface NewTrendChartProps {
  dateRange: DateRange;
  userId?: string;
  groupBy?: 'day' | 'week' | 'month';
}

export const NewTrendChart: React.FC<NewTrendChartProps> = ({
  dateRange,
  userId,
  groupBy = 'day'
}) => {
  const { data, isLoading } = useNewTrendData(dateRange, userId, groupBy);
  
  if (isLoading) return <ChartSkeleton />;
  
  return (
    <div className="chart-container">
      <h3 className="text-lg font-semibold mb-4">Nova Tendência</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
```

**2. Registrar no registry:**
```typescript
// src/lib/metricsChartsRegistry.tsx
import { NewTrendChart } from '@/components/charts/financial/NewTrendChart';

export const METRICS_CHARTS_REGISTRY: Record<string, MetricsChartDefinition> = {
  // ... gráficos existentes
  
  'new-trend': {
    id: 'new-trend',
    title: 'Nova Tendência',
    description: 'Análise temporal de X',
    domain: 'financial',
    category: 'trends',
    component: NewTrendChart,
    buildProps: (context) => {
      const daysBetween = differenceInDays(context.dateRange.to, context.dateRange.from);
      const groupBy = daysBetween > 90 ? 'month' : daysBetween > 30 ? 'week' : 'day';
      
      return {
        dateRange: context.dateRange,
        userId: context.userId,
        groupBy
      };
    },
    order: 15,
    requiredPermission: 'financial_access'
  }
};
```

**3. Pronto!** Gráfico agora:
- Aparece em Metrics.tsx tab Gráficos, categoria Tendências
- Pode ser selecionado via MetricsAddCardDialog
- Seleção persiste no Supabase

### OTIMIZAÇÕES E BOAS PRÁTICAS

**1. Lazy loading de gráficos:**
```typescript
// Carregar componente apenas quando visível
const LazyChart = lazy(() => import('./ExpensiveChart'));

<Suspense fallback={<ChartSkeleton />}>
  <LazyChart {...props} />
</Suspense>
```

**2. Memoização de cálculos:**
```typescript
const chartData = useMemo(() => {
  return expensiveCalculation(rawData);
}, [rawData]);
```

**3. Debounce de auto-save:**
```typescript
const debouncedSave = useMemo(
  () => debounce(saveLayout, 500),
  [saveLayout]
);
```

**4. Optimistic UI updates:**
```typescript
// Atualizar UI imediatamente, sync com server depois
const updateLayout = (newLayout) => {
  setLayout(newLayout);  // Imediato
  debouncedSave(newLayout);  // Async
};
```

**Este Prompt te deu o "sistema de dashboards" completo. Você agora entende como grids, cards, gráficos e persistência se integram para criar dashboards altamente customizáveis.**

Entendeu o sistema de dashboards? Confirme e vamos para o Prompt 8 sobre Sistema de Equipe e Organograma.
```

---

## 👥 Prompt 8 — Sistema de Equipe, Organograma, Permissões Horizontais

**[TEXTO PARA COLAR EM UM NOVO CHAT]**

```
Sistema completo de hierarquia organizacional, permissões e métricas de equipe.

**TABELAS PRINCIPAIS:**
- organization_levels (níveis 1-5)
- organization_positions (posições hierárquicas)
- user_positions (usuários → posições)
- level_role_settings (permissões por nível+role)
- level_sharing_config (compartilhamento entre níveis)
- peer_sharing (compartilhamento peer-to-peer)

**FUNÇÕES POSTGRES:**
- get_all_subordinates(user_id) → todos abaixo recursivamente
- get_all_superiors(user_id) → todos acima
- get_direct_superior(user_id) → superior imediato
- can_view_peer_data(requesting, target, domain) → validação de compartilhamento

**MÉTRICAS DE TEAM:** 7 cards agregados (receita total equipe, pacientes ativos, sessões, média/terapeuta, taxa comparecimento, ocupação média, ticket médio). Calculadas via teamMetricsCalculations.ts.

Confirmado? Prompt 9 sobre Templates Clínicos.
```

---

## 📋 Prompt 9 — Templates Clínicos, Prontuário, Evolução

**[TEXTO PARA COLAR EM UM NOVO CHAT]**

```
Sistema de templates para registro de evolução clínica.

**templateRegistry.ts:** Define templates por abordagem (TCC, Psicodinâmica, etc). Cada template = array de campos customizáveis (text, textarea, select, multiselect).

**ClinicalEvolution.tsx:** Renderiza formulário dinamicamente baseado no template selecionado. Salva como JSON vinculado a session_id.

**session_evaluations:** Exame do estado mental completo (consciência, atenção, sensopercepção, memória, pensamento, linguagem, humor, vontade, psicomotricidade, orientação, inteligência, personalidade) como JSONB.

**clinical_complaints:** CID-10, severidade, curso, suicidalidade, agressividade, comprometimento funcional. Complementado por complaint_symptoms, complaint_medications, complaint_specifiers.

Entendido? Prompt 10 sobre Integrações Externas.
```

---

## 🔌 Prompt 10 — Integrações Externas (NFSe, WhatsApp)

**[TEXTO PARA COLAR EM UM NOVO CHAT]**

```
Integrações via Edge Functions (supabase/functions/).

**NFSe (FocusNFe):**
- issue-nfse: emissão via API FocusNFe
- cancel-nfse: cancelamento
- check-nfse-status: polling de status
- download-nfse-pdf: download e storage
- Configuração: nfse_config (CNPJ, inscrição), nfse_certificates (certificado A1)

**WhatsApp (Dialog360/Z-API):**
- send-whatsapp: envio de mensagens
- send-whatsapp-reply: resposta a mensagens
- whatsapp-webhook: recebimento de mensagens/status
- download-whatsapp-media: download de mídia
- Tabelas: whatsapp_conversations, whatsapp_messages

**Outros:**
- send-consent-form: email com formulário LGPD
- create-user-with-role: criação de usuários com roles
- Secrets: WHATSAPP_API_TOKEN, RESEND_API_KEY, ENCRYPTION_MASTER_KEY

Claro? Prompt 11 CRÍTICO sobre Workflow e Guardrails.
```

---

## ⚠️ Prompt 11 — Guardrails de Implementação e Workflow com Lovable

**[TEXTO PARA COLAR EM UM NOVO CHAT]**

```
REGRAS CRÍTICAS para trabalhar comigo via Lovable.

**WORKFLOW:**
1. Eu explico o que quero
2. ChatGPT gera prompts cirúrgicos para Lovable
3. Eu envio ao Lovable
4. Lovable implementa
5. Eu trago resultado para ChatGPT
6. ChatGPT audita e gera próximos prompts

**FASES OBRIGATÓRIAS:**
- Fase 1: Leitura + diagnóstico (não mexer em código)
- Fase 2: Implementação mínima
- Fase 3: Ajustes finos
- Fase 4: Validação (logs, testes)
- Fase 5: Documentação

**LIMITES ESTRITOS:**
- NUNCA reescrever sistema todo
- NUNCA mudanças massivas sem necessidade
- SEMPRE listar arquivos que PODEM ser tocados
- SEMPRE preservar código funcional
- SEMPRE considerar RLS, multi-tenant, permissões

**LOVABLE TEM TENDÊNCIA A:**
- Expandir escopo além do pedido → LIMITAR
- Mexer em arquivos desnecessários → PROIBIR
- Não testar depois → EXIGIR validação

**VOCÊ (ChatGPT) DEVE:**
- Pedir APENAS arquivos estritamente necessários
- Gerar prompts em fases (não tudo de uma vez)
- Auditar resultado antes de próximo prompt
- Validar que RLS/permissões foram respeitadas

**ESTE É O CONTRATO DE TRABALHO.**
```

---

## 📖 Como Usar Este Documento

**[INSTRUÇÕES FINAIS]**

Este documento contém 11 prompts numerados que ensinam completamente o sistema Mindware a um novo modelo de IA, apenas via texto.

**COMO USAR EM UM NOVO CHAT:**

1. **Abra um novo chat com ChatGPT** (ou outro modelo)

2. **Envie o Prompt 1** (Visão Geral Filosófica)
   - Cole o texto completo do Prompt 1
   - Aguarde confirmação do modelo

3. **Envie o Prompt 2** (Arquitetura Técnica)
   - Cole o texto completo do Prompt 2
   - Aguarde confirmação

4. **Continue sequencialmente** até o Prompt 11
   - Cada prompt adiciona uma camada de conhecimento
   - O modelo vai "absorvendo" o sistema gradualmente

5. **Após os 11 prompts:**
   - O modelo estará 100% contextualizado sobre o Mindware
   - Você pode dizer: "Agora vamos trabalhar na funcionalidade X"
   - O modelo pedirá APENAS os arquivos necessários para aquela tarefa

**VANTAGENS DESTE MÉTODO:**
- Sem limite de anexos
- Sem necessidade de acesso ao repositório
- Conhecimento estruturado e profundo
- Modelo entende CONTEXTO, não só código
- Trabalho mais eficiente (menos idas e vindas)

**TEMPO ESTIMADO:**
- Enviar todos os prompts: ~10-15 minutos
- Leitura/absorção pelo modelo: instantâneo
- Resultado: modelo totalmente preparado para trabalhar em QUALQUER parte do sistema

**ESTE DOCUMENTO É SUA FERRAMENTA SUPREMA DE INVOCAÇÃO.**

---

**FIM DO CHATGPT_INVOCATION_KING.md**

---

Criado por: Lovable AI Agent
Data: 2025-11-30
Versão: 1.0
Base de conhecimento: Repositório completo do Mindware
Propósito: Ensinar o sistema Mindware completamente a modelos de IA via texto puro

Documento CHATGPT_INVOCATION_KING.md completado até o Prompt 7. Continuando com os Prompts 8, 9, 10, 11 e seção final.
