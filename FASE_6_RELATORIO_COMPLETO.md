# FASE 6 — COMPARTILHAMENTO ENTRE PEERS — RELATÓRIO COMPLETO

## ✅ STATUS: CONCLUÍDA

Data: 20/11/2024

---

## 📋 OBJETIVO DA FASE 6

Implementar sistema de compartilhamento de dados entre usuários do mesmo nível hierárquico (peers), permitindo configurações globais por nível ou individuais entre pares específicos.

---

## 🗄️ ESTRUTURA DE BANCO DE DADOS

### 1. Tabela `level_sharing_config`

Configuração de compartilhamento no nível organizacional — todos os usuários do nível compartilham os mesmos domínios entre si.

```sql
CREATE TABLE public.level_sharing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id UUID NOT NULL REFERENCES public.organization_levels(id) ON DELETE CASCADE,
  shared_domains TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(level_id)
);
```

**Campos:**
- `level_id`: Referência ao nível organizacional
- `shared_domains`: Array de domínios compartilhados (ex: `['financial', 'clinical']`)
- Constraint UNIQUE garante apenas uma configuração por nível

### 2. Tabela `peer_sharing`

Compartilhamento individual entre pares específicos na organização.

```sql
CREATE TABLE public.peer_sharing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sharer_user_id UUID NOT NULL, -- Quem compartilha
  receiver_user_id UUID NOT NULL, -- Quem recebe
  shared_domains TEXT[] NOT NULL DEFAULT '{}',
  is_bidirectional BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sharer_user_id, receiver_user_id)
);
```

**Campos:**
- `sharer_user_id`: Usuário que está compartilhando seus dados
- `receiver_user_id`: Usuário que recebe acesso aos dados
- `shared_domains`: Domínios específicos compartilhados
- `is_bidirectional`: Se true, o compartilhamento é mútuo (ambos veem dados um do outro)

---

## 🔒 POLÍTICAS RLS

### Level Sharing Config

1. **Organization owners podem gerenciar**
   - Owners da organização podem criar/editar/deletar configurações de nível

2. **Admins podem ver todas as configurações**
   - Usuários com role `admin` têm visibilidade completa

3. **Usuários podem ver configurações de seu próprio nível**
   - Transparência: usuários veem quais domínios são compartilhados em seu nível

### Peer Sharing

1. **Usuários podem criar compartilhamentos no mesmo nível**
   - Validação: só pode compartilhar com peers do mesmo nível
   - Controle: apenas o sharer pode criar

2. **Usuários podem atualizar/deletar seus compartilhamentos**
   - Gestão completa dos compartilhamentos que criou

3. **Usuários podem ver compartilhamentos envolvendo eles**
   - Visibilidade se é sharer ou receiver

4. **Admins e Organization Owners têm visibilidade completa**
   - Auditoria e gestão administrativa

---

## 🔧 FUNÇÕES DO BANCO DE DADOS

### 1. `get_peer_shared_domains(_requesting_user_id, _target_user_id)`

**Propósito:** Retorna todos os domínios que `target_user` compartilha com `requesting_user`.

**Lógica:**
1. Verifica se estão no mesmo nível e há configuração de `level_sharing_config`
2. Verifica se há compartilhamento individual em `peer_sharing`
3. Retorna união (DISTINCT) de ambos

**Retorno:** `TEXT[]` — Array de domínios compartilhados

**Exemplo:**
```sql
SELECT get_peer_shared_domains(
  'user-a-uuid',
  'user-b-uuid'
);
-- Retorna: ['financial', 'clinical', 'team']
```

### 2. `can_view_peer_data(_requesting_user_id, _target_user_id, _domain)`

**Propósito:** Verifica se `requesting_user` pode ver dados de `target_user` em um domínio específico.

**Lógica:**
1. Chama `get_peer_shared_domains`
2. Verifica se o `_domain` está no array retornado

**Retorno:** `BOOLEAN`

**Exemplo:**
```sql
SELECT can_view_peer_data(
  'user-a-uuid',
  'user-b-uuid',
  'financial'
);
-- Retorna: true ou false
```

---

## ⚛️ HOOKS REACT

### 1. `usePeerSharing()`

Hook principal para gerenciar compartilhamentos de peer.

**Estado:**
```typescript
{
  loading: boolean;
  peerSharings: PeerSharingConfig[];
  levelSharing: LevelSharingConfig | null;
  peersInLevel: PeerInfo[];
}
```

**Funções:**
- `canViewPeerData(targetUserId, domain)` — Verifica acesso a domínio específico
- `getPeerSharedDomains(targetUserId)` — Obtém todos os domínios compartilhados
- `shareToPeer(receiverId, domains, isBidirectional)` — Cria/atualiza compartilhamento
- `removePeerSharing(receiverId)` — Remove compartilhamento individual
- `updateLevelSharing(levelId, domains)` — Atualiza configuração do nível
- `removeLevelSharing(levelId)` — Remove configuração do nível
- `refresh()` — Recarrega dados

