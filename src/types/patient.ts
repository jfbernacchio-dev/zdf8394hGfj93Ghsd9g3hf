export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  createdAt: string;
}

export interface Session {
  id: string;
  patientId: string;
  date: string;
  value: number;
  attended: boolean;
  notes: string;
  createdAt: string;
}
