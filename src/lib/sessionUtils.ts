import { addWeeks, format, isBefore, startOfDay, parseISO, startOfWeek } from 'date-fns';

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
  const start = parseISO(startDate);
  const targetDayOfWeek = dayOfWeekMap[sessionDay];
  const end = endDate || new Date();
  const now = new Date();

  // Find the first occurrence of the session day on or after start date
  let currentDate = new Date(start);
  currentDate.setHours(0, 0, 0, 0);
  
  const startDayOfWeek = currentDate.getDay();
  let daysUntilTarget = targetDayOfWeek - startDayOfWeek;
  
  // If the target day is before the start day, move to next week
  if (daysUntilTarget < 0) {
    daysUntilTarget += 7;
  }
  
  // Add the days to reach the target day of week
  currentDate.setDate(currentDate.getDate() + daysUntilTarget);

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
