/**
 * 🧪 FIXTURES DE TESTE PARA MÉTRICAS FINANCEIRAS
 * 
 * Dados de teste consistentes e realistas para validar cálculos de métricas.
 * Construídos para cobrir cenários comuns e edge cases.
 * 
 * @phase C3.1.5 - Testes Unitários
 */

import { MetricsPatient, MetricsSession, MetricsScheduleBlock, MetricsProfile } from "../../systemMetricsUtils";

// ============================================================
// PACIENTES MOCK
// ============================================================

export const mockPatients: MetricsPatient[] = [
  // Paciente ativo semanal
  {
    id: "patient-1",
    name: "Paciente A",
    status: "active",
    frequency: "weekly",
    session_value: 200,
    monthly_price: false,
    user_id: "user-1",
    created_at: "2024-10-01T00:00:00Z",
    updated_at: "2024-10-01T00:00:00Z",
  },
  // Paciente ativo quinzenal
  {
    id: "patient-2",
    name: "Paciente B",
    status: "active",
    frequency: "biweekly",
    session_value: 180,
    monthly_price: false,
    user_id: "user-1",
    created_at: "2024-11-01T00:00:00Z",
    updated_at: "2024-11-01T00:00:00Z",
  },
  // Paciente ativo mensalista
  {
    id: "patient-3",
    name: "Paciente C (Mensal)",
    status: "active",
    frequency: "monthly",
    session_value: 600,
    monthly_price: true,
    user_id: "user-1",
    created_at: "2024-09-01T00:00:00Z",
    updated_at: "2024-09-01T00:00:00Z",
  },
  // Paciente inativo (encerrado em janeiro)
  {
    id: "patient-4",
    name: "Paciente D (Inativo)",
    status: "inactive",
    frequency: "weekly",
    session_value: 150,
    monthly_price: false,
    user_id: "user-1",
    created_at: "2024-08-01T00:00:00Z",
    updated_at: "2025-01-15T00:00:00Z",
  },
  // Paciente novo em 2025
  {
    id: "patient-5",
    name: "Paciente E (Novo)",
    status: "active",
    frequency: "weekly",
    session_value: 220,
    monthly_price: false,
    user_id: "user-1",
    created_at: "2025-01-20T00:00:00Z",
    updated_at: "2025-01-20T00:00:00Z",
  },
];

// ============================================================
// SESSÕES MOCK
// ============================================================

