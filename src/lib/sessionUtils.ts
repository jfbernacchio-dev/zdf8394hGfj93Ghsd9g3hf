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
  const today = format(new Date(), 'yyyy-MM-dd');
  
  // Get all future scheduled sessions for this patient
  const { data: futureSessions } = await supabase
    .from('sessions')
    .select('date')
    .eq('patient_id', patientId)
    .eq('status', 'scheduled')
    .gte('date', today)
    .order('date', { ascending: true });

  const existingCount = futureSessions?.length || 0;
  const sessionsToCreate = targetCount - existingCount;

  if (sessionsToCreate <= 0) return;

  // Always get the most up-to-date patient information from the database
  const { data: currentPatient } = await supabase
    .from('patients')
    .select('session_day, frequency, session_time, session_value, start_date')
    .eq('id', patientId)
    .single();

  const patientInfo = currentPatient || patient;

  // Find the last session date from ALL sessions to continue from there
  const { data: allSessions } = await supabase
    .from('sessions')
    .select('date')
    .eq('patient_id', patientId)
    .order('date', { ascending: false })
    .limit(1);

  let lastDate: string;
  
  if (allSessions && allSessions.length > 0) {
    lastDate = allSessions[0].date;
  } else {
    lastDate = patientInfo.start_date;
  }

  // Create missing sessions using current patient data
  const newSessions = [];
  for (let i = 0; i < sessionsToCreate; i++) {
    const nextDate = getNextSessionDate(lastDate, patientInfo.session_day, patientInfo.frequency);
    
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
        value: patientInfo.session_value,
        paid: false,
        time: patientInfo.session_time,
      });
    }
    
    lastDate = nextDate;
  }

  if (newSessions.length > 0) {
    await supabase.from('sessions').insert(newSessions);
  }
};
