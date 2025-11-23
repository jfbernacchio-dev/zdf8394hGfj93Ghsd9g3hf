/**
 * Calcula a flag clínica efetiva com fallback:
 * - Se isClinicalProfessional vier definido (true/false), usa ele.
 * - Se vier undefined/null, considera clínico se roleGlobal === 'psychologist'.
 *
 * Isso garante compatibilidade com usuários antigos e com o comportamento atual do psicólogo.
 */
export function getEffectiveIsClinicalProfessional(
  roleGlobal: string | null | undefined,
  isClinicalProfessional: boolean | null | undefined
): boolean {
  if (typeof isClinicalProfessional === 'boolean') {
    return isClinicalProfessional;
  }
  return roleGlobal === 'psychologist';
}