export const mockSessions: MetricsSession[] = [
  // ===== NOVEMBRO 2024 =====
  // Patient 1 - comparecido
  {
    id: "session-1",
    patient_id: "patient-1",
    date: "2024-11-05",
    status: "attended",
    value: 200,
    show_in_schedule: true,
    patients: { name: "Paciente A", user_id: "user-1" },
  },
  // Patient 2 - comparecido
  {
    id: "session-2",
    patient_id: "patient-2",
    date: "2024-11-10",
    status: "attended",
    value: 180,
    show_in_schedule: true,
    patients: { name: "Paciente B", user_id: "user-1" },
  },
  // Patient 3 (mensal) - comparecido (primeira sessão do mês)
  {
    id: "session-3",
    patient_id: "patient-3",
    date: "2024-11-07",
    status: "attended",
    value: 600,
    show_in_schedule: true,
    patients: { name: "Paciente C (Mensal)", user_id: "user-1" },
  },
  // Patient 3 (mensal) - comparecido (segunda sessão - não conta receita)
  {
    id: "session-4",
    patient_id: "patient-3",
    date: "2024-11-14",
    status: "attended",
    value: 600,
    show_in_schedule: true,
    patients: { name: "Paciente C (Mensal)", user_id: "user-1" },
  },

  // ===== DEZEMBRO 2024 =====
  // Patient 1 - comparecido
  {
    id: "session-5",
    patient_id: "patient-1",
    date: "2024-12-03",
    status: "attended",
    value: 200,
    show_in_schedule: true,
    patients: { name: "Paciente A", user_id: "user-1" },
  },
  // Patient 1 - falta
  {
    id: "session-6",
    patient_id: "patient-1",
    date: "2024-12-10",
    status: "missed",
    value: 200,
    show_in_schedule: true,
    patients: { name: "Paciente A", user_id: "user-1" },
  },
  // Patient 2 - comparecido
  {
    id: "session-7",
    patient_id: "patient-2",
    date: "2024-12-15",
    status: "attended",
    value: 180,
    show_in_schedule: true,
    patients: { name: "Paciente B", user_id: "user-1" },
  },
  // Patient 4 - comparecido (ainda estava ativo)
  {
    id: "session-8",
    patient_id: "patient-4",
    date: "2024-12-20",
    status: "attended",
    value: 150,
    show_in_schedule: true,
    patients: { name: "Paciente D (Inativo)", user_id: "user-1" },
  },

  // ===== JANEIRO 2025 =====
  // Patient 1 - comparecido
  {
    id: "session-9",
    patient_id: "patient-1",
    date: "2025-01-08",
    status: "attended",
    value: 200,
    show_in_schedule: true,
    patients: { name: "Paciente A", user_id: "user-1" },
  },
  // Patient 1 - falta
  {
    id: "session-10",
    patient_id: "patient-1",
    date: "2025-01-15",
    status: "missed",
    value: 200,
    show_in_schedule: true,
    patients: { name: "Paciente A", user_id: "user-1" },
  },
  // Patient 2 - comparecido
  {
    id: "session-11",
    patient_id: "patient-2",
    date: "2025-01-12",
    status: "attended",
    value: 180,
    show_in_schedule: true,
    patients: { name: "Paciente B", user_id: "user-1" },
  },
  // Patient 3 (mensal) - comparecido
  {
    id: "session-12",
    patient_id: "patient-3",
    date: "2025-01-05",
    status: "attended",
    value: 600,
    show_in_schedule: true,
    patients: { name: "Paciente C (Mensal)", user_id: "user-1" },
  },
  // Patient 5 (novo) - comparecido
  {
    id: "session-13",
    patient_id: "patient-5",
    date: "2025-01-25",
    status: "attended",
    value: 220,
    show_in_schedule: true,
    patients: { name: "Paciente E (Novo)", user_id: "user-1" },
  },
  // Patient 2 - remarcado (não conta como falta)
  {
    id: "session-14",
    patient_id: "patient-2",
    date: "2025-01-20",
    status: "rescheduled",
    value: 180,
    show_in_schedule: true,
    patients: { name: "Paciente B", user_id: "user-1" },
  },
  // Patient 1 - sessão oculta (não deve contar em cálculos de taxa de falta)
  {
    id: "session-15",
    patient_id: "patient-1",
    date: "2025-01-28",
    status: "missed",
    value: 200,
    show_in_schedule: false,
    patients: { name: "Paciente A", user_id: "user-1" },
  },
];

// ============================================================
// BLOQUEIOS DE AGENDA MOCK
// ============================================================

export const mockScheduleBlocks: MetricsScheduleBlock[] = [
  {
    id: "block-1",
    user_id: "user-1",
    day_of_week: 1, // Segunda
    start_time: "12:00",
    end_time: "13:00",
    start_date: "2025-01-01",
    end_date: "2025-01-31",
    reason: "Almoço",
  },
];

// ============================================================
// PERFIL MOCK
// ============================================================

export const mockProfile: MetricsProfile = {
  id: 'mock-user-id',
  work_days: [1, 2, 3, 4, 5], // Segunda a sexta
  work_start_time: "08:00",
  work_end_time: "18:00",
  slot_duration: 60, // 1 hora
  break_time: 15, // 15 minutos entre sessões
};

// ============================================================
// DATASETS ESPECIAIS PARA EDGE CASES
// ============================================================

/**
 * Dataset vazio para testar comportamento sem dados
 */
export const emptyDataset = {
  patients: [] as MetricsPatient[],
  sessions: [] as MetricsSession[],
};

/**
 * Dataset com apenas faltas
 */
export const allMissedDataset = {
  patients: [mockPatients[0]],
  sessions: [
    {
      id: "missed-1",
      patient_id: "patient-1",
      date: "2025-01-10",
      status: "missed" as const,
      value: 200,
      show_in_schedule: true,
      patients: { name: "Paciente A", user_id: "user-1" },
    },
    {
      id: "missed-2",
      patient_id: "patient-1",
      date: "2025-01-17",
      status: "missed" as const,
      value: 200,
      show_in_schedule: true,
      patients: { name: "Paciente A", user_id: "user-1" },
    },
  ] as MetricsSession[],
};

/**
 * Dataset com apenas pacientes inativos
 */
export const allInactiveDataset = {
  patients: [
    {
      ...mockPatients[3],
      status: "inactive",
    },
  ] as MetricsPatient[],
  sessions: [] as MetricsSession[],
};
