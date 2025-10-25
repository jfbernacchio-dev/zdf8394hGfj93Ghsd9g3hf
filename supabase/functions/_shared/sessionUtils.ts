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

  // Find the last session date from ALL sessions
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
    lastDate = patient.start_date;
  }

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
  const weeksToAdd = frequency === 'weekly' ? 1 : 2;
  
  // Add weeks
  lastDate.setDate(lastDate.getDate() + (weeksToAdd * 7));
  
  return lastDate.toISOString().split('T')[0];
};
