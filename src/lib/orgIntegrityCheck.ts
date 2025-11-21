import { supabase } from '@/integrations/supabase/client';

/**
 * ============================================================================
 * FASE 10.9: Organization Integrity Check
 * ============================================================================
 * 
 * Sistema de validação e correção de integridade organizacional.
 * Verifica se todos os dados estão corretamente vinculados à organização ativa.
 * 
 * ============================================================================
 */

export interface OrgIntegrityIssue {
  table: string;
  record_id: string;
  issue_type: 'wrong_org' | 'missing_org' | 'orphaned' | 'inconsistent';
  description: string;
  current_org_id: string | null;
  expected_org_id: string;
  auto_fixable: boolean;
}

export interface OrgIntegrityReport {
  timestamp: string;
  organization_id: string;
  duration_ms: number;
  total_issues: number;
  issues_by_severity: {
    critical: number;
    warning: number;
    info: number;
  };
  issues_by_table: Record<string, number>;
  perfect_tables: string[];
  issues: OrgIntegrityIssue[];
  recommendations: string[];
}

/**
 * Executa verificação completa de integridade organizacional
 */
export async function runOrgIntegrityCheck(organizationId: string): Promise<OrgIntegrityReport> {
  const startTime = Date.now();
  const issues: OrgIntegrityIssue[] = [];

  console.log(`[10.9] Iniciando verificação de integridade para org: ${organizationId}`);

  // 1. Buscar todos os user_ids da organização
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('organization_id', organizationId);

  const orgUserIds = (profiles || []).map(p => p.id);
  console.log(`[10.9] ${orgUserIds.length} usuários encontrados na organização`);

  // 2. Verificar PACIENTES
  await checkPatients(organizationId, orgUserIds, issues);

  // 3. Verificar SESSÕES
  await checkSessions(organizationId, orgUserIds, issues);

  // 4. Verificar NFSE_ISSUED
  await checkNFSeIssued(organizationId, orgUserIds, issues);

  // 5. Verificar NFSE_PAYMENTS
  await checkNFSePayments(organizationId, orgUserIds, issues);

  // 6. Verificar PATIENT_FILES
  await checkPatientFiles(organizationId, orgUserIds, issues);

  // 7. Verificar CLINICAL_COMPLAINTS
  await checkClinicalComplaints(organizationId, orgUserIds, issues);

  // 8. Verificar SCHEDULE_BLOCKS
  await checkScheduleBlocks(organizationId, orgUserIds, issues);

  // 9. Verificar APPOINTMENTS
  await checkAppointments(organizationId, orgUserIds, issues);

  // 10. Verificar SYSTEM_NOTIFICATIONS
  await checkSystemNotifications(organizationId, orgUserIds, issues);

  // 11. Verificar USER_POSITIONS
  await checkUserPositions(organizationId, orgUserIds, issues);

  // Calcular estatísticas
  const duration_ms = Date.now() - startTime;
  const issuesByTable: Record<string, number> = {};
  const allTables = [
    'patients', 'sessions', 'nfse_issued', 'nfse_payments', 'patient_files',
    'clinical_complaints', 'schedule_blocks', 'appointments', 'system_notifications',
    'user_positions'
  ];

  issues.forEach(issue => {
    issuesByTable[issue.table] = (issuesByTable[issue.table] || 0) + 1;
  });

  const perfectTables = allTables.filter(table => !issuesByTable[table]);

  // Gerar recomendações
  const recommendations: string[] = [];
  if (issues.length === 0) {
    recommendations.push('✅ Sistema completamente consistente! Nenhuma ação necessária.');
  } else {
    recommendations.push(`⚠️ ${issues.length} inconsistências encontradas.`);
    
    const criticalIssues = issues.filter(i => i.issue_type === 'wrong_org' || i.issue_type === 'orphaned');
    if (criticalIssues.length > 0) {
      recommendations.push(`🔴 ${criticalIssues.length} problemas críticos requerem atenção imediata.`);
    }

    const autoFixable = issues.filter(i => i.auto_fixable).length;
    if (autoFixable > 0) {
      recommendations.push(`🔧 ${autoFixable} problemas podem ser corrigidos automaticamente.`);
    }

    recommendations.push('📋 Executar correções automáticas via botão "Corrigir Tudo".');
    recommendations.push('🔒 Considerar implementar RLS policies baseadas em organization_id (FASE 11).');
  }

  return {
    timestamp: new Date().toISOString(),
    organization_id: organizationId,
    duration_ms,
    total_issues: issues.length,
    issues_by_severity: {
      critical: issues.filter(i => i.issue_type === 'wrong_org' || i.issue_type === 'orphaned').length,
      warning: issues.filter(i => i.issue_type === 'missing_org').length,
      info: issues.filter(i => i.issue_type === 'inconsistent').length,
    },
    issues_by_table: issuesByTable,
    perfect_tables: perfectTables,
    issues,
    recommendations,
  };
}

