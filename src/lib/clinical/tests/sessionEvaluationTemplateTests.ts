/**
 * ============================================================================
 * FASE C2.5B - Session Evaluation Template Tests
 * ============================================================================
 * 
 * Testes de integração do SessionEvaluationForm com o sistema de templates
 * e validação Zod.
 */

import { validateSessionEvaluation } from '../evaluationValidation';
import { DEFAULT_EVALUATION_VALUES } from '../constants';

/**
 * ============================================================================
 * TESTES DE VALIDAÇÃO ZOD
 * ============================================================================
 */

interface TestResult {
  testName: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function runTest(testName: string, testFn: () => boolean, errorMsg?: string) {
  try {
    const passed = testFn();
    results.push({ testName, passed, error: passed ? undefined : errorMsg });
  } catch (error: any) {
    results.push({ testName, passed: false, error: error.message });
  }
}

/**
 * Teste 1: Avaliação válida completa
 */
function testValidCompleteEvaluation() {
  const validData = {
    session_id: '123e4567-e89b-12d3-a456-426614174000',
    patient_id: '223e4567-e89b-12d3-a456-426614174001',
    evaluated_by: '323e4567-e89b-12d3-a456-426614174002',
    organization_id: '423e4567-e89b-12d3-a456-426614174003',
    consciousness_data: {
      ...DEFAULT_EVALUATION_VALUES.consciousness,
      level: -30,
      notes: 'Paciente apresentou torpor leve no início da sessão'
    },
    orientation_data: {
      ...DEFAULT_EVALUATION_VALUES.orientation,
      insight: 60,
      comments: 'Insight moderado sobre a condição'
    },
    attention_data: {
      ...DEFAULT_EVALUATION_VALUES.attention,
      concentration: 70,
      notes: 'Dificuldade de concentração relatada'
    },
    sensoperception_data: DEFAULT_EVALUATION_VALUES.sensoperception,
    memory_data: DEFAULT_EVALUATION_VALUES.memory,
    thought_data: DEFAULT_EVALUATION_VALUES.thought,
    language_data: DEFAULT_EVALUATION_VALUES.language,
    mood_data: DEFAULT_EVALUATION_VALUES.mood,
    will_data: DEFAULT_EVALUATION_VALUES.will,
    psychomotor_data: DEFAULT_EVALUATION_VALUES.psychomotor,
    intelligence_data: DEFAULT_EVALUATION_VALUES.intelligence,
    personality_data: DEFAULT_EVALUATION_VALUES.personality,
  };
  
  const result = validateSessionEvaluation(validData);
  return result.isValid;
}

/**
 * Teste 2: Avaliação completamente vazia (deve falhar)
 */
function testEmptyEvaluation() {
  const emptyData = {
    session_id: '123e4567-e89b-12d3-a456-426614174000',
    patient_id: '223e4567-e89b-12d3-a456-426614174001',
    evaluated_by: '323e4567-e89b-12d3-a456-426614174002',
    consciousness_data: DEFAULT_EVALUATION_VALUES.consciousness,
    orientation_data: DEFAULT_EVALUATION_VALUES.orientation,
    attention_data: DEFAULT_EVALUATION_VALUES.attention,
    sensoperception_data: DEFAULT_EVALUATION_VALUES.sensoperception,
    memory_data: DEFAULT_EVALUATION_VALUES.memory,
    thought_data: DEFAULT_EVALUATION_VALUES.thought,
    language_data: DEFAULT_EVALUATION_VALUES.language,
    mood_data: DEFAULT_EVALUATION_VALUES.mood,
    will_data: DEFAULT_EVALUATION_VALUES.will,
    psychomotor_data: DEFAULT_EVALUATION_VALUES.psychomotor,
    intelligence_data: DEFAULT_EVALUATION_VALUES.intelligence,
    personality_data: DEFAULT_EVALUATION_VALUES.personality,
  };
  
  const result = validateSessionEvaluation(emptyData);
  // Deve falhar porque não tem conteúdo clínico mínimo
  return !result.isValid;
}

/**
 * Teste 3: Valor bipolar fora do range (-100 a +100) deve falhar
 */
function testBipolarOutOfRange() {
  const invalidData = {
    session_id: '123e4567-e89b-12d3-a456-426614174000',
    patient_id: '223e4567-e89b-12d3-a456-426614174001',
    evaluated_by: '323e4567-e89b-12d3-a456-426614174002',
    consciousness_data: {
      ...DEFAULT_EVALUATION_VALUES.consciousness,
      level: 150, // Fora do range!
    },
    orientation_data: DEFAULT_EVALUATION_VALUES.orientation,
    attention_data: DEFAULT_EVALUATION_VALUES.attention,
    sensoperception_data: DEFAULT_EVALUATION_VALUES.sensoperception,
    memory_data: DEFAULT_EVALUATION_VALUES.memory,
    thought_data: DEFAULT_EVALUATION_VALUES.thought,
    language_data: DEFAULT_EVALUATION_VALUES.language,
    mood_data: DEFAULT_EVALUATION_VALUES.mood,
    will_data: DEFAULT_EVALUATION_VALUES.will,
    psychomotor_data: DEFAULT_EVALUATION_VALUES.psychomotor,
    intelligence_data: DEFAULT_EVALUATION_VALUES.intelligence,
    personality_data: DEFAULT_EVALUATION_VALUES.personality,
  };
  
  const result = validateSessionEvaluation(invalidData);
  return !result.isValid;
}

/**
 * Teste 4: Valor percentil fora do range (0 a 100) deve falhar
 */
function testPercentileOutOfRange() {
  const invalidData = {
    session_id: '123e4567-e89b-12d3-a456-426614174000',
    patient_id: '223e4567-e89b-12d3-a456-426614174001',
    evaluated_by: '323e4567-e89b-12d3-a456-426614174002',
    consciousness_data: DEFAULT_EVALUATION_VALUES.consciousness,
    orientation_data: {
      ...DEFAULT_EVALUATION_VALUES.orientation,
      insight: 120, // Fora do range!
    },
    attention_data: DEFAULT_EVALUATION_VALUES.attention,
    sensoperception_data: DEFAULT_EVALUATION_VALUES.sensoperception,
    memory_data: DEFAULT_EVALUATION_VALUES.memory,
    thought_data: DEFAULT_EVALUATION_VALUES.thought,
    language_data: DEFAULT_EVALUATION_VALUES.language,
    mood_data: DEFAULT_EVALUATION_VALUES.mood,
    will_data: DEFAULT_EVALUATION_VALUES.will,
    psychomotor_data: DEFAULT_EVALUATION_VALUES.psychomotor,
    intelligence_data: DEFAULT_EVALUATION_VALUES.intelligence,
    personality_data: DEFAULT_EVALUATION_VALUES.personality,
  };
  
  const result = validateSessionEvaluation(invalidData);
  return !result.isValid;
}

/**
 * Teste 5: Enum inválido deve falhar
 */
function testInvalidEnum() {
  const invalidData = {
    session_id: '123e4567-e89b-12d3-a456-426614174000',
    patient_id: '223e4567-e89b-12d3-a456-426614174001',
    evaluated_by: '323e4567-e89b-12d3-a456-426614174002',
    consciousness_data: DEFAULT_EVALUATION_VALUES.consciousness,
    orientation_data: {
      ...DEFAULT_EVALUATION_VALUES.orientation,
      reality_judgment: 'invalid_value', // Enum inválido
    },
    attention_data: DEFAULT_EVALUATION_VALUES.attention,
    sensoperception_data: DEFAULT_EVALUATION_VALUES.sensoperception,
    memory_data: DEFAULT_EVALUATION_VALUES.memory,
    thought_data: DEFAULT_EVALUATION_VALUES.thought,
    language_data: DEFAULT_EVALUATION_VALUES.language,
    mood_data: DEFAULT_EVALUATION_VALUES.mood,
    will_data: DEFAULT_EVALUATION_VALUES.will,
    psychomotor_data: DEFAULT_EVALUATION_VALUES.psychomotor,
    intelligence_data: DEFAULT_EVALUATION_VALUES.intelligence,
    personality_data: DEFAULT_EVALUATION_VALUES.personality,
  };
  
  const result = validateSessionEvaluation(invalidData);
  return !result.isValid;
}

/**
 * Teste 6: UUID inválido deve falhar
 */
function testInvalidUUID() {
  const invalidData = {
    session_id: 'not-a-uuid',
    patient_id: '223e4567-e89b-12d3-a456-426614174001',
    evaluated_by: '323e4567-e89b-12d3-a456-426614174002',
    consciousness_data: DEFAULT_EVALUATION_VALUES.consciousness,
    orientation_data: DEFAULT_EVALUATION_VALUES.orientation,
    attention_data: DEFAULT_EVALUATION_VALUES.attention,
    sensoperception_data: DEFAULT_EVALUATION_VALUES.sensoperception,
    memory_data: DEFAULT_EVALUATION_VALUES.memory,
    thought_data: DEFAULT_EVALUATION_VALUES.thought,
    language_data: DEFAULT_EVALUATION_VALUES.language,
    mood_data: DEFAULT_EVALUATION_VALUES.mood,
    will_data: DEFAULT_EVALUATION_VALUES.will,
    psychomotor_data: DEFAULT_EVALUATION_VALUES.psychomotor,
    intelligence_data: DEFAULT_EVALUATION_VALUES.intelligence,
    personality_data: DEFAULT_EVALUATION_VALUES.personality,
  };
  
  const result = validateSessionEvaluation(invalidData);
  return !result.isValid;
}

/**
 * Teste 7: Pelo menos 3 funções com conteúdo (deve passar)
 */
function testMinimumThreeFunctionsWithContent() {
  const validData = {
    session_id: '123e4567-e89b-12d3-a456-426614174000',
    patient_id: '223e4567-e89b-12d3-a456-426614174001',
    evaluated_by: '323e4567-e89b-12d3-a456-426614174002',
    consciousness_data: {
      ...DEFAULT_EVALUATION_VALUES.consciousness,
      level: -20, // Mudança de valor
    },
    orientation_data: {
      ...DEFAULT_EVALUATION_VALUES.orientation,
      insight: 50, // Mudança de valor
    },
    attention_data: {
      ...DEFAULT_EVALUATION_VALUES.attention,
      distractibility: true, // Mudança de boolean
    },
    sensoperception_data: DEFAULT_EVALUATION_VALUES.sensoperception,
    memory_data: DEFAULT_EVALUATION_VALUES.memory,
    thought_data: DEFAULT_EVALUATION_VALUES.thought,
    language_data: DEFAULT_EVALUATION_VALUES.language,
    mood_data: DEFAULT_EVALUATION_VALUES.mood,
    will_data: DEFAULT_EVALUATION_VALUES.will,
    psychomotor_data: DEFAULT_EVALUATION_VALUES.psychomotor,
    intelligence_data: DEFAULT_EVALUATION_VALUES.intelligence,
    personality_data: DEFAULT_EVALUATION_VALUES.personality,
  };
  
  const result = validateSessionEvaluation(validData);
  return result.isValid;
}

/**
 * ============================================================================
 * RUNNER
 * ============================================================================
 */

export function runSessionEvaluationTemplateTests() {
  console.log('====================================');
  console.log('FASE C2.5B - Session Evaluation Template Tests');
  console.log('====================================\n');
  
  runTest('✅ Teste 1: Avaliação completa válida', testValidCompleteEvaluation);
  runTest('✅ Teste 2: Avaliação vazia (deve falhar)', testEmptyEvaluation);
  runTest('✅ Teste 3: Bipolar fora do range (deve falhar)', testBipolarOutOfRange);
  runTest('✅ Teste 4: Percentil fora do range (deve falhar)', testPercentileOutOfRange);
  runTest('✅ Teste 5: Enum inválido (deve falhar)', testInvalidEnum);
  runTest('✅ Teste 6: UUID inválido (deve falhar)', testInvalidUUID);
  runTest('✅ Teste 7: Mínimo 3 funções preenchidas (deve passar)', testMinimumThreeFunctionsWithContent);
  
  console.log('\n====================================');
  console.log('RESULTADOS');
  console.log('====================================\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.testName}`);
    if (result.error) {
      console.log(`   Erro: ${result.error}`);
    }
  });
  
  console.log(`\nTotal: ${results.length} | Passou: ${passed} | Falhou: ${failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
  } else {
    console.log(`\n⚠️ ${failed} teste(s) falharam`);
  }
  
  return { passed, failed, results };
}

// Auto-executar se rodado diretamente
if (typeof window !== 'undefined') {
  (window as any).runSessionEvaluationTemplateTests = runSessionEvaluationTemplateTests;
}
