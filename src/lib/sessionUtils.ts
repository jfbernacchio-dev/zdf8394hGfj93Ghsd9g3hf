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
  numberOfSessions: number = 8
) => {
  const sessions: { date: string; status: string }[] = [];
  
  // Parse start date ensuring we work with midnight
  const startDateObj = new Date(startDate + 'T00:00:00');
  const targetDayOfWeek = dayOfWeekMap[sessionDay.toLowerCase()];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Find first session date: the first occurrence of target day on or after start date
  let currentDate = new Date(startDateObj);
  const currentDayOfWeek = currentDate.getDay();
  
  // Calculate days to add to reach target day
  let daysToAdd = targetDayOfWeek - currentDayOfWeek;
  
  // If target day is before current day in the week, go to next week
  if (daysToAdd < 0) {
    daysToAdd += 7;
  }
  
  // Move to the first session date
  currentDate.setDate(currentDate.getDate() + daysToAdd);

  // Generate the specified number of sessions
  for (let i = 0; i < numberOfSessions; i++) {
    const sessionDate = currentDate.toISOString().split('T')[0];
    
    // Check if session is in the past or future
    const [hours, minutes] = sessionTime.split(':').map(Number);
    const sessionDateTime = new Date(currentDate);
    sessionDateTime.setHours(hours, minutes, 0, 0);
    
    const status = sessionDateTime < now ? 'attended' : 'scheduled';
    sessions.push({ date: sessionDate, status });
    
    // Move to next session (add 7 or 14 days)
    const daysToAddNext = frequency === 'weekly' ? 7 : 14;
    currentDate.setDate(currentDate.getDate() + daysToAddNext);
  }

  return sessions;
};

export const getNextSessionDate = (
  lastSessionDate: string,
  sessionDay: string,
  frequency: 'weekly' | 'biweekly'
): string => {
  const lastDate = new Date(lastSessionDate + 'T00:00:00');
  const targetDayOfWeek = dayOfWeekMap[sessionDay.toLowerCase()];
  
  // Start from the day after the last session
  const nextDate = new Date(lastDate);
  nextDate.setDate(nextDate.getDate() + 1);
  
  const currentDayOfWeek = nextDate.getDay();
  let daysToAdd = targetDayOfWeek - currentDayOfWeek;
  
  // If target day is before current day in the week, move to next week
  if (daysToAdd < 0) {
    daysToAdd += 7;
  }
  
  nextDate.setDate(nextDate.getDate() + daysToAdd);
  
  // For biweekly, if we're less than 14 days from last session, add another week
  if (frequency === 'biweekly') {
    const daysDiff = Math.floor((nextDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff < 14) {
      nextDate.setDate(nextDate.getDate() + 7);
    }
  }
  
  return nextDate.toISOString().split('T')[0];
};

export const generateTwiceWeeklySessions = (
  startDate: string,
  sessionDay1: string,
  sessionTime1: string,
  sessionDay2: string,
  sessionTime2: string,
  numberOfWeeks: number = 8
) => {
  const sessions: { date: string; status: string; time: string }[] = [];
  
  const startDateObj = new Date(startDate + 'T00:00:00');
  const targetDay1 = dayOfWeekMap[sessionDay1.toLowerCase()];
  const targetDay2 = dayOfWeekMap[sessionDay2.toLowerCase()];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Generate sessions for first day of the week
  let currentDate1 = new Date(startDateObj);
  const currentDayOfWeek1 = currentDate1.getDay();
  let daysToAdd1 = targetDay1 - currentDayOfWeek1;
  if (daysToAdd1 < 0) daysToAdd1 += 7;
  currentDate1.setDate(currentDate1.getDate() + daysToAdd1);

  for (let i = 0; i < numberOfWeeks; i++) {
    const sessionDate = currentDate1.toISOString().split('T')[0];
    const [hours, minutes] = sessionTime1.split(':').map(Number);
    const sessionDateTime = new Date(currentDate1);
    sessionDateTime.setHours(hours, minutes, 0, 0);
    const status = sessionDateTime < now ? 'attended' : 'scheduled';
    sessions.push({ date: sessionDate, status, time: sessionTime1 });
    currentDate1.setDate(currentDate1.getDate() + 7);
  }

  // Generate sessions for second day of the week
  let currentDate2 = new Date(startDateObj);
  const currentDayOfWeek2 = currentDate2.getDay();
  let daysToAdd2 = targetDay2 - currentDayOfWeek2;
  if (daysToAdd2 < 0) daysToAdd2 += 7;
  currentDate2.setDate(currentDate2.getDate() + daysToAdd2);

  for (let i = 0; i < numberOfWeeks; i++) {
    const sessionDate = currentDate2.toISOString().split('T')[0];
    const [hours, minutes] = sessionTime2.split(':').map(Number);
    const sessionDateTime = new Date(currentDate2);
    sessionDateTime.setHours(hours, minutes, 0, 0);
    const status = sessionDateTime < now ? 'attended' : 'scheduled';
    sessions.push({ date: sessionDate, status, time: sessionTime2 });
    currentDate2.setDate(currentDate2.getDate() + 7);
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
  // Get Brazil date
  const now = new Date();
  const brazilOffset = -3 * 60; // Brazil is UTC-3
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const brazilTime = new Date(utcTime + (brazilOffset * 60000));
  const today = format(brazilTime, 'yyyy-MM-dd');
  
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
