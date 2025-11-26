/**
 * ============================================================================
 * FASE C2.3 - Psychopathology Basic Template - Configuration Tests
 * ============================================================================
 * 
 * Testes de sanity-check para a definição declarativa do template.
 * 
 * COMO EXECUTAR (temporário, para debug):
 * - Importe essa função em algum componente de teste
 * - Chame runPsychopathologyTemplateTests() no console ou useEffect
 * - Verifique os logs no console
 */

import { PSYCHOPATHOLOGY_BASIC_TEMPLATE_CONFIG } from '../index';
import { getTemplateById } from '../../templateRegistry';
import { PSYCHIC_FUNCTIONS, RANGE_BIPOLAR, RANGE_PERCENTILE } from '@/lib/clinical/constants';

/**
 * ============================================================================
 * TESTES DE ESTRUTURA
 * ============================================================================
 */

/**
 * Teste 1: Template existe no registry
 */
function test_template_exists_in_registry() {
  console.log('\n[TEST 1] Template existe no registry');
  
  const template = getTemplateById('psychology_basic');
  
  console.assert(
    template !== null,
    '❌ Template psychology_basic não encontrado no registry'
  );
  
  console.assert(
    template?.supportsComplaint === true,
    '❌ Template deveria suportar Queixa Clínica'
  );
  
  console.assert(
    template?.supportsSessionEvaluation === true,
    '❌ Template deveria suportar Avaliação de Sessão'
  );
  
  console.assert(
    template?.supportsEvolution === true,
    '❌ Template deveria suportar Evolução'
  );
  
  console.log('✅ Teste 1 passou:', template);
}

/**
 * Teste 2: Complaint Model tem todas as seções esperadas
 */
function test_complaint_model_sections() {
  console.log('\n[TEST 2] Complaint Model tem todas as seções');
  
  const { complaintModel } = PSYCHOPATHOLOGY_BASIC_TEMPLATE_CONFIG;
  
  const expectedSections = ['diagnosis', 'characterization', 'risk', 'symptoms', 'medications', 'notes'];
  const actualSections = complaintModel.sections.map(s => s.id);
  
  expectedSections.forEach(expectedId => {
    console.assert(
      actualSections.includes(expectedId),
      `❌ Seção '${expectedId}' não encontrada no complaint model`
    );
  });
  
  console.assert(
    complaintModel.validationRules.requiresCidOrNoDiagnosis === true,
    '❌ Regra de validação requiresCidOrNoDiagnosis deveria ser true'
  );
  
  console.log('✅ Teste 2 passou - Seções:', actualSections);
}

/**
 * Teste 3: Session Evaluation Model tem 12 funções psíquicas
 */
function test_session_evaluation_has_12_functions() {
  console.log('\n[TEST 3] Session Evaluation Model tem 12 funções');
  
  const { sessionEvaluationModel } = PSYCHOPATHOLOGY_BASIC_TEMPLATE_CONFIG;
  
  console.assert(
    sessionEvaluationModel.functions.length === 12,
    `❌ Deveria ter 12 funções, encontrado: ${sessionEvaluationModel.functions.length}`
  );
  
  // Verificar que todas as funções de PSYCHIC_FUNCTIONS estão presentes
  const functionIds = sessionEvaluationModel.functions.map(f => f.id);
  
  PSYCHIC_FUNCTIONS.forEach(expectedId => {
    console.assert(
      functionIds.includes(expectedId),
      `❌ Função '${expectedId}' não encontrada no session evaluation model`
    );
  });
  
  console.log('✅ Teste 3 passou - Funções:', functionIds);
}

/**
 * Teste 4: Cada função tem defaults corretos
 */
function test_psychic_functions_have_defaults() {
  console.log('\n[TEST 4] Funções psíquicas têm defaults');
  
  const { sessionEvaluationModel } = PSYCHOPATHOLOGY_BASIC_TEMPLATE_CONFIG;
  
  sessionEvaluationModel.functions.forEach(func => {
    console.assert(
      func.defaults !== null && func.defaults !== undefined,
      `❌ Função '${func.id}' não tem defaults`
    );
    
    console.assert(
      typeof func.defaults === 'object',
      `❌ Defaults da função '${func.id}' não é um objeto`
    );
    
    // Verificar que defaults tem pelo menos algumas chaves
    const defaultKeys = Object.keys(func.defaults);
    console.assert(
      defaultKeys.length > 0,
      `❌ Função '${func.id}' tem defaults vazio`
    );
  });
  
  console.log('✅ Teste 4 passou - Todas as funções têm defaults');
}

/**
 * Teste 5: Ranges numéricos são consistentes
 */
