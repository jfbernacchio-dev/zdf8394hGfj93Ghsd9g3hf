/**
 * ============================================================================
 * FASE C2.7 - Patient Overview Template Integration Tests
 * ============================================================================
 * 
 * Testes para verificar que a integração de templates no Patient Overview
 * está funcionando corretamente com fallback permissivo.
 */

import { PATIENT_OVERVIEW_AVAILABLE_CARDS } from '@/lib/patientOverviewCardRegistry';

/**
 * Mock de template ativo
 */
const MOCK_ACTIVE_TEMPLATE = {
  id: 'psychopathology_basic',
  type: 'role' as const,
  label: 'Psicopatológico Básico',
  supportsComplaint: true,
  supportsSessionEvaluation: true,
  supportsEvolution: true,
};

const MOCK_OTHER_TEMPLATE = {
  id: 'tcc_template',
  type: 'approach' as const,
  label: 'TCC Template',
  supportsComplaint: true,
  supportsSessionEvaluation: true,
  supportsEvolution: true,
};

/**
 * Testes principais
 */
export function runPatientOverviewTemplateTests(): void {
  console.group('🧪 FASE C2.7 - Patient Overview Template Tests');

  try {
    // Test 1: Todos os cards têm requiredTemplates definido
    console.log('\n✅ Test 1: All cards have requiredTemplates metadata');
    let cardsWithTemplates = 0;
    for (const card of PATIENT_OVERVIEW_AVAILABLE_CARDS) {
      if (card.requiredTemplates && card.requiredTemplates.length > 0) {
        cardsWithTemplates++;
      }
    }
    console.log(`   ✓ ${cardsWithTemplates}/${PATIENT_OVERVIEW_AVAILABLE_CARDS.length} cards have requiredTemplates`);
    
    if (cardsWithTemplates !== PATIENT_OVERVIEW_AVAILABLE_CARDS.length) {
      console.warn(`   ⚠ ${PATIENT_OVERVIEW_AVAILABLE_CARDS.length - cardsWithTemplates} cards without requiredTemplates (will use fallback)`);
    }

    // Test 2: Todos os cards atuais incluem psychopathology_basic
    console.log('\n✅ Test 2: All cards include psychopathology_basic template');
    const cardsWithPsychoBasic = PATIENT_OVERVIEW_AVAILABLE_CARDS.filter(
      card => card.requiredTemplates?.includes('psychopathology_basic')
    );
    console.log(`   ✓ ${cardsWithPsychoBasic.length}/${PATIENT_OVERVIEW_AVAILABLE_CARDS.length} cards include psychopathology_basic`);
    
    if (cardsWithPsychoBasic.length !== PATIENT_OVERVIEW_AVAILABLE_CARDS.length) {
      throw new Error('Not all cards include psychopathology_basic - backward compatibility broken!');
    }

    // Test 3: Simular filtro de template ativo
    console.log('\n✅ Test 3: Simulate template filtering logic');
    
    // Mock da função isCardTemplateCompatible
    const isCardTemplateCompatible = (cardId: string, activeTemplate: any | null) => {
      const card = PATIENT_OVERVIEW_AVAILABLE_CARDS.find(c => c.id === cardId);
      
      // Fallback permissivo: se não tem requiredTemplates, permite
      if (!card?.requiredTemplates || card.requiredTemplates.length === 0) {
        return true;
      }
      
      // Se não há template ativo, permite (fallback permissivo)
      if (!activeTemplate) {
        return true;
      }
      
      // Verifica se template ativo está na lista
      return card.requiredTemplates.includes(activeTemplate.id);
    };
    
    // Cenário 1: Template psychopathology_basic ativo → todos os cards visíveis
    const visibleWithPsychoBasic = PATIENT_OVERVIEW_AVAILABLE_CARDS.filter(
      card => isCardTemplateCompatible(card.id, MOCK_ACTIVE_TEMPLATE)
    );
    console.log(`   ✓ With psychopathology_basic: ${visibleWithPsychoBasic.length}/${PATIENT_OVERVIEW_AVAILABLE_CARDS.length} cards visible`);
    
    if (visibleWithPsychoBasic.length !== PATIENT_OVERVIEW_AVAILABLE_CARDS.length) {
      throw new Error('Some cards filtered with psychopathology_basic - backward compatibility broken!');
    }
    
    // Cenário 2: Template TCC ativo → nenhum card visível (pois nenhum tem 'tcc_template')
    const visibleWithTCC = PATIENT_OVERVIEW_AVAILABLE_CARDS.filter(
      card => isCardTemplateCompatible(card.id, MOCK_OTHER_TEMPLATE)
    );
    console.log(`   ✓ With tcc_template: ${visibleWithTCC.length}/${PATIENT_OVERVIEW_AVAILABLE_CARDS.length} cards visible`);
    
    if (visibleWithTCC.length > 0) {
      console.warn(`   ⚠ ${visibleWithTCC.length} cards would be visible with TCC template (expected: 0)`);
    }
    
    // Cenário 3: Sem template ativo → todos os cards visíveis (fallback permissivo)
    const visibleWithoutTemplate = PATIENT_OVERVIEW_AVAILABLE_CARDS.filter(
      card => isCardTemplateCompatible(card.id, null)
    );
    console.log(`   ✓ Without template: ${visibleWithoutTemplate.length}/${PATIENT_OVERVIEW_AVAILABLE_CARDS.length} cards visible (fallback)`);
    
    if (visibleWithoutTemplate.length !== PATIENT_OVERVIEW_AVAILABLE_CARDS.length) {
      throw new Error('Fallback permissivo não está funcionando - alguns cards foram filtrados!');
    }

    // Test 4: Validar estrutura dos metadados
    console.log('\n✅ Test 4: Validate card metadata structure');
    for (const card of PATIENT_OVERVIEW_AVAILABLE_CARDS) {
      if (!card.id || !card.label || !card.domain) {
        throw new Error(`Card ${card.id} has incomplete metadata`);
      }
      
      if (card.requiredTemplates && !Array.isArray(card.requiredTemplates)) {
        throw new Error(`Card ${card.id} requiredTemplates is not an array`);
      }
      
      if (card.requiredTemplates) {
        for (const templateId of card.requiredTemplates) {
          if (typeof templateId !== 'string' || templateId.length === 0) {
            throw new Error(`Card ${card.id} has invalid template ID: ${templateId}`);
          }
        }
      }
    }
    console.log('   ✓ All card metadata is valid');

    // Test 5: Verificar domínios dos cards clínicos
    console.log('\n✅ Test 5: Clinical cards have clinical domain');
    const clinicalCards = PATIENT_OVERVIEW_AVAILABLE_CARDS.filter(c => c.domain === 'clinical');
    const clinicalCardIds = ['patient-complaints-summary', 'patient-medications-list', 'patient-diagnoses-list'];
    
    for (const cardId of clinicalCardIds) {
      const card = clinicalCards.find(c => c.id === cardId);
      if (!card) {
        throw new Error(`Clinical card ${cardId} not found or has wrong domain`);
      }
      if (!card.requiredTemplates?.includes('psychopathology_basic')) {
        throw new Error(`Clinical card ${cardId} does not require psychopathology_basic template`);
      }
    }
    console.log(`   ✓ ${clinicalCards.length} clinical cards properly configured`);

    console.log('\n✅ ALL TESTS PASSED');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    throw error;
  } finally {
    console.groupEnd();
  }
}

/**
 * Helper para rodar no browser console
 */
if (typeof window !== 'undefined') {
  (window as any).runPatientOverviewTemplateTests = runPatientOverviewTemplateTests;
}
