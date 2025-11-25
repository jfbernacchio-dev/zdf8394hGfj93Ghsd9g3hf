/**
 * ============================================================================
 * PATIENT OVERVIEW LAYOUT PERSISTENCE - FASE C1.3
 * ============================================================================
 * 
 * Sistema de persistência de layout da aba "Visão Geral"
 * 
 * FASE C1.3: Implementação localStorage apenas
 * FUTURO: Migração para Supabase com templates por role/abordagem
 * 
 * Este arquivo contém funções para:
 * - Carregar layout do localStorage
 * - Salvar layout no localStorage
 * - Resetar layout para o padrão
 * 
 * ⚠️ IMPORTANTE:
 * - Nesta fase, APENAS localStorage
 * - NÃO acessa Supabase
 * - NÃO usa React (hooks separados)
 * - Funções puras sem side effects além de IO localStorage
 */

import type { PatientOverviewCardLayout } from './patientOverviewLayout';
import { 
  getDefaultPatientOverviewLayout, 
  isValidLayout, 
  normalizePatientOverviewLayout,
  mergeLayouts 
} from './patientOverviewLayout';

/**
 * Prefixo das chaves no localStorage
 */
const STORAGE_PREFIX = 'patient-overview-layout';

/**
 * Gera a chave de storage para um usuário/organização
 * 
 * FASE C1.5: Validação adicionada para prevenir keys inválidas
 * 
 * @param userId - ID do usuário
 * @param organizationId - ID da organização
 * @returns Chave de storage
 * @throws Error se userId ou organizationId forem vazios
 */
function getStorageKey(userId: string, organizationId: string): string {
  if (!userId || !organizationId) {
    throw new Error('[PatientOverviewLayout] userId e organizationId são obrigatórios');
  }
  return `${STORAGE_PREFIX}-${organizationId}-${userId}`;
}

/**
 * Carrega o layout do localStorage
 * 
 * @param userId - ID do usuário
 * @param organizationId - ID da organização
 * @returns Layout salvo ou null se não existir
 */
export function loadPatientOverviewLayout(
  userId: string,
  organizationId: string
): PatientOverviewCardLayout[] | null {
  try {
    const key = getStorageKey(userId, organizationId);
    const raw = localStorage.getItem(key);
    
    if (!raw) return null;
    
    const parsed = JSON.parse(raw);
    
    // Validar estrutura
    if (!isValidLayout(parsed)) {
      console.warn('[PatientOverviewLayout] Layout inválido no localStorage, ignorando');
      return null;
    }
    
    // Normalizar para garantir consistência
    const normalized = normalizePatientOverviewLayout(parsed);
    
    // Mesclar com layout padrão (adicionar novos cards se houver)
    const defaultLayout = getDefaultPatientOverviewLayout();
    const merged = mergeLayouts(defaultLayout, normalized);
    
    return merged;
  } catch (error) {
    console.error('[PatientOverviewLayout] Erro ao carregar layout:', error);
    return null;
  }
}

/**
 * Salva o layout no localStorage
 * 
 * @param userId - ID do usuário
 * @param organizationId - ID da organização
 * @param layout - Layout a salvar
 * @returns true se salvo com sucesso
 */
export function savePatientOverviewLayout(
  userId: string,
  organizationId: string,
  layout: PatientOverviewCardLayout[]
): boolean {
  try {
    const key = getStorageKey(userId, organizationId);
    
    // Normalizar antes de salvar
    const normalized = normalizePatientOverviewLayout(layout);
    
    localStorage.setItem(key, JSON.stringify(normalized));
    
    console.log(`[PatientOverviewLayout] Layout salvo: ${normalized.length} cards`);
    return true;
  } catch (error) {
    console.error('[PatientOverviewLayout] Erro ao salvar layout:', error);
    return false;
  }
}

/**
 * Reseta o layout para o padrão
 * 
 * Remove o layout salvo do localStorage e retorna o layout padrão
 * 
 * @param userId - ID do usuário
 * @param organizationId - ID da organização
 * @returns Layout padrão
 */
export function resetPatientOverviewLayout(
  userId: string,
  organizationId: string
): PatientOverviewCardLayout[] {
  try {
    const key = getStorageKey(userId, organizationId);
    localStorage.removeItem(key);
    
    console.log('[PatientOverviewLayout] Layout resetado para o padrão');
    return getDefaultPatientOverviewLayout();
  } catch (error) {
    console.error('[PatientOverviewLayout] Erro ao resetar layout:', error);
    return getDefaultPatientOverviewLayout();
  }
}

/**
 * Verifica se existe um layout salvo
 * 
 * @param userId - ID do usuário
 * @param organizationId - ID da organização
 * @returns true se existe layout salvo
 */
export function hasStoredLayout(
  userId: string,
  organizationId: string
): boolean {
  try {
    const key = getStorageKey(userId, organizationId);
    return localStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}

/**
 * Remove todos os layouts salvos (útil para limpeza)
 * 
 * ⚠️ Cuidado: Remove TODOS os layouts de TODOS os usuários/orgs
 */
export function clearAllPatientOverviewLayouts(): void {
  try {
    const keys = Object.keys(localStorage);
    const layoutKeys = keys.filter(key => key.startsWith(STORAGE_PREFIX));
    
    layoutKeys.forEach(key => localStorage.removeItem(key));
    
    console.log(`[PatientOverviewLayout] ${layoutKeys.length} layouts removidos`);
  } catch (error) {
    console.error('[PatientOverviewLayout] Erro ao limpar layouts:', error);
  }
}

/**
 * FUTURO: Migração para Supabase
 * 
 * Estas funções serão implementadas em fases futuras quando
 * o sistema migrar para templates baseados em role/abordagem
 * 
 * - loadPatientOverviewLayoutFromSupabase(userId, orgId, role, approach)
 * - savePatientOverviewLayoutToSupabase(userId, orgId, layout)
 * - getTemplateForRoleAndApproach(role, approach)
 */
