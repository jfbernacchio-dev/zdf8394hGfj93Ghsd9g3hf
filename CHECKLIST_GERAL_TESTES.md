# ✅ CHECKLIST GERAL DE TESTES
## Validação Completa das FASES 1-5

---

## 🎯 Como Usar Este Checklist

Execute estes testes **após migrar uma página real** para validar todo o sistema.

---

## 📋 Testes por Perfil de Usuário

### **Admin**
- [ ] Vê todas as 10 seções em todas as páginas
- [ ] Pode adicionar qualquer card
- [ ] Modo edição funciona
- [ ] Dados de todos os terapeutas visíveis

### **FullTherapist**
- [ ] Mesmas permissões que Admin
- [ ] Vê dados agregados da clínica

### **Subordinado (managesOwnPatients: true)**
- [ ] Dashboard: 3 seções (financial, administrative, clinical)
- [ ] Dashboard: seção media **OCULTA**
- [ ] Dados filtrados (apenas seus pacientes)
- [ ] PatientDetail: acesso apenas a seus pacientes

### **Subordinado (managesOwnPatients: false)**
- [ ] Dashboard: 1 seção (administrative)
- [ ] PatientDetail: acesso a todos pacientes
- [ ] Sem acesso clínico/financeiro

### **Accountant**
- [ ] Dashboard: 1 seção (financial)
- [ ] Todas outras seções ocultas

---

## 🧪 Testes Funcionais

### **Adicionar Card**
- [ ] Dialog abre
- [ ] Mostra apenas cards compatíveis
- [ ] Card é adicionado
- [ ] Aparece na interface

### **Remover Card**
- [ ] Card desaparece
- [ ] Toast de confirmação

### **Collapse/Expand**
- [ ] Botão funciona
- [ ] Conteúdo oculta/mostra

### **Modo Edição**
- [ ] Ativar funciona
- [ ] Salvar persiste mudanças
- [ ] Cancelar descarta
- [ ] Restaurar padrão funciona

---

## ✅ Critério de Aprovação

**Sistema aprovado se:**
- ✅ 100% dos testes de perfil passam
- ✅ 100% dos testes funcionais passam
- ✅ Zero quebras no código existente

---

**Execute este checklist após cada migração de página!**
