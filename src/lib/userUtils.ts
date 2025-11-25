/**
 * ============================================================================
 * User Utility Functions
 * ============================================================================
 * FASE W1: Helpers para identificação de usuários especiais
 */

/**
 * Lista explícita de user_ids autorizados a usar WhatsApp (João & Larissa)
 *
 * IDs obtidos da tabela profiles:
 *
 */
const OLIMPO_USER_IDS = [
  "cc630372-360c-49e7-99e8-2bd83a3ab75d", // João
  "19ec4677-5531-4576-933c-38ed70ee0bda", // Larissa
];

/**
 * Define se um usuário é "deus do Olimpo" para fins de acesso ao WhatsApp.
 *
 * Usa whitelist explícita de user_ids (João & Larissa da Espaço Mindware).
 * Esta é a abordagem mais fail-safe: apenas os IDs listados têm acesso.
 *
 * Se no futuro for necessário adicionar mais usuários, basta incluir
 * seus user_ids no array OLIMPO_USER_IDS.
 */
export function isOlimpoUser(opts: { userId?: string | null }): boolean {
  if (!opts.userId) return false;
  return OLIMPO_USER_IDS.includes(opts.userId);
}
