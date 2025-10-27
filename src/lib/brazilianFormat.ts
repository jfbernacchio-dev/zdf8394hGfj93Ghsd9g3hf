/**
 * Utilidades para formatação no padrão brasileiro
 */

/**
 * Formata um valor numérico para o padrão brasileiro de moeda
 * @param value Valor numérico
 * @returns String formatada como R$ 1.234,56
 */
export const formatBrazilianCurrency = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return 'R$ 0,00';
  
  return numValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/**
 * Formata uma data ISO (yyyy-MM-dd) para o padrão brasileiro (DD/MM/YYYY)
 * @param isoDate Data no formato yyyy-MM-dd
 * @returns String formatada como DD/MM/YYYY
 */
export const formatBrazilianDate = (isoDate: string): string => {
  if (!isoDate) return '';
  
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
};

/**
 * Converte uma data brasileira (DD/MM/YYYY) para formato ISO (yyyy-MM-dd)
 * @param brazilianDate Data no formato DD/MM/YYYY
 * @returns String formatada como yyyy-MM-dd
 */
export const parseFromBrazilianDate = (brazilianDate: string): string => {
  if (!brazilianDate) return '';
  
  const parts = brazilianDate.split('/');
  if (parts.length !== 3) return '';
  
  const [day, month, year] = parts;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

/**
 * Formata um horário para exibição brasileira (HH:mm)
 * @param time Horário no formato HH:mm
 * @returns String formatada
 */
export const formatBrazilianTime = (time: string): string => {
  if (!time) return '';
  return time; // Já está no formato correto (HH:mm)
};

/**
 * Retorna os nomes dos dias da semana em português
 */
export const WEEKDAYS_PT = {
  sunday: 'Domingo',
  monday: 'Segunda-feira',
  tuesday: 'Terça-feira',
  wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira',
  friday: 'Sexta-feira',
  saturday: 'Sábado'
} as const;

/**
 * Retorna os nomes abreviados dos dias da semana em português
 */
export const WEEKDAYS_SHORT_PT = {
  sunday: 'Dom',
  monday: 'Seg',
  tuesday: 'Ter',
  wednesday: 'Qua',
  thursday: 'Qui',
  friday: 'Sex',
  saturday: 'Sáb'
} as const;

/**
 * Formata um número sem formatação de moeda, apenas com separadores brasileiros
 * @param value Valor numérico
 * @returns String formatada como 1.234,56
 */
export const formatBrazilianNumber = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};
