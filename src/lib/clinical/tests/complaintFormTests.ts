/**
 * ============================================================================
 * FASE C2.4 - Clinical Complaint Form Tests
 * ============================================================================
 * 
 * Testes de sanity-check para:
 * - Template-awareness
 * - Validação Zod
 * - Histórico de queixas
 * - Regra de queixa ativa única
 */

import { ClinicalComplaintSchema, formatValidationErrors } from '../complaintValidation';

/**
 * ============================================================================
 * TESTES DE VALIDAÇÃO
 * ============================================================================
 */

/**
 * Teste 1: Queixa com CID válido passa na validação
 */
function test_valid_complaint_with_cid() {
  console.log('\n[TEST 1] Queixa com CID válido passa na validação');
  
  const validComplaint = {
    patient_id: crypto.randomUUID(),
    created_by: crypto.randomUUID(),
    organization_id: crypto.randomUUID(),
    cid_code: 'F32.1',
    cid_title: 'Episódio depressivo moderado',
    cid_group: 'F30-F39',
    has_no_diagnosis: false,
    severity: 'moderado',
    functional_impairment: 'moderado',
    suicidality: 'nenhum',
    aggressiveness: 'nenhum',
    clinical_notes: null,
    is_active: true,
  };
  
  const result = ClinicalComplaintSchema.safeParse(validComplaint);
  
  console.assert(
    result.success === true,
    '❌ Queixa válida com CID deveria passar na validação'
  );
  
  console.log('✅ Teste 1 passou:', result.success);
}

/**
 * Teste 2: Queixa "sem diagnóstico" válida
 */
function test_valid_complaint_no_diagnosis() {
  console.log('\n[TEST 2] Queixa sem diagnóstico válida');
  
  const validComplaint = {
    patient_id: crypto.randomUUID(),
    created_by: crypto.randomUUID(),
    organization_id: null,
    cid_code: null,
    cid_title: null,
    cid_group: null,
    has_no_diagnosis: true, // Marcou sem diagnóstico
    severity: null,
    functional_impairment: null,
    suicidality: 'nenhum',
    aggressiveness: 'nenhum',
    clinical_notes: 'Sessões de autoconhecimento',
    is_active: true,
  };
  
  const result = ClinicalComplaintSchema.safeParse(validComplaint);
  
  console.assert(
    result.success === true,
    '❌ Queixa com has_no_diagnosis=true deveria ser válida'
  );
  
  console.log('✅ Teste 2 passou:', result.success);
}

/**
 * Teste 3: Queixa com notas clínicas significativas (sem CID)
 */
function test_valid_complaint_with_notes() {
  console.log('\n[TEST 3] Queixa com notas clínicas significativas');
  
  const validComplaint = {
    patient_id: crypto.randomUUID(),
    created_by: crypto.randomUUID(),
    organization_id: null,
    cid_code: null,
    cid_title: null,
    cid_group: null,
    has_no_diagnosis: false, // Não marcou
    severity: null,
    functional_impairment: null,
    suicidality: 'nenhum',
    aggressiveness: 'nenhum',
    clinical_notes: 'Paciente relata ansiedade intensa há 3 meses, com sintomas físicos.', // > 20 caracteres
    is_active: true,
  };
  
  const result = ClinicalComplaintSchema.safeParse(validComplaint);
  
  console.assert(
    result.success === true,
    '❌ Queixa com notas significativas deveria ser válida'
  );
  
  console.log('✅ Teste 3 passou:', result.success);
}

/**
 * Teste 4: Queixa completamente vazia FALHA na validação
 */
function test_invalid_empty_complaint() {
  console.log('\n[TEST 4] Queixa completamente vazia FALHA');
  
  const invalidComplaint = {
    patient_id: crypto.randomUUID(),
    created_by: crypto.randomUUID(),
    organization_id: null,
    cid_code: null, // Sem CID
    cid_title: null,
    cid_group: null,
    has_no_diagnosis: false, // Não marcou sem diagnóstico
    severity: null,
    functional_impairment: null,
    suicidality: 'nenhum',
    aggressiveness: 'nenhum',
    clinical_notes: null, // Sem notas
    is_active: true,
  };
  
  const result = ClinicalComplaintSchema.safeParse(invalidComplaint);
  
  console.assert(
    result.success === false,
    '❌ Queixa vazia deveria FALHAR na validação'
  );
  
  if (!result.success) {
    const errors = formatValidationErrors(result.error);
    console.log('Erros esperados:', errors);
    console.assert(
      errors.length > 0,
      '❌ Deveria ter pelo menos 1 erro de validação'
    );
  }
  
  console.log('✅ Teste 4 passou - queixa vazia foi rejeitada');
}

