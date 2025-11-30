/**
 * 📊 TEAM METRICS TYPES
 * 
 * Tipos específicos para métricas de equipe (domínio Team)
 * Extensão das métricas básicas com agregações específicas de equipe
 */

import type { FinancialSummary } from '@/lib/systemMetricsUtils';

/**
 * Sumário expandido de métricas de equipe
 * Inclui todas as métricas do FinancialSummary base + métricas específicas de equipe
 */
export interface TeamMetricsSummary extends FinancialSummary {
  // Métricas adicionais específicas de equipe
  
  /**
   * Total de sessões realizadas (attended) no período
   * Equivale a totalSessions do FinancialSummary
   */
  attendedSessions: number;
  
  /**
   * Total de sessões com status 'missed' no período
   */
  missedSessions: number;
  
  /**
   * Faturamento médio por terapeuta
   * Calculado como: totalRevenue / therapistsWithSessions
   */
  averageRevenuePerTherapist: number;
  
  /**
   * Quantidade de terapeutas com pelo menos 1 sessão realizada no período
   */
  therapistsWithSessions: number;
  
  /**
   * Taxa de comparecimento da equipe (%)
   * Calculado como: (attendedSessions / (attendedSessions + missedSessions)) * 100
   */
  attendanceRate: number;
  
  /**
   * Total de sessões com compromisso (attended + missed, excluindo cancelled)
   */
  totalCommittedSessions: number;
  
  /**
   * Taxa de ocupação média da equipe (%)
   * Calculado como: (attendedSlots / availableSlots) * 100
   */
  averageOccupationRate: number;
  
  /**
   * Total de blocos/slots disponíveis da equipe no período
   */
  totalAvailableSlots: number;
  
  /**
   * Total de blocos/slots ocupados (sessões realizadas) da equipe no período
   */
  totalAttendedSlots: number;
  
  /**
   * Ticket médio da equipe (valor médio por sessão realizada)
   * Calculado como: totalRevenue / attendedSessions
   */
  averageTicket: number;
}
