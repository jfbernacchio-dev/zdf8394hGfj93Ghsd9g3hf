export type CardCategory = 'statistics' | 'functional';

export interface CardConfig {
  id: string;
  name: string;
  description: string;
  category: CardCategory;
  icon?: string;
  defaultWidth?: number;
  defaultHeight?: number;
}

export const AVAILABLE_STAT_CARDS: CardConfig[] = [
  {
    id: 'stat-total',
    name: 'Total no Mês',
    description: 'Total de sessões no mês atual',
    category: 'statistics',
    defaultWidth: 200,
    defaultHeight: 120,
  },
  {
    id: 'stat-attended',
    name: 'Comparecidas',
    description: 'Sessões comparecidas no mês',
    category: 'statistics',
    defaultWidth: 200,
    defaultHeight: 120,
  },
  {
    id: 'stat-scheduled',
    name: 'Agendadas',
    description: 'Sessões agendadas no mês',
    category: 'statistics',
    defaultWidth: 200,
    defaultHeight: 120,
  },
  {
    id: 'stat-unpaid',
    name: 'A Pagar',
    description: 'Sessões não pagas no mês',
    category: 'statistics',
    defaultWidth: 200,
    defaultHeight: 120,
  },
  {
    id: 'stat-nfse',
    name: 'NFSe Emitida',
    description: 'Sessões com NFSe emitida',
    category: 'statistics',
    defaultWidth: 200,
    defaultHeight: 120,
  },
  {
    id: 'stat-total-all',
    name: 'Total Geral',
    description: 'Todas as sessões registradas',
    category: 'statistics',
    defaultWidth: 200,
    defaultHeight: 120,
  },
  {
    id: 'stat-revenue-month',
    name: 'Faturamento do Mês',
    description: 'Valor total faturado no mês',
    category: 'statistics',
    defaultWidth: 200,
    defaultHeight: 120,
  },
  {
    id: 'stat-paid-month',
    name: 'Recebido no Mês',
    description: 'Valor recebido (pago) no mês',
    category: 'statistics',
    defaultWidth: 200,
    defaultHeight: 120,
  },
  {
    id: 'stat-missed-month',
    name: 'Faltas no Mês',
    description: 'Total de faltas no mês',
    category: 'statistics',
    defaultWidth: 200,
    defaultHeight: 120,
  },
  {
    id: 'stat-attendance-rate',
    name: 'Taxa de Comparecimento',
    description: 'Percentual de comparecimento',
    category: 'statistics',
    defaultWidth: 200,
    defaultHeight: 120,
  },
  {
    id: 'stat-unscheduled-month',
    name: 'Desmarcadas no Mês',
    description: 'Sessões desmarcadas no mês',
    category: 'statistics',
    defaultWidth: 200,
    defaultHeight: 120,
  },
];

export const AVAILABLE_FUNCTIONAL_CARDS: CardConfig[] = [
  {
    id: 'next-appointment',
    name: 'Próximo Agendamento',
    description: 'Detalhes da próxima sessão agendada',
    category: 'functional',
    defaultWidth: 350,
    defaultHeight: 220,
  },
  {
    id: 'contact-info',
    name: 'Informações de Contato',
    description: 'Telefone, email e endereço do paciente',
    category: 'functional',
    defaultWidth: 350,
    defaultHeight: 220,
  },
  {
    id: 'clinical-complaint',
    name: 'Queixa Clínica',
    description: 'Queixa clínica atual do paciente',
    category: 'functional',
    defaultWidth: 350,
    defaultHeight: 220,
  },
  {
    id: 'clinical-info',
    name: 'Informações Clínicas',
    description: 'Detalhes da terapia e modalidade',
    category: 'functional',
    defaultWidth: 700,
    defaultHeight: 280,
  },
  {
    id: 'history',
    name: 'Histórico de Alterações',
    description: 'Mudanças de horário e datas',
    category: 'functional',
    defaultWidth: 350,
    defaultHeight: 280,
  },
  {
    id: 'recent-notes',
    name: 'Últimas Notas Clínicas',
    description: 'Notas das sessões recentes',
    category: 'functional',
    defaultWidth: 350,
    defaultHeight: 300,
  },
  {
    id: 'quick-actions',
    name: 'Ações Rápidas',
    description: 'Botões para ações frequentes',
    category: 'functional',
    defaultWidth: 350,
    defaultHeight: 200,
  },
  {
    id: 'attendance-chart',
    name: 'Gráfico de Comparecimento',
    description: 'Visualização do histórico de presenças',
    category: 'functional',
    defaultWidth: 500,
    defaultHeight: 300,
  },
  {
    id: 'payment-summary',
    name: 'Resumo de Pagamentos',
    description: 'Status de pagamentos e pendências',
    category: 'functional',
    defaultWidth: 350,
    defaultHeight: 250,
  },
  {
    id: 'session-frequency',
    name: 'Frequência de Sessões',
    description: 'Análise de frequência e regularidade',
    category: 'functional',
    defaultWidth: 350,
    defaultHeight: 220,
  },
];

export const ALL_AVAILABLE_CARDS = [...AVAILABLE_STAT_CARDS, ...AVAILABLE_FUNCTIONAL_CARDS];
