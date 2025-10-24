import { Patient, Session } from '@/types/patient';

const PATIENTS_KEY = 'psych_clinic_patients';
const SESSIONS_KEY = 'psych_clinic_sessions';

export const storage = {
  getPatients: (): Patient[] => {
    const data = localStorage.getItem(PATIENTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  savePatients: (patients: Patient[]) => {
    localStorage.setItem(PATIENTS_KEY, JSON.stringify(patients));
  },

  getSessions: (): Session[] => {
    const data = localStorage.getItem(SESSIONS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveSessions: (sessions: Session[]) => {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  },
};
