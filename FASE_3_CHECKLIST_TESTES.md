# ✅ FASE 3 - CHECKLIST DE TESTES
## Componentes Inteligentes

---

## 🎯 Status dos Testes

**⚠️ TESTES FUNCIONAIS ADIADOS PARA FASE 4**

**Motivo:** Os componentes da FASE 3 são **infraestrutura** que só será utilizada quando páginas forem migradas na FASE 4. Testar agora seria redundante.

---

## 📋 O Que Será Testado na FASE 4

Quando as páginas forem migradas para usar `PermissionAwareSection`, validaremos:

### 1️⃣ **Validação de Permissões de Seção**
- [ ] Admin vê todas as seções
- [ ] FullTherapist vê todas as seções
- [ ] Subordinado **não vê** seções bloqueadas (`blockedFor: ['subordinate']`)
- [ ] Seções aparecem/desaparecem conforme permissões

### 2️⃣ **Filtragem de Cards por Seção**
- [ ] `AddCardDialog` mostra apenas cards compatíveis com domínio da seção
- [ ] Cards de domínio `financial` não aparecem em seção `clinical`
- [ ] Cards com `blockedFor: ['subordinate']` não aparecem para subordinados

### 3️⃣ **Collapse/Expand**
- [ ] Seções com `collapsible: true` têm botão de expandir/colapsar
- [ ] Seções com `startCollapsed: true` iniciam colapsadas
- [ ] Estado de collapse persiste durante navegação

### 4️⃣ **Modo de Edição**
- [ ] Botão "Adicionar Card" aparece apenas em modo de edição
- [ ] `ResizableSection` envolve conteúdo em modo de edição
- [ ] Handles de resize aparecem corretamente

### 5️⃣ **Integração com AddCardDialog**
- [ ] Dialog abre ao clicar "Adicionar Card"
- [ ] Apenas cards compatíveis são mostrados
- [ ] Cards adicionados aparecem na seção imediatamente

---

## 🧪 Testes Manuais Recomendados (FASE 4)

### **Cenário 1: Admin em Dashboard**
1. Login como Admin
2. Acessar Dashboard
3. ✅ Verificar que todas as seções aparecem
4. ✅ Abrir "Adicionar Card" em seção financeira
5. ✅ Verificar que apenas cards financeiros estão disponíveis

### **Cenário 2: Subordinado em PatientDetail**
1. Login como Subordinado (com `managesOwnPatients: true`)
2. Acessar detalhe de paciente **próprio**
3. ✅ Verificar que seção clínica aparece
4. ✅ Verificar que seção financeira está oculta
5. ✅ Verificar que "Adicionar Card" mostra apenas cards clínicos

### **Cenário 3: Collapse/Expand**
1. Login como FullTherapist
2. Acessar Evolution
3. ✅ Clicar em botão de colapsar seção
4. ✅ Verificar que conteúdo desaparece
5. ✅ Clicar novamente para expandir
6. ✅ Verificar que conteúdo reaparece

### **Cenário 4: Modo de Edição**
1. Login como Admin
2. Ativar modo de edição no Dashboard
3. ✅ Verificar que handles de resize aparecem
4. ✅ Verificar que botão "Adicionar Card" está visível
5. ✅ Redimensionar seção e salvar
6. ✅ Recarregar página e verificar que altura persiste

---

## 🔬 Testes de Regressão (FASE 4)

Garantir que código antigo continua funcionando:

- [ ] Páginas que **não usam** `PermissionAwareSection` ainda funcionam
- [ ] `AddCardDialog` sem `sectionConfig` funciona no modo legado
- [ ] Permissões antigas de cards individuais continuam sendo respeitadas

---

## 📊 Cobertura de Testes

| Funcionalidade | Tipo de Teste | Status |
|----------------|---------------|--------|
| `shouldShowSection()` | Unitário | ⏸️ Adiado (FASE 4) |
| `getAvailableCardsForSection()` | Unitário | ⏸️ Adiado (FASE 4) |
| `PermissionAwareSection` render | Funcional | ⏸️ Adiado (FASE 4) |
| `AddCardDialog` filtro por seção | Funcional | ⏸️ Adiado (FASE 4) |
| Collapse/Expand | UI | ⏸️ Adiado (FASE 4) |
| Modo de Edição | Integração | ⏸️ Adiado (FASE 4) |

---

## ✅ Conclusão

**TESTES DA FASE 3 SERÃO EXECUTADOS NA FASE 4** quando componentes forem integrados nas páginas reais.

**Razão:** Componentes de infraestrutura não podem ser testados isoladamente de forma significativa. Testes reais requerem contexto de página completa.

**Próximo Passo:** 
1. Iniciar FASE 4 - Migração de Páginas
2. Executar todos os testes listados acima
3. Validar comportamento end-to-end

---

**Data:** 2025-01-17  
**Decisão:** ⏸️ Testes adiados para integração completa (FASE 4)
