import { format, parseISO, eachMonthOfInterval } from 'date-fns';

/**
 * ============================================================================
 * PATIENT FINANCIAL UTILITIES
 * ============================================================================
 * 
 * Biblioteca centralizada para todos os cálculos financeiros relacionados a pacientes.
 * 
 * REGRAS DE NEGÓCIO:
 * 
 * 1. PACIENTES MENSAIS (monthly_price = true):
 *    - Cobram valor fixo mensal independente do número de sessões
 *    - Valor calculado: session_value * número_de_meses_com_sessão
 *    - Agrupamento: sempre por mês (MM/yyyy)
 * 
 * 2. PACIENTES POR SESSÃO (monthly_price = false):
 *    - Cobram por sessão individual
 *    - Valor calculado: soma de session.value de cada sessão
 *    - Contagem: número exato de sessões
 * 
 * 3. FREQUÊNCIA (frequency):
 *    - Usado apenas para CÁLCULO DE RECEITA ESPERADA
 *    - NÃO afeta cálculo de valor real faturado
 *    - Valores: '1x', '2x', '3x', '4x'
 * 
 * ============================================================================
 */

export interface Patient {
  id: string;
  name: string;
  session_value: number;
  monthly_price: boolean;
  frequency: string;
  status: string;
}

export interface Session {
  id: string;
  patient_id: string;
  date: string;
  status: string;
  value: number;
  paid: boolean;
  patients?: Patient;
}

/**
 * Converte frequency string para número de sessões por mês
 */
export function getFrequencyCount(frequency: string): number {
  const frequencyMap: Record<string, number> = {
    '1x': 1,
    '2x': 2,
    '3x': 3,
    '4x': 4,
  };
  return frequencyMap[frequency] || 4; // Default 4x se não encontrar
}

/**
 * Calcula RECEITA ESPERADA de um paciente em um período
 * Considera: status ativo + frequência esperada
 */
export function calculateExpectedRevenue(
  patient: Patient,
  periodStart: Date,
  periodEnd: Date
): number {
  if (patient.status !== 'active') return 0;

  const frequencyPerMonth = getFrequencyCount(patient.frequency);

  if (patient.monthly_price) {
    // Paciente mensal: valor fixo por mês no período
    const months = eachMonthOfInterval({ start: periodStart, end: periodEnd });
    return months.length * Number(patient.session_value);
  } else {
    // Paciente por sessão: frequência * valor * meses
    const months = eachMonthOfInterval({ start: periodStart, end: periodEnd });
    return months.length * frequencyPerMonth * Number(patient.session_value);
  }
}

/**
 * Agrupa sessões mensais por paciente+mês
 * Retorna: Map<patientId, Set<monthYear>>
 */
export function groupSessionsByPatientMonth(sessions: Session[]): Map<string, Set<string>> {
  const groups = new Map<string, Set<string>>();
  
  sessions.forEach(session => {
    const monthYear = format(parseISO(session.date), 'yyyy-MM');
    
    if (!groups.has(session.patient_id)) {
      groups.set(session.patient_id, new Set());
    }
    groups.get(session.patient_id)!.add(monthYear);
  });
  
  return groups;
}

/**
 * Calcula VALOR REALIZADO de sessões (attended)
 * REGRA: Pacientes mensais = 1 cobrança por mês; Por sessão = soma individual
 */
export function calculateActualRevenue(sessions: Session[]): number {
  // Separar por tipo de paciente
  const monthlySessions = sessions.filter(s => s.patients?.monthly_price);
  const regularSessions = sessions.filter(s => !s.patients?.monthly_price);

  // Pacientes mensais: agrupar por paciente+mês
  const monthlyGroups = groupSessionsByPatientMonth(monthlySessions);
  const monthlyTotal = Array.from(monthlyGroups.entries()).reduce((total, [patientId, months]) => {
    const session = monthlySessions.find(s => s.patient_id === patientId);
    const monthlyPrice = Number(session?.patients?.session_value || 0);
    return total + (months.size * monthlyPrice);
  }, 0);

  // Pacientes por sessão: soma direta
  const regularTotal = regularSessions.reduce((sum, s) => sum + Number(s.value || 0), 0);

  return monthlyTotal + regularTotal;
}

/**
 * Calcula VALOR NÃO PAGO de sessões comparecidas
 * REGRA: Mesma lógica de calculateActualRevenue, mas filtra paid = false
 */
export function calculateUnpaidRevenue(sessions: Session[]): number {
  const unpaidSessions = sessions.filter(s => s.status === 'attended' && !s.paid);
  return calculateActualRevenue(unpaidSessions);
}

/**
 * Calcula detalhes financeiros de um paciente específico
 */
export interface PatientFinancialDetails {
  totalSessions: number;
  attendedSessions: number;
  unpaidSessions: number;
  totalValue: number;
  unpaidValue: number;
  monthsWithSessions: number; // Para pacientes mensais
}

export function calculatePatientFinancials(
  patient: Patient,
  sessions: Session[]
): PatientFinancialDetails {
  const patientSessions = sessions.filter(s => s.patient_id === patient.id);
  const attendedSessions = patientSessions.filter(s => s.status === 'attended');
  const unpaidSessions = attendedSessions.filter(s => !s.paid);

  let totalValue = 0;
  let unpaidValue = 0;
  let monthsWithSessions = 0;

  if (patient.monthly_price) {
    // Paciente mensal
    const monthlyGroups = groupSessionsByPatientMonth(attendedSessions);
    const months = monthlyGroups.get(patient.id);
    monthsWithSessions = months?.size || 0;
    totalValue = monthsWithSessions * Number(patient.session_value);

    const unpaidMonthlyGroups = groupSessionsByPatientMonth(unpaidSessions);
    const unpaidMonths = unpaidMonthlyGroups.get(patient.id);
    unpaidValue = (unpaidMonths?.size || 0) * Number(patient.session_value);
  } else {
    // Paciente por sessão
    totalValue = attendedSessions.reduce((sum, s) => sum + Number(s.value || 0), 0);
    unpaidValue = unpaidSessions.reduce((sum, s) => sum + Number(s.value || 0), 0);
  }

  return {
    totalSessions: patientSessions.length,
    attendedSessions: attendedSessions.length,
    unpaidSessions: unpaidSessions.length,
    totalValue,
    unpaidValue,
    monthsWithSessions,
  };
}

/**
 * Calcula número de sessões esperadas no período (para dashboard)
 */
export function calculateExpectedSessions(
  patients: Patient[],
  periodStart: Date,
  periodEnd: Date
): number {
  const months = eachMonthOfInterval({ start: periodStart, end: periodEnd });
  
  return patients
    .filter(p => p.status === 'active')
    .reduce((total, patient) => {
      const frequencyPerMonth = getFrequencyCount(patient.frequency);
      return total + (months.length * frequencyPerMonth);
    }, 0);
}

/**
 * Formata valor para moeda brasileira
 */
export function formatBrazilianCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