// ============================================================================
// FUNÇÕES DE VERIFICAÇÃO POR TABELA
// ============================================================================

async function checkPatients(orgId: string, orgUserIds: string[], issues: OrgIntegrityIssue[]) {
  const { data: patients } = await supabase
    .from('patients')
    .select('id, user_id, organization_id, name');

  (patients || []).forEach(patient => {
    // Verifica se user_id pertence à org
    if (!orgUserIds.includes(patient.user_id)) {
      issues.push({
        table: 'patients',
        record_id: patient.id,
        issue_type: 'wrong_org',
        description: `Paciente "${patient.name}" pertence a usuário de outra organização`,
        current_org_id: patient.organization_id,
        expected_org_id: orgId,
        auto_fixable: false,
      });
    }
    
    // Verifica se organization_id está correto
    if (patient.organization_id !== orgId && orgUserIds.includes(patient.user_id)) {
      issues.push({
        table: 'patients',
        record_id: patient.id,
        issue_type: 'missing_org',
        description: `Paciente "${patient.name}" tem organization_id incorreto`,
        current_org_id: patient.organization_id,
        expected_org_id: orgId,
        auto_fixable: true,
      });
    }
  });
}

async function checkSessions(orgId: string, orgUserIds: string[], issues: OrgIntegrityIssue[]) {
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, patient_id, organization_id, patients(user_id, name)');

  (sessions || []).forEach(session => {
    const patient = session.patients as any;
    if (!patient) {
      issues.push({
        table: 'sessions',
        record_id: session.id,
        issue_type: 'orphaned',
        description: 'Sessão órfã (paciente não encontrado)',
        current_org_id: session.organization_id,
        expected_org_id: orgId,
        auto_fixable: false,
      });
      return;
    }

    if (!orgUserIds.includes(patient.user_id)) {
      issues.push({
        table: 'sessions',
        record_id: session.id,
        issue_type: 'wrong_org',
        description: `Sessão de paciente "${patient.name}" de outra organização`,
        current_org_id: session.organization_id,
        expected_org_id: orgId,
        auto_fixable: false,
      });
    }

    if (session.organization_id !== orgId && orgUserIds.includes(patient.user_id)) {
      issues.push({
        table: 'sessions',
        record_id: session.id,
        issue_type: 'missing_org',
        description: `Sessão com organization_id incorreto`,
        current_org_id: session.organization_id,
        expected_org_id: orgId,
        auto_fixable: true,
      });
    }
  });
}

async function checkNFSeIssued(orgId: string, orgUserIds: string[], issues: OrgIntegrityIssue[]) {
  const { data: nfses } = await supabase
    .from('nfse_issued')
    .select('id, user_id, organization_id, patient_name');

  (nfses || []).forEach(nfse => {
    if (!orgUserIds.includes(nfse.user_id)) {
      issues.push({
        table: 'nfse_issued',
        record_id: nfse.id,
        issue_type: 'wrong_org',
        description: `NFSe para "${nfse.patient_name}" emitida por usuário de outra org`,
        current_org_id: nfse.organization_id,
        expected_org_id: orgId,
        auto_fixable: false,
      });
    }

    if (nfse.organization_id !== orgId && orgUserIds.includes(nfse.user_id)) {
      issues.push({
        table: 'nfse_issued',
        record_id: nfse.id,
        issue_type: 'missing_org',
        description: `NFSe com organization_id incorreto`,
        current_org_id: nfse.organization_id,
        expected_org_id: orgId,
        auto_fixable: true,
      });
    }
  });
}

