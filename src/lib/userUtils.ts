/**
 * ============================================================================
 * User Utility Functions
 * ============================================================================
 * FASE W1: Helpers para identificação de usuários especiais
 */

/**
 * Define se um usuário é "deus do Olimpo" para fins de acesso ao WhatsApp:
 * - Deve ser admin
 * - Deve ser owner da organização
 *
 * Isso é uma aproximação intencional de "João & Larissa".
 * Se no futuro houver mais owners/admins, eles também terão acesso.
 * Se for necessário restringir a um subconjunto, depois podemos trocar a lógica
 * para usar uma lista explícita de user_ids.
 */
export function isOlimpoUser(opts: {
  isAdmin: boolean;
  isOrganizationOwner?: boolean | null;
}): boolean {
  const { isAdmin, isOrganizationOwner } = opts;
  return !!isAdmin && !!isOrganizationOwner;
}
