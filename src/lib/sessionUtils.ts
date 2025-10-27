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
  
  // Parse the start date and ensure we're working with start of day
  const start = startOfDay(parseISO(startDate));
  const targetDayOfWeek = dayOfWeekMap[sessionDay.toLowerCase()];
  const end = endDate || new Date();
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Find the first occurrence of the target day on or after start date
  let currentDate = new Date(start);
  const startDayOfWeek = getDay(start);
  
  // Calculate days until target day
  let daysUntilTarget = targetDayOfWeek - startDayOfWeek;
  
  // If the target day is before the start day in the same week, go to next week
  // If it's the same day, use the start date itself
  if (daysUntilTarget < 0) {
    daysUntilTarget += 7;
  }
  
  // Set to the first session date (must be >= start date)
  currentDate = addDays(start, daysUntilTarget);

  // CRITICAL: Only generate sessions if currentDate is on or after startDate
  // This prevents creating sessions before the patient's start date
  if (isBefore(currentDate, start)) {
    return sessions;
  }

  // Generate sessions until end date
  while (!isBefore(end, currentDate)) {
    // CRITICAL: Double check that we're not creating sessions before start date
    if (!isBefore(currentDate, start)) {
      const sessionDate = format(currentDate, 'yyyy-MM-dd');
      
      // Create a Date object with the session date and time for status check
      const [hours, minutes] = sessionTime.split(':').map(Number);
      const sessionDateTime = new Date(currentDate);
      sessionDateTime.setHours(hours, minutes, 0, 0);
      
      // Mark sessions that have passed as "attended", future ones as "scheduled"
      const status = sessionDateTime < now ? 'attended' : 'scheduled';
      sessions.push({ date: sessionDate, status });
    }
    
    // Move to next session
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
  const targetDayOfWeek = dayOfWeekMap[sessionDay.toLowerCase()];
  
  // First, find the next occurrence of the target day
  let nextDate = lastDate;
  const currentDayOfWeek = getDay(nextDate);
  let daysToAdd = targetDayOfWeek - currentDayOfWeek;
  
  // If target day is today or in the past this week, move to next week
  if (daysToAdd <= 0) {
    daysToAdd += 7;
  }
  
  nextDate = addDays(nextDate, daysToAdd);
  
  // Now check if we need to skip weeks based on frequency
  // If biweekly, we might need to add another week
  if (frequency === 'biweekly') {
    const daysDiff = Math.floor((nextDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff < 14) {
      nextDate = addWeeks(nextDate, 1);
    }
  }
  
  return format(nextDate, 'yyyy-MM-dd');
};

export const generateTwiceWeeklySessions = (
  startDate: string,
  sessionDay1: string,
  sessionTime1: string,
  sessionDay2: string,
  sessionTime2: string,
  endDate?: Date
) => {
  const sessions: { date: string; status: string; time: string }[] = [];
  
  const start = startOfDay(parseISO(startDate));
  const targetDay1 = dayOfWeekMap[sessionDay1.toLowerCase()];
  const targetDay2 = dayOfWeekMap[sessionDay2.toLowerCase()];
  const end = endDate || new Date();
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Generate sessions for day 1
  const startDayOfWeek1 = getDay(start);
  let daysToAdd1 = targetDay1 - startDayOfWeek1;
  if (daysToAdd1 < 0) daysToAdd1 += 7;
  let currentDate1 = addDays(start, daysToAdd1);

  // CRITICAL: Only generate if first session is on or after start date
  while (!isBefore(end, currentDate1) && !isBefore(currentDate1, start)) {
    const sessionDate = format(currentDate1, 'yyyy-MM-dd');
    const [hours, minutes] = sessionTime1.split(':').map(Number);
    const sessionDateTime = new Date(currentDate1);
    sessionDateTime.setHours(hours, minutes, 0, 0);
    const status = sessionDateTime < now ? 'attended' : 'scheduled';
    sessions.push({ date: sessionDate, status, time: sessionTime1 });
    currentDate1 = addWeeks(currentDate1, 1);
  }

  // Generate sessions for day 2
  const startDayOfWeek2 = getDay(start);
  let daysToAdd2 = targetDay2 - startDayOfWeek2;
  if (daysToAdd2 < 0) daysToAdd2 += 7;
  let currentDate2 = addDays(start, daysToAdd2);

  // CRITICAL: Only generate if first session is on or after start date
  while (!isBefore(end, currentDate2) && !isBefore(currentDate2, start)) {
    const sessionDate = format(currentDate2, 'yyyy-MM-dd');
    const [hours, minutes] = sessionTime2.split(':').map(Number);
    const sessionDateTime = new Date(currentDate2);
    sessionDateTime.setHours(hours, minutes, 0, 0);
    const status = sessionDateTime < now ? 'attended' : 'scheduled';
    sessions.push({ date: sessionDate, status, time: sessionTime2 });
    currentDate2 = addWeeks(currentDate2, 1);
  }

  // Sort by date
  sessions.sort((a, b) => a.date.localeCompare(b.date));

  return sessions;
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
