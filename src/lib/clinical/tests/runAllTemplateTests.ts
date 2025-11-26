/**
 * ============================================================================
 * FASE C2.8 - Unified Template Tests Runner
 * ============================================================================
 * 
 * Executa todos os testes de template do sistema em sequência.
 * Útil para QA rápido e smoke tests.
 */

import { runClinicalComplaintFormTests } from './complaintFormTests';
import { runSessionEvaluationFormStructuralTests } from './sessionEvaluationFormTests';
import { runSessionEvaluationTemplateTests } from './sessionEvaluationTemplateTests';
import { runClinicalEvolutionTemplateTests } from './clinicalEvolutionTemplateTests';
import { runPatientOverviewTemplateTests } from './patientOverviewTemplateTests';

/**
 * Executa todos os testes de template do sistema
 * 
 * Para rodar no browser console:
 * ```
 * import { runAllTemplateTests } from '@/lib/clinical/tests/runAllTemplateTests';
 * runAllTemplateTests();
 * ```
 */
export function runAllTemplateTests(): void {
  console.group('🧪 TRACK C2 - Running All Template Tests');
  console.log('Starting comprehensive template system tests...\n');

  let allPassed = true;

  try {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 Test Suite 1/5: Clinical Complaint Form');
    console.log('═══════════════════════════════════════════════════════════');
    runClinicalComplaintFormTests();
    console.log('✅ Complaint Form Tests: PASSED\n');
  } catch (error) {
    console.error('❌ Complaint Form Tests: FAILED', error);
    allPassed = false;
  }

  try {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 Test Suite 2/5: Session Evaluation Form');
    console.log('═══════════════════════════════════════════════════════════');
    runSessionEvaluationFormStructuralTests();
    console.log('✅ Session Evaluation Form Tests: PASSED\n');
  } catch (error) {
    console.error('❌ Session Evaluation Form Tests: FAILED', error);
    allPassed = false;
  }

  try {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 Test Suite 3/5: Session Evaluation Template Integration');
    console.log('═══════════════════════════════════════════════════════════');
    runSessionEvaluationTemplateTests();
    console.log('✅ Session Evaluation Template Tests: PASSED\n');
  } catch (error) {
    console.error('❌ Session Evaluation Template Tests: FAILED', error);
    allPassed = false;
  }

  try {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 Test Suite 4/5: Clinical Evolution Template Integration');
    console.log('═══════════════════════════════════════════════════════════');
    runClinicalEvolutionTemplateTests();
    console.log('✅ Clinical Evolution Template Tests: PASSED\n');
  } catch (error) {
    console.error('❌ Clinical Evolution Template Tests: FAILED', error);
    allPassed = false;
  }

  try {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 Test Suite 5/5: Patient Overview Template Integration');
    console.log('═══════════════════════════════════════════════════════════');
    runPatientOverviewTemplateTests();
    console.log('✅ Patient Overview Template Tests: PASSED\n');
  } catch (error) {
    console.error('❌ Patient Overview Template Tests: FAILED', error);
    allPassed = false;
  }

  console.log('═══════════════════════════════════════════════════════════');
  if (allPassed) {
    console.log('✅ ALL TEMPLATE TESTS PASSED');
    console.log('The template system is functioning correctly.');
  } else {
    console.error('❌ SOME TESTS FAILED');
    console.error('Review the output above for details.');
  }
  console.log('═══════════════════════════════════════════════════════════');

  console.groupEnd();
}

/**
 * Helper para rodar no browser console
 */
if (typeof window !== 'undefined') {
  (window as any).runAllTemplateTests = runAllTemplateTests;
  console.log('[TEMPLATE TESTS] runAllTemplateTests() available in window');
}
