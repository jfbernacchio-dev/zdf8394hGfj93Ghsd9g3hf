export const ensureFutureSessions = async (
  patientId: string,
  patient: any,
  supabase: any,
  targetCount: number = 4
) => {
  const today = new Date().toISOString().split('T')[0];
  
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

const dayOfWeekMap: { [key: string]: number } = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const getNextSessionDate = (
  lastSessionDate: string,
  sessionDay: string,
  frequency: 'weekly' | 'biweekly'
): string => {
  const lastDate = new Date(lastSessionDate + 'T00:00:00');
  const targetDayOfWeek = dayOfWeekMap[sessionDay.toLowerCase()];
  const weeksToAdd = frequency === 'weekly' ? 1 : 2;
  
  // First, find the next occurrence of the target day
  let nextDate = new Date(lastDate);
  const currentDayOfWeek = nextDate.getDay();
  let daysToAdd = targetDayOfWeek - currentDayOfWeek;
  
  // If target day is today or in the past this week, move to next week
  if (daysToAdd <= 0) {
    daysToAdd += 7;
  }
  
  nextDate.setDate(nextDate.getDate() + daysToAdd);
  
  // Now check if we need to skip weeks based on frequency
  // If biweekly, we might need to add another week
  if (frequency === 'biweekly') {
    const daysDiff = Math.floor((nextDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff < 14) {
      nextDate.setDate(nextDate.getDate() + 7);
    }
  }
  
  return nextDate.toISOString().split('T')[0];
};