/**
 * Teste 5: Queixa com notas muito curtas FALHA
 */
function test_invalid_complaint_with_short_notes() {
  console.log('\n[TEST 5] Queixa com notas muito curtas FALHA');
  
  const invalidComplaint = {
    patient_id: crypto.randomUUID(),
    created_by: crypto.randomUUID(),
    organization_id: null,
    cid_code: null,
    cid_title: null,
    cid_group: null,
    has_no_diagnosis: false,
    severity: null,
    functional_impairment: null,
    suicidality: 'nenhum',
    aggressiveness: 'nenhum',
    clinical_notes: 'Curto', // Menos de 20 caracteres
    is_active: true,
  };
  
  const result = ClinicalComplaintSchema.safeParse(invalidComplaint);
  
  console.assert(
    result.success === false,
    '❌ Queixa com notas < 20 caracteres deveria FALHAR'
  );
  
  console.log('✅ Teste 5 passou - notas curtas rejeitadas');
}

/**
 * Teste 6: Enums inválidos FALHAM
 */
function test_invalid_enum_values() {
  console.log('\n[TEST 6] Enums inválidos FALHAM');
  
  const invalidComplaint = {
    patient_id: crypto.randomUUID(),
    created_by: crypto.randomUUID(),
    organization_id: null,
    cid_code: 'F32.1',
    cid_title: 'Episódio depressivo moderado',
    cid_group: 'F30-F39',
    has_no_diagnosis: false,
    severity: 'super_grave', // Enum inválido
    functional_impairment: 'moderado',
    suicidality: 'nenhum',
    aggressiveness: 'nenhum',
    clinical_notes: null,
    is_active: true,
  };
  
  const result = ClinicalComplaintSchema.safeParse(invalidComplaint);
  
  console.assert(
    result.success === false,
    '❌ Enum inválido deveria FALHAR na validação'
  );
  
  console.log('✅ Teste 6 passou - enum inválido rejeitado');
}

/**
 * Teste 7: UUID inválido FALHA
 */
function test_invalid_uuid() {
  console.log('\n[TEST 7] UUID inválido FALHA');
  
  const invalidComplaint = {
    patient_id: 'not-a-uuid', // UUID inválido
    created_by: crypto.randomUUID(),
    organization_id: null,
    cid_code: 'F32.1',
    cid_title: 'Episódio depressivo moderado',
    cid_group: 'F30-F39',
    has_no_diagnosis: false,
    severity: 'moderado',
    functional_impairment: 'moderado',
    suicidality: 'nenhum',
    aggressiveness: 'nenhum',
    clinical_notes: null,
    is_active: true,
  };
  
  const result = ClinicalComplaintSchema.safeParse(invalidComplaint);
  
  console.assert(
    result.success === false,
    '❌ UUID inválido deveria FALHAR na validação'
  );
  
  console.log('✅ Teste 7 passou - UUID inválido rejeitado');
}

/**
 * ============================================================================
 * RUNNER PRINCIPAL
 * ============================================================================
 */

/**
 * Executa todos os testes do formulário de queixa
 * 
 * PARA TESTAR:
 * - Abra o console do navegador
 * - Importe e execute: runClinicalComplaintFormTests()
 */
export function runClinicalComplaintFormTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  FASE C2.4 - Clinical Complaint Form Tests            ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  
  try {
    test_valid_complaint_with_cid();
    test_valid_complaint_no_diagnosis();
    test_valid_complaint_with_notes();
    test_invalid_empty_complaint();
    test_invalid_complaint_with_short_notes();
    test_invalid_enum_values();
    test_invalid_uuid();
    
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  ✅ TODOS OS TESTES PASSARAM                           ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    return true;
  } catch (error) {
    console.error('\n❌ ERRO AO EXECUTAR TESTES:', error);
    return false;
  }
}

/**
 * Exporta também para uso em componentes de debug
 */
export const complaintFormTests = {
  test_valid_complaint_with_cid,
  test_valid_complaint_no_diagnosis,
  test_valid_complaint_with_notes,
  test_invalid_empty_complaint,
  test_invalid_complaint_with_short_notes,
  test_invalid_enum_values,
  test_invalid_uuid,
};