async function checkNFSePayments(orgId: string, orgUserIds: string[], issues: OrgIntegrityIssue[]) {
  const { data: payments } = await supabase
    .from('nfse_payments')
    .select('id, user_id, organization_id, amount');

  (payments || []).forEach(payment => {
    if (!orgUserIds.includes(payment.user_id)) {
      issues.push({
        table: 'nfse_payments',
        record_id: payment.id,
        issue_type: 'wrong_org',
        description: `Pagamento de R$ ${payment.amount} de usuário de outra org`,
        current_org_id: payment.organization_id,
        expected_org_id: orgId,
        auto_fixable: false,
      });
    }

    if (payment.organization_id !== orgId && orgUserIds.includes(payment.user_id)) {
      issues.push({
        table: 'nfse_payments',
        record_id: payment.id,
        issue_type: 'missing_org',
        description: `Pagamento com organization_id incorreto`,
        current_org_id: payment.organization_id,
        expected_org_id: orgId,
        auto_fixable: true,
      });
    }
  });
}

async function checkPatientFiles(orgId: string, orgUserIds: string[], issues: OrgIntegrityIssue[]) {
  const { data: files } = await supabase
    .from('patient_files')
    .select('id, patient_id, organization_id, file_name, patients(user_id, name)');

  (files || []).forEach(file => {
    const patient = file.patients as any;
    if (!patient) {
      issues.push({
        table: 'patient_files',
        record_id: file.id,
        issue_type: 'orphaned',
        description: `Arquivo "${file.file_name}" órfão (paciente não encontrado)`,
        current_org_id: file.organization_id,
        expected_org_id: orgId,
        auto_fixable: false,
      });
      return;
    }

    if (!orgUserIds.includes(patient.user_id)) {
      issues.push({
        table: 'patient_files',
        record_id: file.id,
        issue_type: 'wrong_org',
        description: `Arquivo "${file.file_name}" de paciente de outra org`,
        current_org_id: file.organization_id,
        expected_org_id: orgId,
        auto_fixable: false,
      });
    }

    if (file.organization_id !== orgId && orgUserIds.includes(patient.user_id)) {
      issues.push({
        table: 'patient_files',
        record_id: file.id,
        issue_type: 'missing_org',
        description: `Arquivo com organization_id incorreto`,
        current_org_id: file.organization_id,
        expected_org_id: orgId,
        auto_fixable: true,
      });
    }
  });
}

async function checkClinicalComplaints(orgId: string, orgUserIds: string[], issues: OrgIntegrityIssue[]) {
  const { data: complaints } = await supabase
    .from('clinical_complaints')
    .select('id, patient_id, organization_id, cid_title, patients(user_id, name)');

  (complaints || []).forEach(complaint => {
    const patient = complaint.patients as any;
    if (!patient) {
      issues.push({
        table: 'clinical_complaints',
        record_id: complaint.id,
        issue_type: 'orphaned',
        description: `Queixa clínica órfã (paciente não encontrado)`,
        current_org_id: complaint.organization_id,
        expected_org_id: orgId,
        auto_fixable: false,
      });
      return;
    }

    if (!orgUserIds.includes(patient.user_id)) {
      issues.push({
        table: 'clinical_complaints',
        record_id: complaint.id,
        issue_type: 'wrong_org',
        description: `Queixa "${complaint.cid_title || 'sem título'}" de paciente de outra org`,
        current_org_id: complaint.organization_id,
        expected_org_id: orgId,
        auto_fixable: false,
      });
    }

    if (complaint.organization_id !== orgId && orgUserIds.includes(patient.user_id)) {
      issues.push({
        table: 'clinical_complaints',
        record_id: complaint.id,
        issue_type: 'missing_org',
        description: `Queixa com organization_id incorreto`,
        current_org_id: complaint.organization_id,
        expected_org_id: orgId,
        auto_fixable: true,
      });
    }
  });
}

async function checkScheduleBlocks(orgId: string, orgUserIds: string[], issues: OrgIntegrityIssue[]) {
  const { data: blocks } = await supabase
    .from('schedule_blocks')
    .select('id, user_id, organization_id, reason');

  (blocks || []).forEach(block => {
    if (!orgUserIds.includes(block.user_id)) {
      issues.push({
        table: 'schedule_blocks',
        record_id: block.id,
        issue_type: 'wrong_org',
        description: `Bloqueio de agenda de usuário de outra org`,
        current_org_id: block.organization_id,
        expected_org_id: orgId,
        auto_fixable: false,
      });
    }

    if (block.organization_id !== orgId && orgUserIds.includes(block.user_id)) {
      issues.push({
        table: 'schedule_blocks',
        record_id: block.id,
        issue_type: 'missing_org',
        description: `Bloqueio com organization_id incorreto`,
        current_org_id: block.organization_id,
        expected_org_id: orgId,
        auto_fixable: true,
      });
    }
  });
}