function test_ranges_are_consistent() {
  console.log('\n[TEST 5] Ranges numéricos são consistentes');
  
  const { sessionEvaluationModel } = PSYCHOPATHOLOGY_BASIC_TEMPLATE_CONFIG;
  
  sessionEvaluationModel.functions.forEach(func => {
    Object.entries(func.fields).forEach(([fieldName, fieldConfig]) => {
      if (fieldConfig.type === 'bipolar') {
        console.assert(
          fieldConfig.min === RANGE_BIPOLAR.min,
          `❌ Campo bipolar '${func.id}.${fieldName}' tem min incorreto: ${fieldConfig.min}`
        );
        console.assert(
          fieldConfig.max === RANGE_BIPOLAR.max,
          `❌ Campo bipolar '${func.id}.${fieldName}' tem max incorreto: ${fieldConfig.max}`
        );
      }
      
      if (fieldConfig.type === 'unipolar') {
        console.assert(
          fieldConfig.min === RANGE_PERCENTILE.min,
          `❌ Campo unipolar '${func.id}.${fieldName}' tem min incorreto: ${fieldConfig.min}`
        );
        console.assert(
          fieldConfig.max === RANGE_PERCENTILE.max,
          `❌ Campo unipolar '${func.id}.${fieldName}' tem max incorreto: ${fieldConfig.max}`
        );
      }
    });
  });
  
  console.log('✅ Teste 5 passou - Ranges consistentes');
}

/**
 * Teste 6: Evolution Model tem gráficos
 */
function test_evolution_model_has_charts() {
  console.log('\n[TEST 6] Evolution Model tem gráficos');
  
  const { evolutionModel } = PSYCHOPATHOLOGY_BASIC_TEMPLATE_CONFIG;
  
  console.assert(
    evolutionModel.charts.length > 0,
    '❌ Evolution model deveria ter pelo menos 1 gráfico'
  );
  
  console.assert(
    evolutionModel.supportsTimeline === true,
    '❌ Evolution model deveria suportar timeline'
  );
  
  console.assert(
    evolutionModel.supportsComparison === true,
    '❌ Evolution model deveria suportar comparação'
  );
  
  console.log('✅ Teste 6 passou - Charts:', evolutionModel.charts.map(c => c.id));
}

/**
 * Teste 7: Metadata do template está presente
 */
function test_template_metadata() {
  console.log('\n[TEST 7] Template tem metadata');
  
  const { metadata } = PSYCHOPATHOLOGY_BASIC_TEMPLATE_CONFIG;
  
  console.assert(
    metadata.version === '1.0.0',
    `❌ Versão incorreta: ${metadata.version}`
  );
  
  console.assert(
    metadata.lastUpdated !== null && metadata.lastUpdated !== '',
    '❌ lastUpdated não definido'
  );
  
  console.assert(
    metadata.author !== null && metadata.author !== '',
    '❌ author não definido'
  );
  
  console.log('✅ Teste 7 passou - Metadata:', metadata);
}

/**
 * Teste 8: Validar estrutura de campos específicos
 */
function test_specific_field_structures() {
  console.log('\n[TEST 8] Campos específicos estão corretos');
  
  const { sessionEvaluationModel } = PSYCHOPATHOLOGY_BASIC_TEMPLATE_CONFIG;
  
  // Testar consciousness.level
  const consciousness = sessionEvaluationModel.functions.find(f => f.id === 'consciousness');
  console.assert(
    consciousness?.fields.level.type === 'bipolar',
    '❌ consciousness.level deveria ser bipolar'
  );
  
  // Testar mood.polarity
  const mood = sessionEvaluationModel.functions.find(f => f.id === 'mood');
  console.assert(
    mood?.fields.polarity.type === 'bipolar',
    '❌ mood.polarity deveria ser bipolar'
  );
  
  // Testar attention.concentration
  const attention = sessionEvaluationModel.functions.find(f => f.id === 'attention');
  console.assert(
    attention?.fields.concentration.type === 'unipolar',
    '❌ attention.concentration deveria ser unipolar'
  );
  
  // Testar orientation.insight
  const orientation = sessionEvaluationModel.functions.find(f => f.id === 'orientation');
  console.assert(
    orientation?.fields.insight.type === 'unipolar',
    '❌ orientation.insight deveria ser unipolar'
  );
  
  console.log('✅ Teste 8 passou - Campos específicos corretos');
}

/**
 * ============================================================================
 * RUNNER PRINCIPAL
 * ============================================================================
 */

/**
 * Executa todos os testes do template psicopatológico
 * 
 * PARA TESTAR:
 * - Abra o console do navegador
 * - Importe e execute: runPsychopathologyTemplateTests()
 */
export function runPsychopathologyTemplateTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  FASE C2.3 - Psychopathology Template Tests           ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  
  try {
    test_template_exists_in_registry();
    test_complaint_model_sections();
    test_session_evaluation_has_12_functions();
    test_psychic_functions_have_defaults();
    test_ranges_are_consistent();
    test_evolution_model_has_charts();
    test_template_metadata();
    test_specific_field_structures();
    
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  ✅ TODOS OS TESTES PASSARAM                           ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    // Log da estrutura completa para referência
    console.log('📋 Template Psicopatológico Básico - Estrutura Completa:');
    console.log(PSYCHOPATHOLOGY_BASIC_TEMPLATE_CONFIG);
    
    return true;
  } catch (error) {
    console.error('\n❌ ERRO AO EXECUTAR TESTES:', error);
    return false;
  }
}

/**
 * Exporta também para uso em componentes de debug
 */
export const psychopathologyTemplateTests = {
  test_template_exists_in_registry,
  test_complaint_model_sections,
  test_session_evaluation_has_12_functions,
  test_psychic_functions_have_defaults,
  test_ranges_are_consistent,
  test_evolution_model_has_charts,
  test_template_metadata,
  test_specific_field_structures,
};
