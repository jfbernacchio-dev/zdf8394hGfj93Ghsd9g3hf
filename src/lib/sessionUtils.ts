import { addWeeks, addDays, format, isBefore, startOfDay, parseISO, getDay } from 'date-fns';

const dayOfWeekMap: { [key: string]: number } = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export const generateRecurringSessions = (
  startDate: string,
  sessionDay: string,
  sessionTime: string,
  frequency: 'weekly' | 'biweekly',
  endDate?: Date
) => {
  const sessions: { date: string; status: string }[] = [];
  
  // Use parseISO to correctly interpret the date string
  const start = parseISO(startDate);
  
  const targetDayOfWeek = dayOfWeekMap[sessionDay.toLowerCase()];
  const end = endDate || new Date();
  const now = new Date();

  // Find the first occurrence of the session day on or after start date
  let currentDate = start;
  
  // Get the current day of week for the start date
  const currentDayOfWeek = getDay(currentDate);
  
  // Calculate days to add to reach target day of week
  let daysToAdd = targetDayOfWeek - currentDayOfWeek;
  
  // If target day is in the past this week, move to next week
  if (daysToAdd < 0) {
    daysToAdd += 7;
  }
  
  // Move to the target day
  currentDate = addDays(currentDate, daysToAdd);

  // Generate sessions from first occurrence until end date
  while (isBefore(currentDate, end) || currentDate.getTime() === startOfDay(end).getTime()) {
    const sessionDate = format(currentDate, 'yyyy-MM-dd');
    
    // Create a Date object with the session date and time
    const [hours, minutes] = sessionTime.split(':').map(Number);
    const sessionDateTime = new Date(currentDate);
    sessionDateTime.setHours(hours, minutes, 0, 0);
    
    // Mark sessions that have passed (date + time) as "attended" (Compareceu)
    const status = sessionDateTime < now ? 'attended' : 'scheduled';
    sessions.push({ date: sessionDate, status });
    currentDate = addWeeks(currentDate, frequency === 'weekly' ? 1 : 2);
  }

  return sessions;
};

export const getNextSessionDate = (
  lastSessionDate: string,
  sessionDay: string,
  frequency: 'weekly' | 'biweekly'
): string => {
  const lastDate = parseISO(lastSessionDate);
  const nextDate = addWeeks(lastDate, frequency === 'weekly' ? 1 : 2);
  return format(nextDate, 'yyyy-MM-dd');
};

export const ensureFutureSessions = async (
  patientId: string,
  patient: any,
  supabase: any,
  targetCount: number = 4
) => {
  // Get all future scheduled sessions for this patient
  const { data: futureSessions } = await supabase
    .from('sessions')
    .select('date')
    .eq('patient_id', patientId)
    .eq('status', 'scheduled')
    .gte('date', format(new Date(), 'yyyy-MM-dd'))
    .order('date', { ascending: true });

  const existingCount = futureSessions?.length || 0;
  const sessionsToCreate = targetCount - existingCount;

  if (sessionsToCreate <= 0) return;

  // Find the last session date (either last future session or today)
  let lastDate = futureSessions && futureSessions.length > 0 
    ? futureSessions[futureSessions.length - 1].date
    : format(new Date(), 'yyyy-MM-dd');

  // Create missing sessions
  const newSessions = [];
  for (let i = 0; i < sessionsToCreate; i++) {
    const nextDate = getNextSessionDate(lastDate, patient.session_day, patient.frequency);
    
    // Check if session already exists
    const { data: existing } = await supabase
      .from('sessions')
      .select('id')
      .eq('patient_id', patientId)
      .eq('date', nextDate)
      .maybeSingle();

    if (!existing) {
      newSessions.push({
        patient_id: patientId,
        date: nextDate,
        status: 'scheduled',
        value: patient.session_value,
        paid: false,
      });
    }
    
    lastDate = nextDate;
  }

  if (newSessions.length > 0) {
    await supabase.from('sessions').insert(newSessions);
  }
};
