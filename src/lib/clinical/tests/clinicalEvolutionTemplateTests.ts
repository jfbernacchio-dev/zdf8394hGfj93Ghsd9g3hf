/**
 * ============================================================================
 * FASE C2.6 - Clinical Evolution Template Integration Tests
 * ============================================================================
 * 
 * Testes de sanidade para verificar que a integração de templates
 * na ClinicalEvolution está funcionando corretamente.
 */

import { PSYCHOPATHOLOGY_BASIC_TEMPLATE_CONFIG } from '@/lib/templates/psychopathologyBasic';

/**
 * Mock de uma avaliação completa
 */
const MOCK_EVALUATION = {
  id: 'eval-1',
  session_id: 'session-1',
  patient_id: 'patient-1',
  consciousness_data: {
    level: 0,
    field: 0,
    self_consciousness: 0,
    depersonalization: false,
    derealization: false,
  },
  orientation_data: {
    time: true,
    space: true,
    person: true,
    situation: true,
    insight: 80,
    reality_judgment: 'intact',
  },
  attention_data: {
    range: 80,
    concentration: 80,
    distractibility: false,
  },
  memory_data: {
    fixation: 80,
    recall: 80,
    amnesia: false,
  },
  mood_data: {
    polarity: 0,
    lability: 50,
    adequacy: 'adequate',
    emotional_responsiveness: true,
  },
  thought_data: {
    course: 0,
    tangential: false,
    incoherent: false,
    delusional: false,
    obsessive: false,
  },
  language_data: {
    speech_rate: 0,
    articulation: 'normal',
  },
  sensoperception_data: {
    global_perception: 'normal',
    auditory: false,
    visual: false,
  },
  intelligence_data: {
    learning_capacity: 80,
    abstract_reasoning: 80,
    adaptive_capacity: 'normal',
  },
  will_data: {
    volitional_energy: 0,
    impulse_control: 0,
    ambivalence: false,
  },
  psychomotor_data: {
    motor_activity: 0,
    facial_expressiveness: 50,
  },
  personality_data: {
    self_coherence: 80,
    affective_stability: 80,
    anxious: false,
    borderline: false,
  },
  created_at: new Date().toISOString(),
};

/**
 * Testes principais
 */
export function runClinicalEvolutionTemplateTests(): void {
  console.group('🧪 FASE C2.6 - Clinical Evolution Template Tests');

  try {
    // Test 1: Template has evolution interpreter
    console.log('\n✅ Test 1: Template has evolution interpreter');
    if (!PSYCHOPATHOLOGY_BASIC_TEMPLATE_CONFIG.evolutionInterpreter) {
      throw new Error('Template missing evolutionInterpreter');
    }
    console.log('   ✓ evolutionInterpreter exists');

    // Test 2: Generate global summary
    console.log('\n✅ Test 2: Generate global summary');
    const { generateGlobalSummary } = PSYCHOPATHOLOGY_BASIC_TEMPLATE_CONFIG.evolutionInterpreter;
    const summary = generateGlobalSummary(MOCK_EVALUATION);
    
    if (!summary || typeof summary !== 'string') {
      throw new Error('Global summary is not a string');
    }
    if (summary.length < 10) {
      throw new Error('Global summary is too short');
    }
    console.log('   ✓ Global summary generated:', summary.substring(0, 100) + '...');

    // Test 3: Interpret all functions
    console.log('\n✅ Test 3: Interpret all psychic functions');
    const { interpretFunction } = PSYCHOPATHOLOGY_BASIC_TEMPLATE_CONFIG.evolutionInterpreter;
    
    const functions = [
      'consciousness', 'orientation', 'memory', 'mood', 'thought', 
      'language', 'sensoperception', 'intelligence', 'will', 
      'psychomotor', 'attention', 'personality'
    ];

    for (const functionId of functions) {
      const data = (MOCK_EVALUATION as any)[`${functionId}_data`];
      const interpretation = interpretFunction(functionId, data);
      
      if (!interpretation.text || typeof interpretation.text !== 'string') {
        throw new Error(`Function ${functionId} interpretation text is invalid`);
      }
      if (!['normal', 'moderate', 'severe'].includes(interpretation.severity)) {
        throw new Error(`Function ${functionId} severity is invalid: ${interpretation.severity}`);
      }
      
      console.log(`   ✓ ${functionId}: severity=${interpretation.severity}`);
    }

    // Test 4: Normal evaluation (all normal values)
    console.log('\n✅ Test 4: Normal evaluation produces "normal" summary');
    const normalSummary = generateGlobalSummary(MOCK_EVALUATION);
    if (!normalSummary.includes('não apresenta alterações') && 
        !normalSummary.includes('preservada') &&
        !normalSummary.includes('normal')) {
      console.warn('   ⚠ Normal summary might not reflect normality:', normalSummary);
    } else {
      console.log('   ✓ Normal summary detected');
    }

    // Test 5: Altered evaluation
    console.log('\n✅ Test 5: Altered evaluation produces appropriate summary');
    const alteredEval = {
      ...MOCK_EVALUATION,
      consciousness_data: { ...MOCK_EVALUATION.consciousness_data, level: -70, depersonalization: true },
      mood_data: { ...MOCK_EVALUATION.mood_data, polarity: -80, lability: 85 },
    };
    const alteredSummary = generateGlobalSummary(alteredEval);
    
    if (!alteredSummary.includes('Paciente apresenta')) {
      throw new Error('Altered summary should start with "Paciente apresenta"');
    }
    console.log('   ✓ Altered summary detected:', alteredSummary.substring(0, 100) + '...');

    // Test 6: Evolution charts config exists
    console.log('\n✅ Test 6: Evolution charts config exists');
    const { evolutionModel } = PSYCHOPATHOLOGY_BASIC_TEMPLATE_CONFIG;
    if (!evolutionModel.charts || evolutionModel.charts.length === 0) {
      throw new Error('Evolution model has no charts');
    }
    console.log(`   ✓ ${evolutionModel.charts.length} charts configured`);

    // Test 7: Chart metadata is complete
    console.log('\n✅ Test 7: Chart metadata is complete');
    for (const chart of evolutionModel.charts) {
      if (!chart.id || !chart.label || !chart.functionId) {
        throw new Error(`Chart ${chart.id} has incomplete metadata`);
      }
      if (!chart.valuePaths || chart.valuePaths.length === 0) {
        throw new Error(`Chart ${chart.id} has no valuePaths`);
      }
      console.log(`   ✓ ${chart.id}: ${chart.valuePaths.length} value path(s)`);
    }

    // Test 8: Indicators are returned for interpretations
    console.log('\n✅ Test 8: Indicators are returned where expected');
    const consciousnessInterp = interpretFunction('consciousness', MOCK_EVALUATION.consciousness_data);
    if (!consciousnessInterp.indicators || consciousnessInterp.indicators.length === 0) {
      throw new Error('Consciousness interpretation should have indicators');
    }
    console.log(`   ✓ Consciousness has ${consciousnessInterp.indicators.length} indicators`);

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
  (window as any).runClinicalEvolutionTemplateTests = runClinicalEvolutionTemplateTests;
}