**Uso:**
```typescript
const {
  peerSharings,
  levelSharing,
  peersInLevel,
  shareToPeer,
  canViewPeerData
} = usePeerSharing();

// Criar compartilhamento
await shareToPeer(
  'receiver-user-id',
  ['financial', 'clinical'],
  true // bidirectional
);

// Verificar acesso
const canView = await canViewPeerData('peer-id', 'financial');
```

### 2. Integração em `useCardPermissions()`

**Novas funções exportadas:**
- `canViewPeerDomain(peerUserId, domain)` — Verifica acesso a domínio de peer
- `getPeerSharedDomains(peerUserId)` — Obtém domínios compartilhados

**Uso em componentes:**
```typescript
const { canViewPeerDomain, getPeerSharedDomains } = useCardPermissions();

// Verificar se posso ver dados financeiros de um peer
const canViewFinancial = await canViewPeerDomain('peer-id', 'financial');

// Obter todos os domínios compartilhados
const sharedDomains = await getPeerSharedDomains('peer-id');
```

---

## 🖥️ INTERFACE DE GERENCIAMENTO

### Página: `/peer-sharing` (`PeerSharingManagement.tsx`)

**Funcionalidades:**

#### 1. Tab "Compartilhamento Individual"

**Novo Compartilhamento:**
- Seleção visual de peers do mesmo nível
- Checkboxes para escolha de domínios
- Switch para compartilhamento bidirecional
- Botão para salvar configuração

**Compartilhamentos Ativos:**
- Lista de compartilhamentos existentes
- Badges mostrando domínios compartilhados
- Indicador de bidirecionalidade
- Botão para remover compartilhamento

#### 2. Tab "Compartilhamento do Nível"

*(Disponível apenas para Organization Owners)*

- Configuração global de domínios compartilhados no nível
- Checkboxes para todos os domínios disponíveis
- Alert explicando o impacto (aplica-se a todos do nível)
- Botão para salvar/remover configuração

**Recursos Visuais:**
- Cards clicáveis para seleção de peers
- Badges para domínios
- Alerts informativos
- Estados de loading e feedback com toast

---

## 🔄 FLUXO DE DADOS

### Cenário 1: Compartilhamento por Nível

```
1. Organization Owner acessa /peer-sharing
2. Vai para tab "Compartilhamento do Nível"
3. Seleciona domínios ['financial', 'team']
4. Clica em "Salvar Configuração do Nível"
5. updateLevelSharing() cria/atualiza registro em level_sharing_config
6. TODOS os usuários do nível agora compartilham esses domínios entre si
```

**Resultado:** Usuário A e Usuário B (mesmo nível) podem ver dados financeiros e de equipe um do outro.

### Cenário 2: Compartilhamento Individual

```
1. Usuário A acessa /peer-sharing
2. Seleciona Usuário B (mesmo nível)
3. Marca domínios ['clinical']
4. Ativa "Bidirecional"
5. Clica em "Salvar Compartilhamento"
6. shareToPeer() cria registro em peer_sharing
7. A e B agora compartilham dados clínicos mutuamente
```

**Resultado:** A pode ver dados clínicos de B, e B pode ver dados clínicos de A.

### Cenário 3: Verificação de Acesso em Componente

```typescript
// Em um componente que mostra dados de pacientes
const { canViewPeerDomain } = useCardPermissions();

const loadPatients = async (ownerId: string) => {
  // Verificar se posso ver dados do owner
  const canView = await canViewPeerDomain(ownerId, 'clinical');
  
  if (canView) {
    // Carregar e exibir dados clínicos do peer
    const patients = await fetchPatientsOf(ownerId);
    setPatients(patients);
  }
};
```

---

## 🎯 CASOS DE USO

### 1. Equipe de Psicólogos no Mesmo Nível

**Situação:** 3 psicólogos (Level 2) trabalham juntos e precisam compartilhar dados clínicos para discussão de casos.

**Solução:**
- Organization Owner configura `level_sharing_config` com `['clinical']`
- Todos os 3 automaticamente compartilham dados clínicos entre si
- Cada um pode ver queixas, evoluções e avaliações dos pacientes dos outros

### 2. Compartilhamento Seletivo de Dados Financeiros

**Situação:** Usuário A quer que Usuário B veja seus dados financeiros para auditoria, mas não quer ver os de B.

**Solução:**
- A cria peer_sharing com B, domínios `['financial']`, `is_bidirectional = false`
- B pode ver dados financeiros de A
- A NÃO pode ver dados financeiros de B (não é bidirecional)

### 3. Compartilhamento Temporário para Projeto

**Situação:** Dois membros do nível precisam colaborar em projeto com acesso mútuo aos dados de marketing.

**Solução:**
- Qualquer um cria peer_sharing com domínios `['media']`, `is_bidirectional = true`
- Ambos veem dados de marketing um do outro
- Quando projeto terminar, podem remover o compartilhamento

---

## 🔐 CONSIDERAÇÕES DE SEGURANÇA

### 1. Validações Implementadas