async function checkAppointments(orgId: string, orgUserIds: string[], issues: OrgIntegrityIssue[]) {
  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, user_id, organization_id, description');

  (appointments || []).forEach(apt => {
    if (!orgUserIds.includes(apt.user_id)) {
      issues.push({
        table: 'appointments',
        record_id: apt.id,
        issue_type: 'wrong_org',
        description: `Compromisso de usuário de outra org`,
        current_org_id: apt.organization_id,
        expected_org_id: orgId,
        auto_fixable: false,
      });
    }

    if (apt.organization_id !== orgId && orgUserIds.includes(apt.user_id)) {
      issues.push({
        table: 'appointments',
        record_id: apt.id,
        issue_type: 'missing_org',
        description: `Compromisso com organization_id incorreto`,
        current_org_id: apt.organization_id,
        expected_org_id: orgId,
        auto_fixable: true,
      });
    }
  });
}

async function checkSystemNotifications(orgId: string, orgUserIds: string[], issues: OrgIntegrityIssue[]) {
  const { data: notifications } = await supabase
    .from('system_notifications')
    .select('id, user_id, organization_id, title');

  (notifications || []).forEach(notif => {
    if (!orgUserIds.includes(notif.user_id)) {
      issues.push({
        table: 'system_notifications',
        record_id: notif.id,
        issue_type: 'wrong_org',
        description: `Notificação para usuário de outra org`,
        current_org_id: notif.organization_id,
        expected_org_id: orgId,
        auto_fixable: false,
      });
    }

    if (notif.organization_id !== orgId && orgUserIds.includes(notif.user_id)) {
      issues.push({
        table: 'system_notifications',
        record_id: notif.id,
        issue_type: 'missing_org',
        description: `Notificação com organization_id incorreto`,
        current_org_id: notif.organization_id,
        expected_org_id: orgId,
        auto_fixable: true,
      });
    }
  });
}

async function checkUserPositions(orgId: string, orgUserIds: string[], issues: OrgIntegrityIssue[]) {
  const { data: positions } = await supabase
    .from('user_positions')
    .select('id, user_id, position_id, organization_positions(level_id, organization_levels(organization_id))');

  (positions || []).forEach(pos => {
    const orgPos = pos.organization_positions as any;
    if (!orgPos || !orgPos.organization_levels) {
      issues.push({
        table: 'user_positions',
        record_id: pos.id,
        issue_type: 'orphaned',
        description: `Posição órfã (organização não encontrada)`,
        current_org_id: null,
        expected_org_id: orgId,
        auto_fixable: false,
      });
      return;
    }

    const posOrgId = orgPos.organization_levels.organization_id;
    if (posOrgId !== orgId) {
      issues.push({
        table: 'user_positions',
        record_id: pos.id,
        issue_type: 'inconsistent',
        description: `Usuário vinculado a posição de outra organização`,
        current_org_id: posOrgId,
        expected_org_id: orgId,
        auto_fixable: false,
      });
    }
  });
}

/**
 * Corrige um problema individual
 */
export async function fixIssue(issue: OrgIntegrityIssue): Promise<{ success: boolean; error?: string }> {
  if (!issue.auto_fixable) {
    return { success: false, error: 'Este problema não pode ser corrigido automaticamente' };
  }

  try {
    const { error } = await supabase
      .from(issue.table as any)
      .update({ organization_id: issue.expected_org_id })
      .eq('id', issue.record_id);

    if (error) throw error;

    console.log(`[10.9] Corrigido: ${issue.table}.${issue.record_id}`);
    return { success: true };
  } catch (error) {
    console.error(`[10.9] Erro ao corrigir:`, error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Corrige todos os problemas auto-fixáveis
 */
export async function fixAllIssues(issues: OrgIntegrityIssue[]): Promise<{
  total: number;
  fixed: number;
  failed: number;
  errors: string[];
}> {
  const autoFixable = issues.filter(i => i.auto_fixable);
  let fixed = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const issue of autoFixable) {
    const result = await fixIssue(issue);
    if (result.success) {
      fixed++;
    } else {
      failed++;
      errors.push(`${issue.table}.${issue.record_id}: ${result.error}`);
    }
  }

  console.log(`[10.9] Correção concluída: ${fixed} corrigidos, ${failed} falharam`);

  return {
    total: autoFixable.length,
    fixed,
    failed,
    errors,
  };
}
