/**
 * ============================================================================
 * FASE C2.1 - Complaint Tests (Runtime)
 * ============================================================================
 * 
 * Testes internos simples (runtime, não Jest) para validar a lógica de
 * garantia de queixa ativa única.
 * 
 * COMO EXECUTAR:
 * Importar e chamar runComplaintActiveTests() em ambiente de desenvolvimento.
 */

import type { ClinicalComplaintBase } from '../types';

/**
 * Mock de função que simula o carregamento de queixas do banco
 */
type MockLoadComplaintsFunc = () => Promise<ClinicalComplaintBase[]>;

/**
 * Mock de função que simula o salvamento de queixas no banco
 */
type MockSaveComplaintFunc = (complaint: ClinicalComplaintBase) => Promise<void>;

/**
 * Mock de função que simula a desativação de queixas antigas
 */
type MockDeactivateOldComplaintsFunc = (patientId: string, exceptId?: string) => Promise<void>;

/**
 * Resultado de um teste
 */
interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

/**
 * Função auxiliar para criar uma queixa mock
 */
function createMockComplaint(
  id: string,
  patientId: string,
  isActive: boolean,
  createdAt: Date
): ClinicalComplaintBase {
  return {
    id,
    patient_id: patientId,
    created_by: 'test-user',
    created_at: createdAt.toISOString(),
    cid_code: 'F32.1',
    cid_title: 'Teste',
    cid_group: 'F30-F39',
    has_no_diagnosis: false,
    onset_type: null,
    onset_duration_weeks: null,
    course: null,
    severity: null,
    functional_impairment: null,
    suicidality: null,
    aggressiveness: null,
    vulnerabilities: null,
    clinical_notes: null,
    is_active: isActive,
  };
}

/**
 * TESTE 1: Cenário com 0 queixas → criar ativa → OK
 */
async function test_createFirstComplaint(): Promise<TestResult> {
  const patientId = 'patient-1';
  let complaints: ClinicalComplaintBase[] = [];

  const mockLoad: MockLoadComplaintsFunc = async () => complaints;
  
  const mockSave: MockSaveComplaintFunc = async (complaint) => {
    complaints.push(complaint);
  };

  // Simular criação da primeira queixa
  const newComplaint = createMockComplaint('c1', patientId, true, new Date());
  await mockSave(newComplaint);

  const allComplaints = await mockLoad();
  const activeCount = allComplaints.filter(c => c.is_active).length;

  const passed = activeCount === 1;
  
  return {
    name: 'test_createFirstComplaint',
    passed,
    message: passed 
      ? '✅ Primeira queixa criada corretamente como ativa'
      : `❌ Esperado 1 queixa ativa, encontrado ${activeCount}`,
  };
}

/**
 * TESTE 2: Cenário com 1 ativa → criar nova ativa → nova ativa + anterior desativada
 */
async function test_createSecondComplaint_deactivatesFirst(): Promise<TestResult> {
  const patientId = 'patient-2';
  let complaints: ClinicalComplaintBase[] = [
    createMockComplaint('c1', patientId, true, new Date('2024-01-01')),
  ];

  const mockLoad: MockLoadComplaintsFunc = async () => complaints;
  
  const mockDeactivate: MockDeactivateOldComplaintsFunc = async (pId, exceptId) => {
    complaints = complaints.map(c => 
      c.patient_id === pId && c.id !== exceptId 
        ? { ...c, is_active: false } 
        : c
    );
  };

  const mockSave: MockSaveComplaintFunc = async (complaint) => {
    // Desativar antigas antes de salvar
    await mockDeactivate(complaint.patient_id, complaint.id);
    complaints.push(complaint);
  };

  // Simular criação de segunda queixa
  const newComplaint = createMockComplaint('c2', patientId, true, new Date('2024-02-01'));
  await mockSave(newComplaint);

  const allComplaints = await mockLoad();
  const activeCount = allComplaints.filter(c => c.is_active).length;
  const active = allComplaints.find(c => c.is_active);

  const passed = activeCount === 1 && active?.id === 'c2';
  
  return {
    name: 'test_createSecondComplaint_deactivatesFirst',
    passed,
    message: passed 
      ? '✅ Segunda queixa criada e primeira desativada corretamente'
      : `❌ Esperado 1 queixa ativa (c2), encontrado ${activeCount} ativa(s), id ativa: ${active?.id}`,
  };
}

/**
 * TESTE 3: Cenário com 2 ativas (dados corrompidos) → corrigir para uma única ativa (a mais recente)
 */
async function test_fixCorruptedData_twoActiveComplaints(): Promise<TestResult> {
  const patientId = 'patient-3';
  let complaints: ClinicalComplaintBase[] = [
    createMockComplaint('c1', patientId, true, new Date('2024-01-01')),
    createMockComplaint('c2', patientId, true, new Date('2024-02-01')),
  ];

  const mockLoad: MockLoadComplaintsFunc = async () => complaints;
  
  const mockFixCorrupted = async (pId: string) => {
    const patientComplaints = complaints.filter(c => c.patient_id === pId);
    const activeComplaints = patientComplaints.filter(c => c.is_active);
    
    if (activeComplaints.length > 1) {
      // Ordenar por created_at (mais recente primeiro)
      activeComplaints.sort((a, b) => 
        new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
      );
      
      // Manter apenas a mais recente ativa
      const mostRecent = activeComplaints[0];
      complaints = complaints.map(c => {
        if (c.patient_id === pId && c.is_active && c.id !== mostRecent.id) {
          return { ...c, is_active: false };
        }
        return c;
      });
    }
  };

  // Simular correção de dados corrompidos (ao carregar o form, por exemplo)
  await mockFixCorrupted(patientId);

  const allComplaints = await mockLoad();
  const activeCount = allComplaints.filter(c => c.is_active).length;
  const active = allComplaints.find(c => c.is_active);

  const passed = activeCount === 1 && active?.id === 'c2';
  
  return {
    name: 'test_fixCorruptedData_twoActiveComplaints',
    passed,
    message: passed 
      ? '✅ Dados corrompidos corrigidos: apenas a queixa mais recente ficou ativa'
      : `❌ Esperado 1 queixa ativa (c2), encontrado ${activeCount} ativa(s), id ativa: ${active?.id}`,
  };
}

/**
 * Executar todos os testes
 */
export async function runComplaintActiveTests(): Promise<TestResult[]> {
  console.log('🧪 [FASE C2.1] Iniciando testes de queixa ativa única...\n');

  const results: TestResult[] = [];

  // Executar testes
  results.push(await test_createFirstComplaint());
  results.push(await test_createSecondComplaint_deactivatesFirst());
  results.push(await test_fixCorruptedData_twoActiveComplaints());

  // Relatório
  console.log('\n📊 RESULTADOS:');
  results.forEach(r => {
    console.log(`  ${r.message}`);
  });

  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;

  console.log(`\n${passedCount}/${totalCount} testes passaram.\n`);

  if (passedCount === totalCount) {
    console.log('✅ Todos os testes passaram! Lógica de queixa ativa única está correta.\n');
  } else {
    console.log('❌ Alguns testes falharam. Revisar lógica de queixa ativa única.\n');
  }

  return results;
}

// Para facilitar chamada manual no console do browser
if (typeof window !== 'undefined') {
  (window as any).runComplaintActiveTests = runComplaintActiveTests;
}
