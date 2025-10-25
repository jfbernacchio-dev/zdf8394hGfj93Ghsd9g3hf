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
  frequency: 'weekly' | 'biweekly',
  endDate?: Date
) => {
  const sessions: { date: string; status: string }[] = [];
  const start = parseISO(startDate);
  const targetDayOfWeek = dayOfWeekMap[sessionDay];
  const end = endDate || new Date();
  const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 0 });

  // Find the first occurrence of the session day on or after start date
  let currentDate = startOfDay(start);
  const startDayOfWeek = currentDate.getDay();
  let daysUntilTarget = targetDayOfWeek - startDayOfWeek;
  if (daysUntilTarget < 0) daysUntilTarget += 7;
  
  currentDate = addWeeks(currentDate, 0);
  currentDate.setDate(currentDate.getDate() + daysUntilTarget);

  // Generate sessions from first occurrence until end date
  while (isBefore(currentDate, end) || currentDate.getTime() === startOfDay(end).getTime()) {
    const sessionDate = format(currentDate, 'yyyy-MM-dd');
    // Mark sessions before current week as "completed" (Compareceu)
    const status = isBefore(currentDate, startOfCurrentWeek) ? 'completed' : 'scheduled';
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
