import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, Plus, CheckCircle, XCircle, DollarSign, ArrowLeft, Lock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, addDays, isBefore, parseISO, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor, DragOverlay } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { DraggableSession } from '@/components/DraggableSession';
import { DroppableSlot } from '@/components/DroppableSlot';

const Schedule = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const therapistId = searchParams.get('therapist'); // ID do terapeuta sendo visualizado pelo admin
  const embedMode = searchParams.get('embed') === 'true'; // Modo embed para não mostrar navbar
  const effectiveUserId = therapistId || user?.id; // Usa therapist ID se fornecido, senão usa o user logado
  
  const [sessions, setSessions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'day' | 'week'>('month');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [scheduleBlocks, setScheduleBlocks] = useState<any[]>([]);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [showBreakWarning, setShowBreakWarning] = useState(false);
  const [showTimeConflictWarning, setShowTimeConflictWarning] = useState(false);
  const [conflictDetails, setConflictDetails] = useState<{existingSession: any, newSession: any} | null>(null);
  const [draggedSession, setDraggedSession] = useState<any>(null);
  const { toast } = useToast();

  // Setup drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const [blockForm, setBlockForm] = useState({
    day_of_week: '1',
    start_time: '12:00',
    end_time: '13:00',
    reason: '',
    blockType: 'indefinite', // 'indefinite', 'date-range', 'from-date'
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    replicate_weeks: 1
  });

  // Helper to get Brazil date using native timezone conversion
  const getBrazilDate = () => {
    return new Date().toLocaleString('en-CA', { 
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).split(',')[0]; // Returns 'YYYY-MM-DD'
  };

  const [formData, setFormData] = useState({
    patient_id: '',
    date: getBrazilDate(),
    status: 'scheduled',
    notes: '',
    value: '',
    paid: false,
    time: ''
  });

  useEffect(() => {
    if (effectiveUserId) {
      loadProfile();
      loadData();
      loadScheduleBlocks();
      autoUpdateOldSessions();
    }
  }, [effectiveUserId, currentMonth]);

  const loadProfile = async () => {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', effectiveUserId!)
      .single();

    setProfile(profileData);
  };

  const autoUpdateOldSessions = async () => {
    // Get all scheduled sessions with patient info
    const { data: scheduledSessions } = await supabase
      .from('sessions')
      .select('*, patients!inner(*)')
      .eq('patients.user_id', effectiveUserId!)
      .eq('status', 'scheduled');

    if (!scheduledSessions) return;

    const now = new Date();
    const sessionsToUpdate: string[] = [];

    // Check each session's date + time
    scheduledSessions.forEach(session => {
      const sessionDate = parseISO(session.date);
      const [hours, minutes] = (session.patients.session_time || '00:00').split(':').map(Number);
      sessionDate.setHours(hours, minutes, 0, 0);

      if (sessionDate < now) {
        sessionsToUpdate.push(session.id);
      }
    });

    // Update all sessions that have passed
    if (sessionsToUpdate.length > 0) {
      const { error } = await supabase
        .from('sessions')
        .update({ status: 'attended' })
        .in('id', sessionsToUpdate);

      if (error) console.error('Erro ao atualizar sessões:', error);
    }
  };

  const loadData = async () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);

    const { data: sessionsData } = await supabase
      .from('sessions')
      .select('*, patients!inner(*)')
      .eq('patients.user_id', effectiveUserId!)
      .gte('date', format(start, 'yyyy-MM-dd'))
      .lte('date', format(end, 'yyyy-MM-dd'))
      .order('date', { ascending: true });

    const { data: patientsData } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', effectiveUserId!)
      .eq('status', 'active');

    setSessions(sessionsData || []);
    setPatients(patientsData || []);
  };

  const loadScheduleBlocks = async () => {
    const { data } = await supabase
      .from('schedule_blocks')
      .select('*')
      .eq('user_id', effectiveUserId!);
    
    setScheduleBlocks(data || []);
  };

  const isTimeBlocked = (dayOfWeek: number, time: string, date?: Date) => {
    return scheduleBlocks.some(block => {
      if (block.day_of_week !== dayOfWeek) return false;
      
      // Check date range if provided
      if (date && block.start_date) {
        const blockStart = parseISO(block.start_date);
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        blockStart.setHours(0, 0, 0, 0);
        
        if (checkDate < blockStart) return false;
        
        if (block.end_date) {
          const blockEnd = parseISO(block.end_date);
          blockEnd.setHours(0, 0, 0, 0);
          if (checkDate > blockEnd) return false;
        }
      }
      
      return time >= block.start_time && time < block.end_time;
    });
  };

  const handleCreateBlock = async () => {
    let blockData: any = {
      user_id: effectiveUserId!,
      day_of_week: parseInt(blockForm.day_of_week),
      start_time: blockForm.start_time,
      end_time: blockForm.end_time,
      reason: blockForm.reason
    };

    if (blockForm.blockType === 'date-range') {
      blockData.start_date = blockForm.start_date;
      blockData.end_date = blockForm.end_date;
    } else if (blockForm.blockType === 'from-date') {
      blockData.start_date = blockForm.start_date;
      blockData.end_date = null;
    } else if (blockForm.blockType === 'replicate') {
      // Create multiple blocks for X weeks starting from start_date
      const blocks = [];
      const startDate = parseISO(blockForm.start_date);
      
      for (let week = 0; week < blockForm.replicate_weeks; week++) {
        const weekDate = addDays(startDate, week * 7);
        blocks.push({
          user_id: effectiveUserId!,
          day_of_week: parseInt(blockForm.day_of_week),
          start_time: blockForm.start_time,
          end_time: blockForm.end_time,
          reason: blockForm.reason,
          start_date: format(weekDate, 'yyyy-MM-dd'),
          end_date: format(weekDate, 'yyyy-MM-dd')
        });
      }
      
      const { error } = await supabase
        .from('schedule_blocks')
        .insert(blocks);

      if (error) {
        toast({ title: 'Erro ao criar bloqueios', variant: 'destructive' });
        return;
      }

      toast({ title: `${blockForm.replicate_weeks} bloqueio(s) criado(s) com sucesso!` });
      setIsBlockDialogOpen(false);
      resetBlockForm();
      loadScheduleBlocks();
      return;
    }

    const { error } = await supabase
      .from('schedule_blocks')
      .insert([blockData]);

    if (error) {
      toast({ title: 'Erro ao criar bloqueio', variant: 'destructive' });
      return;
    }

    toast({ title: 'Bloqueio criado com sucesso!' });
    setIsBlockDialogOpen(false);
    resetBlockForm();
    loadScheduleBlocks();
  };

  const resetBlockForm = () => {
    setBlockForm({
      day_of_week: '1',
      start_time: '12:00',
      end_time: '13:00',
      reason: '',
      blockType: 'indefinite',
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: format(new Date(), 'yyyy-MM-dd'),
      replicate_weeks: 1
    });
  };

  const deleteBlock = async (blockId: string) => {
    const { error } = await supabase
      .from('schedule_blocks')
      .delete()
      .eq('id', blockId);

    if (!error) {
      toast({ title: 'Bloqueio removido' });
      loadScheduleBlocks();
    }
  };

  const checkTimeConflict = async (date: string, time: string, excludeSessionId?: string): Promise<{hasConflict: boolean, conflictSession?: any}> => {
    if (!time) return { hasConflict: false };
    
    // Fetch all sessions on the same date
    const { data: sessionsOnSameDate } = await supabase
      .from('sessions')
      .select('*, patients!inner(*)')
      .eq('patients.user_id', effectiveUserId!)
      .eq('date', date);
    
    if (!sessionsOnSameDate) return { hasConflict: false };
    
    // Check if any session is at the exact same time
    const conflictSession = sessionsOnSameDate.find(s => {
      if (excludeSessionId && s.id === excludeSessionId) return false;
      const otherTime = s.time || s.patients?.session_time;
      return otherTime === time;
    });
    
    return {
      hasConflict: !!conflictSession,
      conflictSession
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for time conflict (same time slot)
    if (formData.time) {
      const { hasConflict, conflictSession } = await checkTimeConflict(
        formData.date, 
        formData.time,
        editingSession?.id
      );
      
      if (hasConflict) {
        setConflictDetails({
          existingSession: conflictSession,
          newSession: formData
        });
        setShowTimeConflictWarning(true);
        return;
      }
    }
    
    // Check for break time conflict before saving (both new and edited sessions)
    if (profile && formData.time) {
      const breakTime = profile.break_time || 15;
      const sessionTime = formData.time;
      const sessionDate = formData.date;
      
      // Fetch all sessions on the same date from database
      const { data: sessionsOnSameDate } = await supabase
        .from('sessions')
        .select('*, patients!inner(*)')
        .eq('patients.user_id', effectiveUserId!)
        .eq('date', sessionDate);
      
      // Check if any session conflicts with break time
      const hasBreakConflict = sessionsOnSameDate?.some(s => {
        const otherTime = s.time || s.patients?.session_time;
        if (!otherTime) return false;
        
        const [sessionHour, sessionMin] = sessionTime.split(':').map(Number);
        const [otherHour, otherMin] = otherTime.split(':').map(Number);
        const sessionMinutes = sessionHour * 60 + sessionMin;
        const otherMinutes = otherHour * 60 + otherMin;
        const slotDuration = profile.slot_duration || 60;
        
        // Check if one session starts before the other ends + break time
        // If session A ends at 11:00 and session B starts at 11:15, gap is 15 minutes
        const gap = Math.abs(sessionMinutes - otherMinutes);
        
        // Sessions overlap or don't have enough break time between them
        if (gap === 0) return false; // Same time, will be caught by other validation
        
        // Check if the gap between session start times is less than slot duration + break
        return gap < (slotDuration + breakTime);
      });
      
      if (hasBreakConflict) {
        setShowBreakWarning(true);
        return;
      }
    }
    
    const sessionData = {
      patient_id: formData.patient_id,
      date: formData.date,
      status: formData.status,
      notes: formData.notes,
      value: parseFloat(formData.value),
      paid: formData.paid,
      time: formData.time || null
    };

    if (editingSession) {
      const { error } = await supabase
        .from('sessions')
        .update(sessionData)
        .eq('id', editingSession.id);

      if (error) {
        toast({ title: 'Erro ao atualizar sessão', variant: 'destructive' });
        return;
      }
      toast({ title: 'Sessão atualizada com sucesso!' });
    } else {
      const { error } = await supabase
        .from('sessions')
        .insert([sessionData]);

      if (error) {
        toast({ title: 'Erro ao criar sessão', variant: 'destructive' });
        return;
      }
      toast({ title: 'Sessão criada com sucesso!' });
    }

    setIsDialogOpen(false);
    setEditingSession(null);
      setFormData({
      patient_id: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      status: 'scheduled',
      notes: '',
      value: '',
      paid: false,
      time: ''
    });
    loadData();
  };

  const confirmWithoutBreak = async () => {
    setShowBreakWarning(false);
    
    const sessionData = {
      patient_id: formData.patient_id,
      date: formData.date,
      status: formData.status,
      notes: formData.notes,
      value: parseFloat(formData.value),
      paid: formData.paid,
      time: formData.time || null
    };

    const { error } = await supabase
      .from('sessions')
      .insert([sessionData]);

    if (error) {
      toast({ title: 'Erro ao criar sessão', variant: 'destructive' });
      return;
    }
    
    toast({ title: 'Sessão criada com sucesso!' });
    setIsDialogOpen(false);
    setFormData({
      patient_id: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      status: 'scheduled',
      notes: '',
      value: '',
      paid: false,
      time: ''
    });
    loadData();
  };

  const confirmWithTimeConflict = async () => {
    setShowTimeConflictWarning(false);
    
    const sessionData = {
      patient_id: formData.patient_id,
      date: formData.date,
      status: formData.status,
      notes: formData.notes,
      value: parseFloat(formData.value),
      paid: formData.paid,
      time: formData.time || null
    };

    if (editingSession) {
      const { error } = await supabase
        .from('sessions')
        .update(sessionData)
        .eq('id', editingSession.id);

      if (error) {
        toast({ title: 'Erro ao atualizar sessão', variant: 'destructive' });
        return;
      }
      toast({ title: 'Sessão atualizada com sucesso!' });
    } else {
      const { error } = await supabase
        .from('sessions')
        .insert([sessionData]);

      if (error) {
        toast({ title: 'Erro ao criar sessão', variant: 'destructive' });
        return;
      }
      toast({ title: 'Sessão criada com sucesso!' });
    }

    setIsDialogOpen(false);
    setEditingSession(null);
    setFormData({
      patient_id: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      status: 'scheduled',
      notes: '',
      value: '',
      paid: false,
      time: ''
    });
    loadData();
  };

  const deleteSession = async () => {
    if (!editingSession) return;
    
    if (!confirm('Tem certeza que deseja excluir esta sessão?')) return;
    
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', editingSession.id);

    if (error) {
      toast({ title: 'Erro ao excluir sessão', variant: 'destructive' });
      return;
    }

    toast({ title: 'Sessão excluída com sucesso!' });
    setIsDialogOpen(false);
    setEditingSession(null);
    loadData();
  };

  const openEditDialog = (session: any) => {
    setEditingSession(session);
    setFormData({
      patient_id: session.patient_id,
      date: session.date,
      status: session.status,
      notes: session.notes || '',
      value: session.value.toString(),
      paid: session.paid,
      time: session.time || session.patients?.session_time || ''
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = (date: Date) => {
    setEditingSession(null);
    setFormData({
      patient_id: '',
      date: format(date, 'yyyy-MM-dd'),
      status: 'scheduled',
      notes: '',
      value: '',
      paid: false,
      time: ''
    });
    setIsDialogOpen(true);
  };

  const toggleStatus = async (session: any) => {
    // Prevent marking future sessions as attended
    if (session.status === 'scheduled' && isBefore(new Date(), parseISO(session.date))) {
      toast({ 
        title: 'Não é possível marcar como compareceu', 
        description: 'Sessões futuras não podem ser marcadas como comparecidas.',
        variant: 'destructive' 
      });
      return;
    }

    const newStatus = session.status === 'scheduled' ? 'attended' : 
                     session.status === 'attended' ? 'missed' : 'scheduled';
    
    const { error } = await supabase
      .from('sessions')
      .update({ status: newStatus })
      .eq('id', session.id);

    if (!error) {
      // If marked as attended or missed, ensure 4 future sessions exist
      if (newStatus === 'attended' || newStatus === 'missed') {
        const { ensureFutureSessions } = await import('@/lib/sessionUtils');
        await ensureFutureSessions(session.patient_id, session.patients, supabase, 4);
      }

      toast({ title: `Status alterado para ${newStatus === 'scheduled' ? 'Agendada' : newStatus === 'attended' ? 'Compareceu' : 'Não Compareceu'}` });
      loadData();
    }
  };

  const togglePaid = async (session: any) => {
    const { error } = await supabase
      .from('sessions')
      .update({ paid: !session.paid })
      .eq('id', session.id);

    if (!error) {
      toast({ title: session.paid ? 'Marcado como não pago' : 'Marcado como pago' });
      loadData();
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !draggedSession) {
      setDraggedSession(null);
      return;
    }
    
    const dropData = over.data.current as { date: string; time?: string };
    
    if (!dropData) {
      setDraggedSession(null);
      return;
    }
    
    // Check if date or time changed
    const dateChanged = dropData.date !== draggedSession.date;
    const timeChanged = dropData.time && dropData.time !== (draggedSession.time || draggedSession.patients?.session_time);
    
    if (!dateChanged && !timeChanged) {
      setDraggedSession(null);
      return;
    }
    
    // Check for time conflict at new location
    if (dropData.time) {
      const { hasConflict, conflictSession } = await checkTimeConflict(
        dropData.date,
        dropData.time,
        draggedSession.id
      );
      
      if (hasConflict) {
        setConflictDetails({
          existingSession: conflictSession,
          newSession: { ...draggedSession, date: dropData.date, time: dropData.time }
        });
        setShowTimeConflictWarning(true);
        setDraggedSession(null);
        return;
      }
    }
    
    // Update session
    const updateData: any = {
      date: dropData.date
    };
    
    if (dropData.time) {
      updateData.time = dropData.time;
    }
    
    const { error } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', draggedSession.id);
    
    if (error) {
      toast({ title: 'Erro ao mover sessão', variant: 'destructive' });
    } else {
      toast({ title: 'Sessão movida com sucesso!' });
      loadData();
    }
    
    setDraggedSession(null);
  };

  const handleDragStart = (event: any) => {
    const sessionId = event.active.id;
    const session = sessions.find(s => s.id === sessionId);
    setDraggedSession(session);
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };

  const getSessionsForDay = (day: Date) => {
    return sessions.filter(session => isSameDay(parseISO(session.date), day));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'attended': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'missed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'completed':
      case 'attended': return 'default';
      case 'missed': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
      case 'attended': return 'Compareceu';
      case 'missed': return 'Não Compareceu';
      default: return 'Agendada';
    }
  };

  const getWeekView = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));
    const hours = Array.from({ length: 15 }, (_, i) => i + 7); // 7:00 to 21:00
    const startHour = 7;

    // Calculate position based on exact time
    const getSessionPosition = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      const totalMinutes = (hours - startHour) * 60 + minutes;
      return (totalMinutes / 60) * 60; // 60px per hour
    };

    // Get blocks for a specific day with positions
    const getBlocksForDay = (dayOfWeek: number, date: Date) => {
      return scheduleBlocks
        .filter(block => {
          if (block.day_of_week !== dayOfWeek) return false;
          
          // Check date range
          if (block.start_date) {
            const blockStart = parseISO(block.start_date);
            const checkDate = new Date(date);
            checkDate.setHours(0, 0, 0, 0);
            blockStart.setHours(0, 0, 0, 0);
            
            if (checkDate < blockStart) return false;
            
            if (block.end_date) {
              const blockEnd = parseISO(block.end_date);
              blockEnd.setHours(0, 0, 0, 0);
              if (checkDate > blockEnd) return false;
            }
          }
          
          return true;
        })
        .map(block => {
          const [startHours, startMinutes] = block.start_time.split(':').map(Number);
          const [endHours, endMinutes] = block.end_time.split(':').map(Number);
          const startMinutesTotal = (startHours - startHour) * 60 + startMinutes;
          const endMinutesTotal = (endHours - startHour) * 60 + endMinutes;
          return {
            ...block,
            startMinutes: startMinutesTotal,
            endMinutes: endMinutesTotal
          };
        });
    };

    return (
      <Card className="p-6">
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setViewMode('month')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao mês
            </Button>
            <h2 className="text-xl font-semibold">
              {format(weekStart, "d 'de' MMMM", { locale: ptBR })} - {format(addDays(weekStart, 4), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </h2>
            <div className="w-[120px]" /> {/* Spacer for alignment */}
          </div>
          
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, -7))}>
                ← Anterior
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, 7))}>
                Próxima →
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Lock className="mr-2 h-4 w-4" />
                    Bloqueios
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Bloqueio de Agenda</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Dia da Semana</Label>
                      <Select value={blockForm.day_of_week} onValueChange={(value) => setBlockForm({...blockForm, day_of_week: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Segunda-feira</SelectItem>
                          <SelectItem value="2">Terça-feira</SelectItem>
                          <SelectItem value="3">Quarta-feira</SelectItem>
                          <SelectItem value="4">Quinta-feira</SelectItem>
                          <SelectItem value="5">Sexta-feira</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Início</Label>
                        <Input type="time" value={blockForm.start_time} onChange={(e) => setBlockForm({...blockForm, start_time: e.target.value})} />
                      </div>
                      <div>
                        <Label>Fim</Label>
                        <Input type="time" value={blockForm.end_time} onChange={(e) => setBlockForm({...blockForm, end_time: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <Label>Motivo (opcional)</Label>
                      <Input value={blockForm.reason} onChange={(e) => setBlockForm({...blockForm, reason: e.target.value})} placeholder="Ex: Almoço, Reunião..." />
                    </div>
                    <div>
                      <Label>Tipo de Bloqueio</Label>
                      <Select value={blockForm.blockType} onValueChange={(value) => setBlockForm({...blockForm, blockType: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="indefinite">Indefinido (todas as semanas)</SelectItem>
                          <SelectItem value="date-range">Período específico</SelectItem>
                          <SelectItem value="from-date">A partir de uma data</SelectItem>
                          <SelectItem value="replicate">Replicar por X semanas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {blockForm.blockType === 'date-range' && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Data Início</Label>
                          <Input type="date" value={blockForm.start_date} onChange={(e) => setBlockForm({...blockForm, start_date: e.target.value})} />
                        </div>
                        <div>
                          <Label>Data Fim</Label>
                          <Input type="date" value={blockForm.end_date} onChange={(e) => setBlockForm({...blockForm, end_date: e.target.value})} />
                        </div>
                      </div>
                    )}
                    
                    {blockForm.blockType === 'from-date' && (
                      <div>
                        <Label>Data de Início</Label>
                        <Input type="date" value={blockForm.start_date} onChange={(e) => setBlockForm({...blockForm, start_date: e.target.value})} />
                        <p className="text-xs text-muted-foreground mt-1">Bloqueio sem data de término</p>
                      </div>
                    )}
                    
                    {blockForm.blockType === 'replicate' && (
                      <>
                        <div>
                          <Label>Data de Início</Label>
                          <Input type="date" value={blockForm.start_date} onChange={(e) => setBlockForm({...blockForm, start_date: e.target.value})} />
                        </div>
                        <div>
                          <Label>Replicar por quantas semanas?</Label>
                          <Input type="number" min="1" value={blockForm.replicate_weeks} onChange={(e) => setBlockForm({...blockForm, replicate_weeks: parseInt(e.target.value)})} />
                        </div>
                      </>
                    )}
                    
                    <Button onClick={handleCreateBlock} className="w-full">Criar Bloqueio</Button>
                    
                    <div className="border-t pt-4 mt-4">
                      <h3 className="font-semibold mb-2">Bloqueios Existentes</h3>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {scheduleBlocks.map(block => (
                          <div key={block.id} className="flex justify-between items-center p-2 bg-muted rounded">
                            <div className="text-sm">
                              <p className="font-medium">
                                {['', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'][block.day_of_week]} - {block.start_time} às {block.end_time}
                              </p>
                              {block.reason && <p className="text-xs text-muted-foreground">{block.reason}</p>}
                              {block.start_date && (
                                <p className="text-xs text-muted-foreground">
                                  {block.end_date ? 
                                    `${format(parseISO(block.start_date), 'dd/MM/yy')} - ${format(parseISO(block.end_date), 'dd/MM/yy')}` :
                                    `A partir de ${format(parseISO(block.start_date), 'dd/MM/yy')}`
                                  }
                                </p>
                              )}
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => deleteBlock(block.id)}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button size="sm" onClick={() => openNewDialog(selectedDate)}>
                <Plus className="mr-2 h-4 w-4" /> Nova Sessão
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-0 border rounded-lg overflow-hidden">
          {/* Header row */}
          <div className="bg-muted/50 p-2 font-semibold text-sm border-r sticky top-0 z-10">Horário</div>
          {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'].map((day, index) => (
            <div 
              key={day} 
              className="bg-muted/50 p-2 text-center border-r last:border-r-0 sticky top-0 z-10 cursor-pointer hover:bg-muted transition-colors"
              onClick={() => {
                setSelectedDate(weekDays[index]);
                setViewMode('day');
              }}
            >
              <h3 className="font-semibold text-sm">{day}</h3>
              <p className="text-xs text-muted-foreground">{format(weekDays[index], 'dd/MM')}</p>
            </div>
          ))}

          {/* Time slots with absolute positioning */}
          {hours.map(hour => (
            <div key={hour} className="contents">
              <div className="bg-muted/30 p-2 text-sm font-medium text-muted-foreground border-t border-r h-[60px] flex items-start">
                {hour.toString().padStart(2, '0')}:00
              </div>
              {weekDays.map((dayDate, dayIndex) => {
                const dayOfWeek = getDay(dayDate);
                const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;
                const dateStr = format(dayDate, 'yyyy-MM-dd');
                const timeStr = `${hour.toString().padStart(2, '0')}:00`;
                
                const allDaySessions = sessions.filter(s => s.date === dateStr);
                const dayBlocks = getBlocksForDay(adjustedDay, dayDate);

                return (
                  <DroppableSlot
                    key={`${hour}-${dayIndex}`}
                    id={`week-slot-${dateStr}-${timeStr}`}
                    date={dateStr}
                    time={timeStr}
                    className="h-[60px] border-t border-r last:border-r-0 relative hover:bg-accent/20 transition-colors"
                  >
                    {hour === 7 && (
                      <>
                        {dayBlocks.map(block => (
                          <div
                            key={block.id}
                            className="absolute inset-x-0 bg-destructive/15 border-2 border-destructive/30 rounded flex items-center justify-center text-xs text-destructive z-10 pointer-events-none"
                            style={{
                              top: `${(block.startMinutes / 60) * 60}px`,
                              height: `${((block.endMinutes - block.startMinutes) / 60) * 60}px`,
                            }}
                          >
                            <span className="font-medium">🚫 Bloqueado</span>
                          </div>
                        ))}
                        
                        {allDaySessions.map(session => {
                          const sessionTime = session.time || session.patients?.session_time || '00:00';
                          const topPosition = getSessionPosition(sessionTime);
                          
                          return (
                            <DraggableSession key={session.id} id={session.id}>
                              <Card
                                className="absolute left-1 right-1 cursor-grab active:cursor-grabbing hover:shadow-md transition-all border-l-4 p-2 z-20"
                                style={{
                                  top: `${topPosition}px`,
                                  height: '56px',
                                  borderLeftColor: session.status === 'attended' ? 'hsl(var(--chart-2))' : 
                                                 session.status === 'missed' ? 'hsl(var(--destructive))' : 
                                                 'hsl(var(--primary))'
                                }}
                                onClick={() => openEditDialog(session)}
                              >
                                <div className="flex items-center justify-between h-full">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-xs truncate">{session.patients.name}</p>
                                    <p className="text-[10px] text-muted-foreground">{sessionTime}</p>
                                  </div>
                                  <Badge variant={getStatusVariant(session.status)} className="text-[10px] px-1.5 py-0.5 ml-1 shrink-0">
                                    {getStatusText(session.status)}
                                  </Badge>
                                </div>
                              </Card>
                            </DraggableSession>
                          );
                        })}
                      </>
                    )}
                  </DroppableSlot>
                );
              })}
            </div>
          ))}
        </div>
      </Card>
    );
  };

  const getDayView = () => {
    const daySessions = getSessionsForDay(selectedDate);
    const hours = Array.from({ length: 15 }, (_, i) => i + 7); // 7:00 to 21:00
    const dayOfWeek = getDay(selectedDate);
    const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;
    const startHour = 7;

    // Calculate position based on exact time
    const getSessionPosition = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      const totalMinutes = (hours - startHour) * 60 + minutes;
      return (totalMinutes / 60) * 60; // 60px per hour
    };

    // Get blocks for this day with positions
    const getBlocksForDay = () => {
      return scheduleBlocks
        .filter(block => {
          if (block.day_of_week !== adjustedDay) return false;
          
          // Check date range
          if (block.start_date) {
            const blockStart = parseISO(block.start_date);
            const checkDate = new Date(selectedDate);
            checkDate.setHours(0, 0, 0, 0);
            blockStart.setHours(0, 0, 0, 0);
            
            if (checkDate < blockStart) return false;
            
            if (block.end_date) {
              const blockEnd = parseISO(block.end_date);
              blockEnd.setHours(0, 0, 0, 0);
              if (checkDate > blockEnd) return false;
            }
          }
          
          return true;
        })
        .map(block => {
          const [startHours, startMinutes] = block.start_time.split(':').map(Number);
          const [endHours, endMinutes] = block.end_time.split(':').map(Number);
          const startMinutesTotal = (startHours - startHour) * 60 + startMinutes;
          const endMinutesTotal = (endHours - startHour) * 60 + endMinutes;
          return {
            ...block,
            startMinutes: startMinutesTotal,
            endMinutes: endMinutesTotal
          };
        });
    };

    const dayBlocks = getBlocksForDay();

    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setViewMode('month')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao mês
            </Button>
            <Button variant="outline" onClick={() => {
              setViewMode('week');
              setSelectedDate(selectedDate);
            }}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              Ver Semana
            </Button>
          </div>
          <h2 className="text-xl font-semibold">
            {format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
          <div className="flex gap-2">
            <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Lock className="mr-2 h-4 w-4" />
                  Bloqueios
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bloqueio de Agenda</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Dia da Semana</Label>
                    <Select value={blockForm.day_of_week} onValueChange={(value) => setBlockForm({...blockForm, day_of_week: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Segunda-feira</SelectItem>
                        <SelectItem value="2">Terça-feira</SelectItem>
                        <SelectItem value="3">Quarta-feira</SelectItem>
                        <SelectItem value="4">Quinta-feira</SelectItem>
                        <SelectItem value="5">Sexta-feira</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Início</Label>
                      <Input type="time" value={blockForm.start_time} onChange={(e) => setBlockForm({...blockForm, start_time: e.target.value})} />
                    </div>
                    <div>
                      <Label>Fim</Label>
                      <Input type="time" value={blockForm.end_time} onChange={(e) => setBlockForm({...blockForm, end_time: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <Label>Motivo (opcional)</Label>
                    <Input value={blockForm.reason} onChange={(e) => setBlockForm({...blockForm, reason: e.target.value})} placeholder="Ex: Almoço, Reunião..." />
                  </div>
                      <div>
                        <Label>Tipo de Bloqueio</Label>
                        <Select value={blockForm.blockType} onValueChange={(value) => setBlockForm({...blockForm, blockType: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="indefinite">Indefinido (todas as semanas)</SelectItem>
                            <SelectItem value="date-range">Período específico</SelectItem>
                            <SelectItem value="from-date">A partir de uma data</SelectItem>
                            <SelectItem value="replicate">Replicar por X semanas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {blockForm.blockType === 'date-range' && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label>Data Início</Label>
                            <Input type="date" value={blockForm.start_date} onChange={(e) => setBlockForm({...blockForm, start_date: e.target.value})} />
                          </div>
                          <div>
                            <Label>Data Fim</Label>
                            <Input type="date" value={blockForm.end_date} onChange={(e) => setBlockForm({...blockForm, end_date: e.target.value})} />
                          </div>
                        </div>
                      )}
                      
                      {blockForm.blockType === 'from-date' && (
                        <div>
                          <Label>Data de Início</Label>
                          <Input type="date" value={blockForm.start_date} onChange={(e) => setBlockForm({...blockForm, start_date: e.target.value})} />
                          <p className="text-xs text-muted-foreground mt-1">Bloqueio sem data de término</p>
                        </div>
                      )}
                      
                      {blockForm.blockType === 'replicate' && (
                        <>
                          <div>
                            <Label>Data de Início</Label>
                            <Input type="date" value={blockForm.start_date} onChange={(e) => setBlockForm({...blockForm, start_date: e.target.value})} />
                          </div>
                          <div>
                            <Label>Replicar por quantas semanas?</Label>
                            <Input type="number" min="1" value={blockForm.replicate_weeks} onChange={(e) => setBlockForm({...blockForm, replicate_weeks: parseInt(e.target.value)})} />
                          </div>
                        </>
                      )}
                      
                      <Button onClick={handleCreateBlock} className="w-full">Criar Bloqueio</Button>
                  
                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-semibold mb-2">Bloqueios Existentes</h3>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {scheduleBlocks.map(block => (
                        <div key={block.id} className="flex justify-between items-center p-2 bg-muted rounded">
                          <div className="text-sm">
                            <p className="font-medium">
                              {['', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'][block.day_of_week]} - {block.start_time} às {block.end_time}
                            </p>
                            {block.reason && <p className="text-xs text-muted-foreground">{block.reason}</p>}
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => deleteBlock(block.id)}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button onClick={() => openNewDialog(selectedDate)}>
              <Plus className="mr-2 h-4 w-4" /> Nova Sessão
            </Button>
          </div>
        </div>

        {/* Timeline view with proportional positioning */}
        <div className="relative border rounded-lg">
          {hours.map(hour => {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const timeStr = `${hour.toString().padStart(2, '0')}:00`;
            
            return (
              <div key={hour} className="flex border-b last:border-b-0 h-[60px] relative">
                <div className="w-20 p-2 text-sm font-semibold text-muted-foreground border-r flex items-start">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <DroppableSlot
                  id={`day-slot-${dateStr}-${timeStr}`}
                  date={dateStr}
                  time={timeStr}
                  className="flex-1 relative hover:bg-accent/10 transition-colors"
                >
                  {hour === 7 && (
                    <>
                      {dayBlocks.map(block => (
                        <div
                          key={block.id}
                          className="absolute inset-x-0 mx-2 bg-destructive/15 border-2 border-destructive/30 rounded flex items-center justify-center text-xs text-destructive z-10 pointer-events-none"
                          style={{
                            top: `${(block.startMinutes / 60) * 60}px`,
                            height: `${((block.endMinutes - block.startMinutes) / 60) * 60}px`,
                          }}
                        >
                          <span className="font-medium">🚫 Bloqueado</span>
                        </div>
                      ))}
                      
                      {daySessions.map(session => {
                        const sessionTime = session.time || session.patients?.session_time || '00:00';
                        const topPosition = getSessionPosition(sessionTime);
                        
                        return (
                          <DraggableSession key={session.id} id={session.id}>
                            <div
                              className={`absolute left-2 right-2 p-3 rounded-lg cursor-grab active:cursor-grabbing transition-all z-20 ${getStatusColor(session.status)}`}
                              style={{
                                top: `${topPosition}px`,
                                height: '56px',
                              }}
                              onClick={() => openEditDialog(session)}
                            >
                              <div className="flex justify-between items-center h-full">
                                <div>
                                  <p className="font-semibold text-sm">{session.patients.name}</p>
                                  <p className="text-xs">{sessionTime}</p>
                                </div>
                                <div className="text-right text-xs">
                                  {session.paid && <p>💰 Pago</p>}
                                  {session.status === 'missed' && <p>Sem Cobrança</p>}
                                  {session.status === 'attended' && !session.paid && <p>A Pagar</p>}
                                </div>
                              </div>
                            </div>
                          </DraggableSession>
                        );
                      })}
                    </>
                  )}
                </DroppableSlot>
              </div>
            );
          })}
        </div>
      </Card>
    );
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Agenda</h1>
          {viewMode === 'month' && (
            <Button onClick={() => openNewDialog(selectedDate)}>
              <Plus className="mr-2 h-4 w-4" /> Nova Sessão
            </Button>
          )}
        </div>

        {viewMode === 'month' ? (
          <Card className="p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  ← Anterior
                </Button>
                <Button variant="outline" onClick={() => {
                  setViewMode('week');
                  setSelectedDate(new Date());
                }}>
                  Visualização Semanal
                </Button>
                <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Lock className="mr-2 h-4 w-4" />
                      Bloqueios
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Bloqueio de Agenda</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Dia da Semana</Label>
                        <Select value={blockForm.day_of_week} onValueChange={(value) => setBlockForm({...blockForm, day_of_week: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Segunda-feira</SelectItem>
                            <SelectItem value="2">Terça-feira</SelectItem>
                            <SelectItem value="3">Quarta-feira</SelectItem>
                            <SelectItem value="4">Quinta-feira</SelectItem>
                            <SelectItem value="5">Sexta-feira</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Início</Label>
                          <Input type="time" value={blockForm.start_time} onChange={(e) => setBlockForm({...blockForm, start_time: e.target.value})} />
                        </div>
                        <div>
                          <Label>Fim</Label>
                          <Input type="time" value={blockForm.end_time} onChange={(e) => setBlockForm({...blockForm, end_time: e.target.value})} />
                        </div>
                      </div>
                      <div>
                        <Label>Motivo (opcional)</Label>
                        <Input value={blockForm.reason} onChange={(e) => setBlockForm({...blockForm, reason: e.target.value})} placeholder="Ex: Almoço, Reunião..." />
                      </div>
                      <div>
                        <Label>Tipo de Bloqueio</Label>
                        <Select value={blockForm.blockType} onValueChange={(value) => setBlockForm({...blockForm, blockType: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="indefinite">Indefinido (todas as semanas)</SelectItem>
                            <SelectItem value="date-range">Período específico</SelectItem>
                            <SelectItem value="from-date">A partir de uma data</SelectItem>
                            <SelectItem value="replicate">Replicar por X semanas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {blockForm.blockType === 'date-range' && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label>Data Início</Label>
                            <Input type="date" value={blockForm.start_date} onChange={(e) => setBlockForm({...blockForm, start_date: e.target.value})} />
                          </div>
                          <div>
                            <Label>Data Fim</Label>
                            <Input type="date" value={blockForm.end_date} onChange={(e) => setBlockForm({...blockForm, end_date: e.target.value})} />
                          </div>
                        </div>
                      )}
                      
                      {blockForm.blockType === 'from-date' && (
                        <div>
                          <Label>Data de Início</Label>
                          <Input type="date" value={blockForm.start_date} onChange={(e) => setBlockForm({...blockForm, start_date: e.target.value})} />
                          <p className="text-xs text-muted-foreground mt-1">Bloqueio sem data de término</p>
                        </div>
                      )}
                      
                      {blockForm.blockType === 'replicate' && (
                        <>
                          <div>
                            <Label>Data de Início</Label>
                            <Input type="date" value={blockForm.start_date} onChange={(e) => setBlockForm({...blockForm, start_date: e.target.value})} />
                          </div>
                          <div>
                            <Label>Replicar por quantas semanas?</Label>
                            <Input type="number" min="1" value={blockForm.replicate_weeks} onChange={(e) => setBlockForm({...blockForm, replicate_weeks: parseInt(e.target.value)})} />
                          </div>
                        </>
                      )}
                      
                      <Button onClick={handleCreateBlock} className="w-full">Criar Bloqueio</Button>
                      
                      <div className="border-t pt-4 mt-4">
                        <h3 className="font-semibold mb-2">Bloqueios Existentes</h3>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                          {scheduleBlocks.map(block => (
                            <div key={block.id} className="flex justify-between items-center p-2 bg-muted rounded">
                              <div className="text-sm">
                                <p className="font-medium">
                                  {['', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'][block.day_of_week]} - {block.start_time} às {block.end_time}
                                </p>
                                {block.reason && <p className="text-xs text-muted-foreground">{block.reason}</p>}
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => deleteBlock(block.id)}>
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <h2 className="text-xl font-semibold">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </h2>
              <Button variant="outline" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                Próximo →
              </Button>
            </div>

          <div className="grid grid-cols-7 gap-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="text-center font-semibold text-sm p-2">{day}</div>
            ))}
            
            {/* Empty cells to align the 1st with the correct day of week */}
            {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[100px]" />
            ))}
            
            {getDaysInMonth().map((day, index) => {
              const daySessions = getSessionsForDay(day);
              const isToday = isSameDay(day, new Date());
              const dayOfWeek = getDay(day);
              const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;
              const dateStr = format(day, 'yyyy-MM-dd');
              
              // Check if any part of the day has blocks
              const hasBlocks = scheduleBlocks.some(block => block.day_of_week === adjustedDay);
              
              return (
                <DroppableSlot
                  key={index}
                  id={`day-${dateStr}`}
                  date={dateStr}
                  className={`min-h-[100px] p-2 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors ${
                    isToday ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <div
                    onClick={() => {
                      setSelectedDate(day);
                      setViewMode('day');
                    }}
                  >
                    <div className="font-semibold text-sm mb-1 flex justify-between items-center">
                      <span>{format(day, 'd')}</span>
                      {hasBlocks && <Lock className="h-3 w-3 text-destructive" />}
                    </div>
                    <div className="space-y-1">
                      {daySessions.map(session => (
                        <DraggableSession key={session.id} id={session.id}>
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(session);
                            }}
                            className={`text-xs p-1 rounded ${getStatusColor(session.status)}`}
                          >
                            {session.patients.name}
                            {session.paid && ' 💰'}
                          </div>
                        </DraggableSession>
                      ))}
                    </div>
                  </div>
                </DroppableSlot>
              );
            })}
          </div>
        </Card>
        ) : viewMode === 'week' ? getWeekView() : getDayView()}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingSession ? 'Editar Sessão' : 'Nova Sessão'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Paciente</Label>
                <Select value={formData.patient_id} onValueChange={(value) => {
                  setFormData({ ...formData, patient_id: value });
                  const patient = patients.find(p => p.id === value);
                  if (patient) setFormData({ ...formData, patient_id: value, value: patient.session_value.toString() });
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map(patient => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Data</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>Horário</Label>
                <Input
                  type="time"
                  value={formData.time || ''}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>

              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Agendada</SelectItem>
                    <SelectItem value="attended">Compareceu</SelectItem>
                    <SelectItem value="missed">Não Compareceu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="paid"
                  checked={formData.paid}
                  onChange={(e) => setFormData({ ...formData, paid: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="paid">Pago</Label>
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              {editingSession && (
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => toggleStatus(editingSession)} className="flex-1">
                      {editingSession.status === 'scheduled' ? <CheckCircle className="mr-2 h-4 w-4" /> : <XCircle className="mr-2 h-4 w-4" />}
                      Alterar Status
                    </Button>
                    <Button type="button" variant="outline" onClick={() => togglePaid(editingSession)} className="flex-1">
                      <DollarSign className="mr-2 h-4 w-4" />
                      {editingSession.paid ? 'Marcar não pago' : 'Marcar pago'}
                    </Button>
                  </div>
                  <Button type="button" variant="destructive" onClick={deleteSession} className="w-full">
                    Excluir Sessão
                  </Button>
                </div>
              )}

              <Button type="submit" className="w-full">
                {editingSession ? 'Atualizar' : 'Criar'} Sessão
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Alert Dialog for Break Time Warning */}
        <AlertDialog open={showBreakWarning} onOpenChange={setShowBreakWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Atenção: Sem Intervalo de Descanso</AlertDialogTitle>
              <AlertDialogDescription>
                Você está agendando uma sessão muito próxima de outra, sem respeitar o tempo de descanso configurado ({profile?.break_time || 15} minutos).
                <br /><br />
                Deseja continuar mesmo assim?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmWithoutBreak}>
                Agendar Mesmo Assim
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Alert Dialog for Time Conflict Warning */}
        <AlertDialog open={showTimeConflictWarning} onOpenChange={setShowTimeConflictWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Atenção: Horário Ocupado</AlertDialogTitle>
              <AlertDialogDescription>
                {conflictDetails && (
                  <>
                    Já existe uma sessão agendada para {conflictDetails.existingSession?.patients?.name} no horário {conflictDetails.existingSession?.time || conflictDetails.existingSession?.patients?.session_time} do dia {format(parseISO(conflictDetails.existingSession?.date), 'dd/MM/yyyy')}.
                    <br /><br />
                    Deseja agendar mesmo assim? Os dois pacientes ficarão no mesmo horário.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmWithTimeConflict}>
                Sim, Agendar Mesmo Assim
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DndContext>
  );
};

export default Schedule;
