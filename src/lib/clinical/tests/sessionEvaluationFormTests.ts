/**
 * ============================================================================
 * FASE C2.5A - Session Evaluation Form Tests
 * ============================================================================
 * 
 * Testes de sanidade para validar a refatoração estrutural do formulário.
 */

import { DEFAULT_EVALUATION_VALUES } from '../constants';
import type { 
  ConsciousnessData, 
  AttentionData, 
  OrientationData,
  SessionEvaluationBase 
} from '../types';

/**
 * Executa testes de sanidade da refatoração do SessionEvaluationForm
 */
export function runSessionEvaluationFormStructuralTests() {
  console.group('🧪 FASE C2.5A - Session Evaluation Form Structural Tests');
  
  let passedTests = 0;
  let failedTests = 0;

  // Teste 1: Defaults existem para todas as 12 funções
  console.log('\n📝 Teste 1: Defaults de todas as funções psíquicas');
  try {
    const requiredFunctions = [
      'consciousness',
      'attention',
      'orientation',
      'memory',
      'mood',
      'thought',
      'language',
      'sensoperception',
      'will',
      'psychomotor',
      'intelligence',
      'personality',
    ];

    const missingFunctions = requiredFunctions.filter(
      (fn) => !DEFAULT_EVALUATION_VALUES[fn as keyof typeof DEFAULT_EVALUATION_VALUES]
    );

    if (missingFunctions.length === 0) {
      console.log('✅ Todas as 12 funções têm defaults');
      passedTests++;
    } else {
      console.error('❌ Funções sem defaults:', missingFunctions);
      failedTests++;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar defaults:', error);
    failedTests++;
  }

  // Teste 2: Estrutura de consciência tem campos obrigatórios
  console.log('\n📝 Teste 2: Estrutura de consciência');
  try {
    const consciousness = DEFAULT_EVALUATION_VALUES.consciousness;
    const requiredFields = ['level', 'field', 'self_consciousness', 'notes'];
    
    const hasAllFields = requiredFields.every(
      (field) => field in consciousness
    );

    if (hasAllFields) {
      console.log('✅ Consciência tem todos campos obrigatórios');
      passedTests++;
    } else {
      console.error('❌ Consciência faltam campos');
      failedTests++;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar consciência:', error);
    failedTests++;
  }

  // Teste 3: Valores numéricos estão em ranges válidos
  console.log('\n📝 Teste 3: Ranges de valores numéricos');
  try {
    const consciousness = DEFAULT_EVALUATION_VALUES.consciousness;
    const attention = DEFAULT_EVALUATION_VALUES.attention;
    
    const validRanges = 
      consciousness.level >= -100 && consciousness.level <= 100 &&
      consciousness.field >= -100 && consciousness.field <= 100 &&
      attention.range >= 0 && attention.range <= 100 &&
      attention.concentration >= 0 && attention.concentration <= 100;

    if (validRanges) {
      console.log('✅ Valores numéricos em ranges válidos');
      passedTests++;
    } else {
      console.error('❌ Valores numéricos fora dos ranges');
      failedTests++;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar ranges:', error);
    failedTests++;
  }

  // Teste 4: Tipos booleanos têm valores padrão
  console.log('\n📝 Teste 4: Campos booleanos têm defaults');
  try {
    const consciousness = DEFAULT_EVALUATION_VALUES.consciousness;
    const attention = DEFAULT_EVALUATION_VALUES.attention;
    
    const hasBooleanDefaults =
      typeof consciousness.oriented_auto === 'boolean' &&
      typeof consciousness.disoriented_time === 'boolean' &&
      typeof attention.distractibility === 'boolean';

    if (hasBooleanDefaults) {
      console.log('✅ Campos booleanos têm defaults válidos');
      passedTests++;
    } else {
      console.error('❌ Campos booleanos sem defaults válidos');
      failedTests++;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar booleanos:', error);
    failedTests++;
  }

  // Teste 5: Campos de texto existem como strings
  console.log('\n📝 Teste 5: Campos de texto (notes, comments, etc.)');
  try {
    const hasTextFields =
      typeof DEFAULT_EVALUATION_VALUES.consciousness.notes === 'string' &&
      typeof DEFAULT_EVALUATION_VALUES.orientation.comments === 'string' &&
      typeof DEFAULT_EVALUATION_VALUES.attention.notes === 'string';

    if (hasTextFields) {
      console.log('✅ Campos de texto são strings');
      passedTests++;
    } else {
      console.error('❌ Campos de texto não são strings');
      failedTests++;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar campos de texto:', error);
    failedTests++;
  }

  // Resumo final
  console.log('\n📊 Resumo dos testes:');
  console.log(`✅ Passaram: ${passedTests}`);
  console.log(`❌ Falharam: ${failedTests}`);
  console.log(`📈 Taxa de sucesso: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);

  if (failedTests === 0) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM! Refatoração estrutural validada.');
  } else {
    console.warn('\n⚠️ Alguns testes falharam. Revisar defaults e estrutura.');
  }

  console.groupEnd();
  
  return {
    passed: passedTests,
    failed: failedTests,
    total: passedTests + failedTests,
  };
}

// Executar automaticamente em desenvolvimento
if (import.meta.env.DEV) {
  // Comentado para não poluir o console em desenvolvimento
  // runSessionEvaluationFormStructuralTests();
}