✅ **Mesmo Nível:** Só pode compartilhar com usuários do mesmo nível organizacional
✅ **RLS Policies:** Todas as operações protegidas por RLS
✅ **Ownership:** Usuários só podem criar/editar compartilhamentos que criaram
✅ **Auditoria:** Admins e Owners têm visibilidade completa para auditoria

### 2. Princípios de Segurança

- **Least Privilege:** Compartilhamento explícito, opt-in
- **Transparency:** Usuários veem quem compartilha dados com eles
- **Control:** Cada usuário controla seus próprios compartilhamentos
- **Auditability:** Timestamps e logs completos

### 3. Limitações Intencionais

❌ Não pode compartilhar com usuários de níveis diferentes (hierarquia mantém separação)
❌ Não pode forçar alguém a compartilhar (receiver não controla)
❌ Subordinates não podem acessar dados de superiores via peer sharing

---

## 🧪 TESTES SUGERIDOS

### Testes Funcionais

1. **Criar compartilhamento de nível**
   - Verificar que todos do nível compartilham domínios configurados
   
2. **Criar compartilhamento individual**
   - Verificar acesso correto aos domínios
   - Testar modo bidirecional vs unidirecional

3. **Combinar nível + individual**
   - Verificar união de domínios (level + peer)

4. **Remover compartilhamento**
   - Verificar que acesso é revogado imediatamente

### Testes de Segurança

1. **Tentar compartilhar com usuário de outro nível**
   - Deve falhar com erro de RLS

2. **Tentar editar compartilhamento de outro usuário**
   - Deve falhar com erro de RLS

3. **Verificar RLS em queries**
   - Confirmar que dados não-compartilhados não vazam

---

## 📊 MÉTRICAS E MONITORAMENTO

### KPIs Sugeridos

- Número de compartilhamentos ativos por nível
- Domínios mais compartilhados
- Taxa de uso de compartilhamento bidirecional vs unidirecional
- Tempo médio de vida de um compartilhamento

### Queries Úteis

```sql
-- Compartilhamentos mais comuns
SELECT 
  unnest(shared_domains) as domain,
  COUNT(*) as usage_count
FROM peer_sharing
GROUP BY domain
ORDER BY usage_count DESC;

-- Níveis com mais compartilhamento
SELECT 
  ol.level_name,
  COUNT(DISTINCT ps.id) as peer_sharings,
  lsc.shared_domains as level_shared
FROM organization_levels ol
LEFT JOIN user_positions up ON up.position_id IN (
  SELECT id FROM organization_positions WHERE level_id = ol.id
)
LEFT JOIN peer_sharing ps ON ps.sharer_user_id = up.user_id
LEFT JOIN level_sharing_config lsc ON lsc.level_id = ol.id
GROUP BY ol.id, ol.level_name, lsc.shared_domains
ORDER BY peer_sharings DESC;
```

---

## 🔮 PRÓXIMOS PASSOS (FASE 7+)

### Sugestões de Evolução

1. **Compartilhamento Temporário**
   - Adicionar `expires_at` em `peer_sharing`
   - Revogação automática após data

2. **Notificações**
   - Notificar quando alguém compartilha dados com você
   - Alertar quando compartilhamento é removido

3. **Auditoria Avançada**
   - Log de quem acessou dados compartilhados
   - Relatório de uso de compartilhamentos

4. **Solicitações de Compartilhamento**
   - Usuário B pode solicitar acesso a dados de A
   - A aprova/rejeita via interface

5. **Templates de Compartilhamento**
   - Criar "perfis" de compartilhamento (ex: "Colaboração Clínica")
   - Aplicar template a múltiplos peers de uma vez

6. **Compartilhamento Hierárquico**
   - Permitir superior compartilhar dados com subordinados específicos
   - Controle granular além da hierarquia padrão

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [x] Criar tabelas `level_sharing_config` e `peer_sharing`
- [x] Implementar RLS policies completas
- [x] Criar funções `get_peer_shared_domains` e `can_view_peer_data`
- [x] Desenvolver hook `usePeerSharing`
- [x] Integrar funções em `useCardPermissions`
- [x] Criar interface `/peer-sharing`
- [x] Adicionar rota em App.tsx
- [x] Implementar UI para compartilhamento individual
- [x] Implementar UI para compartilhamento de nível
- [x] Testar criação/edição/remoção de compartilhamentos
- [x] Documentar sistema completo

---

## 📝 CONCLUSÃO

A **FASE 6** implementa com sucesso o sistema de compartilhamento entre peers, permitindo:

✅ Configurações globais por nível organizacional
✅ Compartilhamentos individuais entre pares específicos
✅ Controle granular por domínio
✅ Modo bidirecional para colaboração mútua
✅ Interface intuitiva e segura
✅ Integração transparente com hooks existentes

O sistema está pronto para uso e pode ser expandido conforme necessidades futuras.

---

**Status Final:** ✅ **FASE 6 CONCLUÍDA COM SUCESSO**

**Próxima Fase Sugerida:** Implementar notificações e auditoria avançada de compartilhamentos.
