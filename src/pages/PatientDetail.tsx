import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logAdminAccess } from '@/lib/auditLog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Plus, Calendar, DollarSign, Edit, FileText, Download, Trash2, Phone, MapPin, Mail, User, Clock, Tag, AlertCircle, ChevronDown, ChevronUp, StickyNote, X, TrendingUp, TrendingDown, Activity, CreditCard } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

import { useToast } from '@/hooks/use-toast';
import { format, parseISO, startOfMonth, endOfMonth, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { PatientFiles } from '@/components/PatientFiles';
import { formatBrazilianCurrency } from '@/lib/brazilianFormat';
import IssueNFSeDialog from '@/components/IssueNFSeDialog';
import { ConsentReminder } from '@/components/ConsentReminder';
import { ResizableCard } from '@/components/ResizableCard';
import ClinicalComplaintSummary from '@/components/ClinicalComplaintSummary';
import { ResizableSection } from '@/components/ResizableSection';
import { Settings, RotateCcw } from 'lucide-react';
import { AddCardDialog } from '@/components/AddCardDialog';
import { CardConfig, ALL_AVAILABLE_CARDS } from '@/types/cardTypes';
import { DEFAULT_LAYOUT, resetToDefaultLayout } from '@/lib/defaultLayout';
import { ClinicalEvolution } from '@/components/ClinicalEvolution';
import { getSubordinateAutonomy, AutonomyPermissions } from '@/lib/checkSubordinateAutonomy';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { canAccessPatient } from '@/lib/checkPatientAccess';

const PatientDetailNew = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, isAdmin, isSubordinate } = useAuth();
  const [patient, setPatient] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [allSessions, setAllSessions] = useState<any[]>([]);
  const [nfseIssued, setNfseIssued] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [invoiceText, setInvoiceText] = useState('');
  const [invoiceSessions, setInvoiceSessions] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [period, setPeriod] = useState('last2Months');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showScheduled, setShowScheduled] = useState(false);
  const [showUnpaid, setShowUnpaid] = useState(false);
  const [complaint, setComplaint] = useState<any>(null);
  const [complaintText, setComplaintText] = useState('');
  const [isComplaintDialogOpen, setIsComplaintDialogOpen] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState<'session' | 'general'>('session');
  const [selectedSessionForNote, setSelectedSessionForNote] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isExitEditDialogOpen, setIsExitEditDialogOpen] = useState(false);
  const [tempSizes, setTempSizes] = useState<Record<string, { width: number; height: number; x: number; y: number }>>({});
  const [tempSectionHeights, setTempSectionHeights] = useState<Record<string, number>>({});
  const [isAddCardDialogOpen, setIsAddCardDialogOpen] = useState(false);
  const [visibleCards, setVisibleCards] = useState<string[]>([]);
  const [autonomyPermissions, setAutonomyPermissions] = useState<AutonomyPermissions | null>(null);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  
  const getBrazilDate = () => {
    return new Date().toLocaleString('en-CA', { 
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).split(',')[0];
  };

  const [formData, setFormData] = useState({
    date: getBrazilDate(),
    status: 'attended',
    notes: '',
    value: '',
    paid: false,
    time: '',
    showInSchedule: true,
    nfseIssued: false,
    manuallyMarkedNfse: false,
    nfseIssuedId: null as string | null
  });

  // Alert states for confirmation dialogs
  const [showNfseUnmarkAlert, setShowNfseUnmarkAlert] = useState(false);
  const [showPaidUnmarkAlert, setShowPaidUnmarkAlert] = useState(false);
  const [pendingNfseChange, setPendingNfseChange] = useState<boolean | null>(null);
  const [pendingPaidChange, setPendingPaidChange] = useState<boolean | null>(null);
  const [nfseDetails, setNfseDetails] = useState<any>(null);
  const [hasPaymentProof, setHasPaymentProof] = useState(false);

  useEffect(() => {
    // Load visible cards from localStorage
    const savedCards = localStorage.getItem('visible-cards');
    if (savedCards) {
      setVisibleCards(JSON.parse(savedCards));
    } else {
      // Use default layout
      setVisibleCards(DEFAULT_LAYOUT.visibleCards);
    }

    // Set default section heights if not already set
    Object.entries(DEFAULT_LAYOUT.sectionHeights).forEach(([id, height]) => {
      const saved = localStorage.getItem(`section-height-${id}`);
      if (!saved) {
        localStorage.setItem(`section-height-${id}`, height.toString());
      }
    });

    // Validate access before loading data
    const validateAccess = async () => {
      if (!user || !id) return;
      
      const access = await canAccessPatient(user.id, id, isAdmin);
      
      if (!access.allowed) {
        toast({
          title: "Acesso negado",
          description: access.reason,
          variant: "destructive"
        });
        navigate('/patients');
        return;
      }
      
      loadData();
    };
    
    validateAccess();
    
    const channel = supabase
      .channel('patient-sessions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions',
          filter: `patient_id=eq.${id}`
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, user, isAdmin, navigate, toast]);

  // Handle navigation state to open specific tab
  useEffect(() => {
    if (location.state?.openTab) {
      setActiveTab(location.state.openTab);
      // Clear the state to avoid reopening the tab on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // Check sessionStorage for tab redirect after layout save/cancel
  useEffect(() => {
    const returnToTab = sessionStorage.getItem('returnToTab');
    if (returnToTab) {
      setActiveTab(returnToTab);
      sessionStorage.removeItem('returnToTab');
    }
  }, []);

  useEffect(() => {
    filterSessions();
  }, [period, customStartDate, customEndDate, allSessions, showScheduled, showUnpaid]);

  const loadData = async () => {
    console.log('🔄 [LOADDATA INICIO] Carregando dados do paciente...');
    
    const { data: patientData } = await supabase.from('patients').select('*').eq('id', id).single();
    const { data: sessionsData } = await supabase.from('sessions').select('*').eq('patient_id', id).order('date', { ascending: false });
    const { data: complaintData } = await supabase.from('patient_complaints').select('*').eq('patient_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle();
    const { data: historyData } = await supabase.from('session_history').select('*').eq('patient_id', id).order('changed_at', { ascending: false });
    
    // Load NFSes issued (processing or issued status)
    const { data: nfseData } = await supabase
      .from('nfse_issued')
      .select('id, session_ids, status')
      .eq('patient_id', id!)
      .in('status', ['processing', 'issued']);
    
    if (user) {
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setUserProfile(profileData);
    }
    
    console.log('🔄 [LOADDATA SESSIONS] Sessões carregadas do banco:', sessionsData?.map(s => ({
      id: s.id,
      date: s.date,
      paid: s.paid,
      nfse_issued_id: s.nfse_issued_id,
      manually_marked_nfse: s.manually_marked_nfse,
      status: s.status
    })));
    
    // 🔍 LOG CRÍTICO: Mostrar quais NFSes contêm quais session_ids
    if (nfseData && nfseData.length > 0) {
      console.log('🔍 [NFSE ANALYSIS] Analisando NFSes carregadas para paciente:', patientData?.name);
      nfseData.forEach((nfse, index) => {
        console.log(`   NFSe ${index + 1}:`, {
          id: nfse.id,
          status: nfse.status,
          session_ids: nfse.session_ids,
          session_ids_count: nfse.session_ids?.length || 0
        });
      });
    } else {
      console.log('🔍 [NFSE ANALYSIS] Nenhuma NFSe encontrada para este paciente');
    }
    
    setPatient(patientData);
    setAllSessions(sessionsData || []);
    setNfseIssued(nfseData || []);
    setComplaint(complaintData);
    setComplaintText(complaintData?.complaint_text || '');
    setSessionHistory(historyData || []);

    // FASE 2A: Verificar autonomia corretamente
    console.log('🔍 [FASE 2A] PatientDetail - Carregando permissões:', {
      userId: user?.id,
      patientUserId: patientData?.user_id,
      isSubordinate,
      patientBelongsToUser: patientData?.user_id === user?.id,
      patientBelongsToOther: patientData?.user_id !== user?.id
    });

    if (user) {
      let autonomy: AutonomyPermissions;

      if (isSubordinate) {
        // Usuário logado é subordinado - carregar SUA autonomia
        console.log('🔍 [FASE 2A] Usuário é subordinado, carregando sua autonomia');
        autonomy = await getSubordinateAutonomy(user.id);
      } else if (patientData && patientData.user_id !== user.id) {
        // Paciente pertence a outro usuário (subordinado) - carregar autonomia DELE
        console.log('🔍 [FASE 2A] Paciente pertence a subordinado, carregando autonomia do subordinado');
        autonomy = await getSubordinateAutonomy(patientData.user_id);
      } else {
        // Usuário é Full e paciente é dele - acesso total
        console.log('🔍 [FASE 2A] Usuário é Full com paciente próprio - acesso total');
        autonomy = {
          managesOwnPatients: false,
          hasFinancialAccess: true, // ✅ CORRIGIDO: Full tem acesso financeiro
          nfseEmissionMode: 'own_company',
          canFullSeeClinic: true,
          includeInFullFinancial: true
        };
      }

      console.log('🔍 [FASE 2A] Permissões carregadas:', {
        managesOwnPatients: autonomy.managesOwnPatients,
        hasFinancialAccess: autonomy.hasFinancialAccess,
        nfseEmissionMode: autonomy.nfseEmissionMode,
        canFullSeeClinic: autonomy.canFullSeeClinic
      });

      setAutonomyPermissions(autonomy);
      setLoadingPermissions(false);
    }

    await logAdminAccess('view_patient', undefined, id, 'Admin viewed patient details (NEW UI)');
  };

  // Helper function to determine session payment status
  const getSessionPaymentStatus = (session: any): 'paid' | 'nfse_issued' | 'to_pay' => {
    const status = (() => {
      if (session.paid) return 'paid';
      
      // Check if session has NFSe (either real or manually marked)
      if (session.nfse_issued_id || session.manually_marked_nfse) return 'nfse_issued';
      
      // Legacy check: session is in any NFSe (for backwards compatibility)
      const hasNFSe = nfseIssued.some(nfse => 
        nfse.session_ids && nfse.session_ids.includes(session.id)
      );
      
      if (hasNFSe) return 'nfse_issued';
      return 'to_pay';
    })();

    // 🔍 LOG CRÍTICO: Mostrar QUAL NFSe contém esta sessão
    const containingNfse = nfseIssued.find(nfse => 
      nfse.session_ids && nfse.session_ids.includes(session.id)
    );

    console.log('🏷️ [BADGE] Status calculado:', {
      sessionId: session.id,
      date: session.date,
      paid: session.paid,
      nfse_issued_id: session.nfse_issued_id,
      manually_marked_nfse: session.manually_marked_nfse,
      isInIssuedNfse: nfseIssued.some(nfse => nfse.session_ids?.includes(session.id)),
      containingNfseId: containingNfse?.id || null,
      containingNfseStatus: containingNfse?.status || null,
      finalStatus: status
    });

    return status;
  };

  const filterSessions = () => {
    if (!allSessions.length) return;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let filtered = allSessions;

    if (period !== 'all') {
      let start: Date, end: Date;

      if (period === 'custom') {
        if (!customStartDate || !customEndDate) return;
        start = new Date(customStartDate);
        end = new Date(customEndDate);
      } else if (period === 'lastMonth') {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
      } else if (period === 'last2Months') {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      } else {
        start = startOfMonth(now);
        end = endOfMonth(now);
      }

      filtered = allSessions.filter(session => {
        const date = parseISO(session.date);
        return date >= start && date <= end;
      });
    }

    if (showUnpaid) {
      filtered = filtered.filter(session => session.status === 'attended' && !session.paid);
    }

    if (showScheduled) {
      const scheduled = allSessions.filter(session => {
        const sessionDate = parseISO(session.date);
        return sessionDate > now && session.status === 'scheduled';
      });
      
      const sessionIds = new Set(filtered.map(s => s.id));
      const additionalScheduled = scheduled.filter(s => !sessionIds.has(s.id));
      filtered = [...filtered, ...additionalScheduled];
    }

    filtered.sort((a, b) => {
      const dateA = parseISO(a.date);
      const dateB = parseISO(b.date);
      return dateB.getTime() - dateA.getTime();
    });

    setSessions(filtered);
  };

  const openNewSessionDialog = () => {
    setEditingSession(null);
    setFormData({
      date: getBrazilDate(),
      status: 'scheduled',
      notes: '',
      value: patient?.session_value?.toString() || '',
      paid: false,
      time: patient?.session_time || '',
      showInSchedule: true,
      nfseIssued: false,
      manuallyMarkedNfse: false,
      nfseIssuedId: null
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = async (session: any) => {
    console.log('📝 [EDIT DIALOG INICIO] Abrindo dialog para sessão:', {
      id: session.id,
      date: session.date,
      paid: session.paid,
      nfse_issued_id: session.nfse_issued_id,
      manually_marked_nfse: session.manually_marked_nfse,
      status: session.status
    });
    
    setEditingSession(session);
    
    // Check if session has payment proof
    const { data: proofFiles } = await supabase
      .from('patient_files')
      .select('id')
      .eq('patient_id', id)
      .eq('category', 'payment_proof')
      .eq('file_name', `comprovante_${session.id}.pdf`)
      .maybeSingle();
    
    setHasPaymentProof(!!proofFiles);
    
    // Determine NFSe state
    const nfseIssued = !!(session.nfse_issued_id || session.manually_marked_nfse);
    
    const formDataToSet = {
      date: session.date,
      status: session.status,
      notes: session.notes || '',
      value: session.value.toString(),
      paid: session.paid,
      time: session.time || patient?.session_time || '',
      showInSchedule: session.show_in_schedule ?? true,
      nfseIssued,
      manuallyMarkedNfse: session.manually_marked_nfse || false,
      nfseIssuedId: session.nfse_issued_id || null
    };
    
    console.log('📝 [EDIT DIALOG] FormData configurado:', formDataToSet);
    
    setFormData(formDataToSet);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔵 [SUBMIT INICIO] FormData atual:', {
      editingSessionId: editingSession?.id,
      date: formData.date,
      paid: formData.paid,
      nfseIssued: formData.nfseIssued,
      manuallyMarkedNfse: formData.manuallyMarkedNfse,
      nfseIssuedId: formData.nfseIssuedId,
      status: formData.status
    });
    
    const sessionData: any = {
      patient_id: id,
      date: formData.date,
      status: formData.status,
      notes: formData.notes,
      value: parseFloat(formData.value),
      paid: formData.paid,
      time: formData.time || null,
      show_in_schedule: formData.showInSchedule,
      manually_marked_nfse: formData.manuallyMarkedNfse
    };

    // Handle nfse_issued_id: set to null if manually unmarked
    if (!formData.nfseIssued) {
      sessionData.nfse_issued_id = null;
      console.log('⚠️ [SUBMIT] NFSe desmarcada - setando nfse_issued_id = null');
      
      // 🆕 NOVO: Remover session_id do array session_ids da NFSe
      const containingNfse = nfseIssued.find(nfse => 
        nfse.session_ids?.includes(editingSession!.id)
      );
      
      if (containingNfse) {
        console.log('🔧 [NFSE UPDATE] Removendo session_id da NFSe:', {
          nfseId: containingNfse.id,
          sessionId: editingSession!.id,
          currentSessionIds: containingNfse.session_ids
        });
        
        const updatedSessionIds = containingNfse.session_ids.filter(
          id => id !== editingSession!.id
        );
        
        const { error: nfseUpdateError } = await supabase
          .from('nfse_issued')
          .update({ session_ids: updatedSessionIds })
          .eq('id', containingNfse.id);
        
        if (nfseUpdateError) {
          console.error('❌ [NFSE UPDATE ERROR]', nfseUpdateError);
          toast({
            title: "Erro ao atualizar NFSe",
            description: "Não foi possível remover a sessão da NFSe.",
            variant: "destructive"
          });
          return;
        }
        
        console.log('✅ [NFSE REMOVED] Session_id removido com sucesso do array');
      } else {
        console.log('⚠️ [NFSE NOT FOUND] Sessão não estava em nenhuma NFSe');
      }
    }

    console.log('🔵 [SUBMIT DADOS] Dados que serão salvos no banco:', sessionData);

    if (editingSession) {
      const dateChanged = editingSession.date !== formData.date;
      const timeChanged = editingSession.time !== formData.time;

      const today = getBrazilDate();
      if (formData.date > today) {
        sessionData.status = 'scheduled';
      }

      const { error } = await supabase
        .from('sessions')
        .update(sessionData)
        .eq('id', editingSession.id);

      if (error) {
        console.error('❌ [SUBMIT ERRO] Erro ao atualizar:', error);
        toast({ title: 'Erro ao atualizar sessão', variant: 'destructive' });
        return;
      }

      console.log('🟢 [SUBMIT SUCESSO] Update executado com sucesso');

      if (dateChanged || timeChanged) {
        const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        
        const oldDate = new Date(editingSession.date);
        const newDate = new Date(formData.date);
        
        const oldDay = dayNames[oldDate.getDay()];
        const newDay = dayNames[newDate.getDay()];
        
        await supabase
          .from('session_history')
          .insert({
            patient_id: id,
            old_day: oldDay,
            old_time: editingSession.time || '-',
            new_day: newDay,
            new_time: formData.time || '-'
          });
      }

      toast({ title: 'Sessão atualizada!' });
    } else {
      const { error } = await supabase
        .from('sessions')
        .insert([sessionData]);

      if (error) {
        toast({ title: 'Erro ao criar sessão', variant: 'destructive' });
        return;
      }
      toast({ title: 'Sessão criada!' });
    }

    console.log('🔵 [SUBMIT] Fechando dialog e recarregando dados...');
    setIsDialogOpen(false);
    console.log('🔵 [SUBMIT] Chamando loadData()...');
    await loadData();
    console.log('🟢 [SUBMIT FIM] loadData() concluído');
  };

  const toggleStatus = async (session: any, checked: boolean) => {
    const { isBefore } = await import('date-fns');
    
    if (session.status === 'scheduled') {
      const newStatus = checked ? 'scheduled' : 'unscheduled';
      
      const { error } = await supabase
        .from('sessions')
        .update({ 
          status: newStatus,
          show_in_schedule: checked
        })
        .eq('id', session.id);

      if (error) {
        console.error('Error updating session status:', error);
        toast({ 
          title: 'Erro ao atualizar status', 
          description: error.message,
          variant: 'destructive' 
        });
        return;
      }
      
      toast({ title: checked ? 'Sessão reagendada' : 'Sessão desmarcada' });
      await loadData();
      return;
    }

    if (session.status === 'unscheduled') {
      if (checked) {
        const { error } = await supabase
          .from('sessions')
          .update({ 
            status: 'scheduled',
            show_in_schedule: true
          })
          .eq('id', session.id);

        if (error) {
          console.error('Error updating session status:', error);
          toast({ 
            title: 'Erro ao atualizar status', 
            description: error.message,
            variant: 'destructive' 
          });
          return;
        }
        
        toast({ title: 'Sessão reagendada' });
        await loadData();
      }
      return;
    }

    if (checked && isBefore(new Date(), parseISO(session.date))) {
      toast({ 
        title: 'Não é possível marcar como compareceu', 
        description: 'Sessões futuras não podem ser marcadas como comparecidas.',
        variant: 'destructive' 
      });
      return;
    }

    const newStatus = checked ? 'attended' : 'missed';
    
    const { error } = await supabase
      .from('sessions')
      .update({ status: newStatus })
      .eq('id', session.id);

    if (error) {
      console.error('Error updating session status:', error);
      toast({ 
        title: 'Erro ao atualizar status', 
        description: error.message,
        variant: 'destructive' 
      });
      return;
    }
    
    if (newStatus === 'attended' || newStatus === 'missed') {
      const { ensureFutureSessions } = await import('@/lib/sessionUtils');
      await ensureFutureSessions(session.patient_id, patient!, supabase, 4);
    }
    
    toast({ title: `Status alterado para ${newStatus === 'attended' ? 'Compareceu' : 'Não Compareceu'}` });
    await loadData();
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta sessão?')) return;
    
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      toast({ title: 'Erro ao excluir sessão', variant: 'destructive' });
      return;
    }

    toast({ title: 'Sessão excluída com sucesso!' });
    setIsDialogOpen(false);
    loadData();
  };

  const generateInvoice = () => {
    const unpaidSessions = allSessions.filter(s => s.status === 'attended' && getSessionPaymentStatus(s) === 'to_pay');
    
    if (unpaidSessions.length === 0) {
      toast({ 
        title: 'Nenhuma sessão em aberto', 
        description: 'Não há sessões para fechamento.',
        variant: 'destructive' 
      });
      return;
    }

    setInvoiceSessions(unpaidSessions);
    
    let invoice = '';
    let totalValue = 0;

    if (patient.monthly_price) {
      const sessionsByMonth = unpaidSessions.reduce((acc, session) => {
        const monthYear = format(parseISO(session.date), 'MM/yyyy');
        if (!acc[monthYear]) {
          acc[monthYear] = [];
        }
        acc[monthYear].push(session);
        return acc;
      }, {} as Record<string, any[]>);

      const months = Object.keys(sessionsByMonth).sort();
      totalValue = months.length * Number(patient.session_value);
      
      const monthsDescription = months.map(monthYear => {
        const [month, year] = monthYear.split('/');
        const sessionCount = sessionsByMonth[monthYear].length;
        return `${month}/${year} (${sessionCount} sessão${sessionCount > 1 ? 'ões' : ''})`;
      }).join(', ');

      invoice = `RECIBO DE PRESTAÇÃO DE SERVIÇOS

Profissional: ${userProfile?.full_name || ''}
CPF: ${userProfile?.cpf || ''}
CRP: ${userProfile?.crp || ''}

Recebi de: ${patient.name}
CPF: ${patient.cpf || 'Não informado'}

Referente a: Serviços de Psicologia
Modalidade: Preço Mensal
Meses: ${monthsDescription}
Quantidade de meses: ${months.length}

Valor mensal: ${formatBrazilianCurrency(patient.session_value)}
Valor total: ${formatBrazilianCurrency(totalValue)}

Data de emissão: ${format(new Date(), 'dd/MM/yyyy')}

_____________________________
Assinatura do Profissional`;
    } else {
      totalValue = unpaidSessions.reduce((sum, s) => sum + Number(s.value), 0);
      const sessionDates = unpaidSessions.map(s => format(parseISO(s.date), 'dd/MM/yyyy')).join(', ');
      
      invoice = `RECIBO DE PRESTAÇÃO DE SERVIÇOS

Profissional: ${userProfile?.full_name || ''}
CPF: ${userProfile?.cpf || ''}
CRP: ${userProfile?.crp || ''}

Recebi de: ${patient.name}
CPF: ${patient.cpf || 'Não informado'}

Referente a: Serviços de Psicologia
Sessões realizadas nas datas: ${sessionDates}
Quantidade de sessões: ${unpaidSessions.length}

Valor unitário por sessão: ${formatBrazilianCurrency(patient.session_value)}
Valor total: ${formatBrazilianCurrency(totalValue)}

Data de emissão: ${format(new Date(), 'dd/MM/yyyy')}

_____________________________
Assinatura do Profissional`;
    }

    setInvoiceText(invoice);
    setIsInvoiceDialogOpen(true);
  };

  const markSessionsAsPaid = async () => {
    const sessionIds = invoiceSessions.map(s => s.id);
    
    const { error } = await supabase
      .from('sessions')
      .update({ paid: true })
      .in('id', sessionIds);

    if (error) {
      toast({ title: 'Erro ao atualizar sessões', variant: 'destructive' });
      return;
    }

    toast({ 
      title: 'Sessões atualizadas!', 
      description: `${sessionIds.length} sessão(ões) marcada(s) como paga(s).` 
    });
    
    setIsInvoiceDialogOpen(false);
    loadData();
  };

  const handleExportPatientData = async () => {
    try {
      await logAdminAccess('export_patient_data', undefined, id, 'Admin exported patient data (LGPD compliance)');

      const { data, error } = await supabase.functions.invoke('export-patient-data', {
        body: { patientId: id }
      });

      if (error) throw error;

      if (data.success) {
        const dataStr = JSON.stringify(data.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `paciente_${patient.name.replace(/\s/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.json`;
        link.click();

        toast({
          title: 'Dados exportados',
          description: 'Os dados do paciente foram exportados com sucesso.',
        });
      }
    } catch (error: any) {
      console.error('Error exporting data:', error);
      toast({
        title: 'Erro ao exportar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeletePatient = async () => {
    const confirmation = prompt(
      `Esta ação é IRREVERSÍVEL e apagará TODOS os dados do paciente.\n\nDigite "${patient.name}" para confirmar:`
    );

    if (confirmation !== patient.name) {
      if (confirmation !== null) {
        toast({
          title: 'Exclusão cancelada',
          description: 'O nome digitado não confere.',
          variant: 'destructive',
        });
      }
      return;
    }

    try {
      await logAdminAccess('delete_patient', undefined, id, `Admin permanently deleted patient: ${patient.name}`);

      const { data: conversations } = await supabase
        .from('whatsapp_conversations')
        .select('id')
        .eq('patient_id', id);

      if (conversations && conversations.length > 0) {
        const conversationIds = conversations.map(c => c.id);
        await supabase
          .from('whatsapp_messages')
          .delete()
          .in('conversation_id', conversationIds);
      }

      await supabase.from('sessions').delete().eq('patient_id', id);
      await supabase.from('session_history').delete().eq('patient_id', id);
      await supabase.from('patient_files').delete().eq('patient_id', id);
      await supabase.from('nfse_issued').delete().eq('patient_id', id);
      await supabase.from('consent_submissions').delete().eq('patient_id', id);
      await supabase.from('whatsapp_conversations').delete().eq('patient_id', id);

      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Paciente excluído',
        description: 'Todos os dados foram permanentemente removidos.',
      });

      navigate('/patients');
    } catch (error: any) {
      console.error('Error deleting patient:', error);
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSaveComplaint = async () => {
    if (!complaintText.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite uma queixa clínica',
        variant: 'destructive',
      });
      return;
    }

    try {
      const nextReviewDate = new Date();
      nextReviewDate.setMonth(nextReviewDate.getMonth() + 3);

      if (complaint) {
        // Update existing
        const { error } = await supabase
          .from('patient_complaints')
          .update({
            complaint_text: complaintText,
            next_review_date: nextReviewDate.toISOString().split('T')[0],
            dismissed_at: null,
          })
          .eq('id', complaint.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('patient_complaints')
          .insert({
            patient_id: id,
            complaint_text: complaintText,
            next_review_date: nextReviewDate.toISOString().split('T')[0],
          });

        if (error) throw error;
      }

      toast({ title: 'Queixa clínica salva!' });
      setIsComplaintDialogOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Error saving complaint:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDismissComplaint = async () => {
    if (!complaint) return;

    try {
      const nextReviewDate = new Date();
      nextReviewDate.setMonth(nextReviewDate.getMonth() + 3);

      const { error } = await supabase
        .from('patient_complaints')
        .update({
          dismissed_at: new Date().toISOString(),
          next_review_date: nextReviewDate.toISOString().split('T')[0],
        })
        .eq('id', complaint.id);

      if (error) throw error;

      toast({ title: 'Revisão adiada por 3 meses' });
      loadData();
    } catch (error: any) {
      console.error('Error dismissing complaint:', error);
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSaveNote = async () => {
    if (!noteText.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite o conteúdo da nota',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (noteType === 'session' && selectedSessionForNote) {
        // Save as individual file for specific session
        const fileName = `nota_clinica_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.txt`;
        const fileBlob = new Blob([noteText], { type: 'text/plain' });
        const filePath = `${user?.id}/${id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('patient_files')
          .upload(filePath, fileBlob);

        if (uploadError) throw uploadError;

        // Link to patient_files
        const { error: dbError } = await supabase
          .from('patient_files')
          .insert({
            patient_id: id,
            file_name: fileName,
            file_path: filePath,
            file_type: 'text/plain',
            category: 'clinical_notes',
            is_clinical: true,
            uploaded_by: user?.id,
          });

        if (dbError) throw dbError;

        // Also update session notes field
        const { error: sessionError } = await supabase
          .from('sessions')
          .update({ notes: noteText })
          .eq('id', selectedSessionForNote);

        if (sessionError) throw sessionError;

        toast({ title: 'Nota clínica salva e anexada à sessão!' });
      } else {
        // Save/append to general patient notes file
        const fileName = 'notas_gerais_paciente.txt';
        const filePath = `${user?.id}/${id}/${fileName}`;

        // Try to get existing file
        const { data: existingFiles } = await supabase.storage
          .from('patient_files')
          .list(`${user?.id}/${id}`, {
            search: 'notas_gerais_paciente.txt'
          });

        let newContent = noteText;

        if (existingFiles && existingFiles.length > 0) {
          // Download existing content
          const { data: existingData } = await supabase.storage
            .from('patient_files')
            .download(filePath);

          if (existingData) {
            const existingText = await existingData.text();
            newContent = `${existingText}\n\n--- ${format(new Date(), 'dd/MM/yyyy HH:mm')} ---\n${noteText}`;
          }

          // Delete old file
          await supabase.storage
            .from('patient_files')
            .remove([filePath]);
        } else {
          newContent = `--- ${format(new Date(), 'dd/MM/yyyy HH:mm')} ---\n${noteText}`;
        }

        // Upload new/updated file
        const fileBlob = new Blob([newContent], { type: 'text/plain' });
        const { error: uploadError } = await supabase.storage
          .from('patient_files')
          .upload(filePath, fileBlob);

        if (uploadError) throw uploadError;

        // Check if record exists in patient_files
        const { data: existingRecord } = await supabase
          .from('patient_files')
          .select('id')
          .eq('patient_id', id)
          .eq('file_name', fileName)
          .maybeSingle();

        if (!existingRecord) {
          // Create new record
          const { error: dbError } = await supabase
            .from('patient_files')
            .insert({
              patient_id: id,
              file_name: fileName,
              file_path: filePath,
              file_type: 'text/plain',
              category: 'clinical_notes',
              is_clinical: true,
              uploaded_by: user?.id,
            });

          if (dbError) throw dbError;
        }

        toast({ title: 'Nota geral adicionada ao arquivo do paciente!' });
      }

      setIsNoteDialogOpen(false);
      setNoteText('');
      setSelectedSessionForNote(null);
      loadData();
    } catch (error: any) {
      console.error('Error saving note:', error);
      toast({
        title: 'Erro ao salvar nota',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEnterEditMode = () => {
    setTempSizes({});
    setTempSectionHeights({});
    setIsEditMode(true);
  };

  const handleExitEditMode = () => {
    setIsExitEditDialogOpen(true);
  };

  const handleTempSizeChange = (id: string, size: { width: number; height: number; x: number; y: number }) => {
    setTempSizes(prev => ({ ...prev, [id]: size }));
  };

  const handleTempSectionHeightChange = (id: string, height: number) => {
    setTempSectionHeights(prev => ({ ...prev, [id]: height }));
  };

  const handleSaveChanges = () => {
    // Save all temp sizes to localStorage
    Object.entries(tempSizes).forEach(([id, size]) => {
      localStorage.setItem(`card-size-${id}`, JSON.stringify(size));
    });
    
    // Save all section heights to localStorage
    Object.entries(tempSectionHeights).forEach(([id, height]) => {
      localStorage.setItem(`section-height-${id}`, height.toString());
    });
    
    // Save visible cards
    localStorage.setItem('visible-cards', JSON.stringify(visibleCards));
    
    setIsExitEditDialogOpen(false);
    setIsEditMode(false);
    setTempSizes({});
    setTempSectionHeights({});
    toast({ title: 'Layout salvo com sucesso!' });
    
    // Force reload to apply saved sizes
    setTimeout(() => window.location.reload(), 300);
  };

  const handleCancelChanges = () => {
    // Discard all temp sizes and card changes
    setTempSizes({});
    setTempSectionHeights({});
    setIsExitEditDialogOpen(false);
    setIsEditMode(false);
    
    // Reload visible cards from localStorage
    const savedCards = localStorage.getItem('visible-cards');
    if (savedCards) {
      setVisibleCards(JSON.parse(savedCards));
    }
    
    toast({ title: 'Alterações descartadas' });
  };

  const [showRestoreDialog, setShowRestoreDialog] = useState(false);

  const handleRestoreDefault = () => {
    resetToDefaultLayout();
    
    // Save state to return to overview tab
    sessionStorage.setItem('returnToTab', 'overview');
    
    toast({ title: 'Layout restaurado para o padrão!' });
    setTimeout(() => window.location.reload(), 500);
  };

  const handleAddCard = (cardConfig: CardConfig) => {
    if (!visibleCards.includes(cardConfig.id)) {
      setVisibleCards([...visibleCards, cardConfig.id]);
      toast({ 
        title: 'Card adicionado!', 
        description: `${cardConfig.name} foi adicionado ao layout.` 
      });
    }
  };

  const handleRemoveCard = (cardId: string) => {
    setVisibleCards(visibleCards.filter(id => id !== cardId));
    
    // Also remove from tempSizes
    const newTempSizes = { ...tempSizes };
    delete newTempSizes[cardId];
    setTempSizes(newTempSizes);
    
    toast({ title: 'Card removido do layout' });
  };

  const isCardVisible = (cardId: string) => visibleCards.includes(cardId);

  // Helper to render functional cards with remove button in edit mode
  const renderFunctionalCard = (cardId: string, content: React.ReactNode, config?: { width?: number; height?: number; className?: string; colSpan?: string }) => {
    if (!isCardVisible(cardId)) return null;

    return (
      <ResizableCard
        key={cardId}
        id={cardId}
        isEditMode={isEditMode}
        defaultWidth={config?.width || 350}
        defaultHeight={config?.height || 220}
        tempSize={tempSizes[cardId]}
        onTempSizeChange={handleTempSizeChange}
        allCardSizes={tempSizes}
        className={cn("p-6 relative", config?.className)}
      >
        {isEditMode && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 z-50"
            onClick={() => handleRemoveCard(cardId)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {content}
      </ResizableCard>
    );
  };

  if (!patient) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Paciente não encontrado</p>
      </div>
    );
  }

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  
  // Stats do mês atual
  const monthSessions = allSessions.filter(s => {
    const sessionDate = parseISO(s.date);
    return sessionDate >= monthStart && sessionDate <= monthEnd;
  });
  const totalMonthSessions = monthSessions.length;
  const attendedMonthSessions = monthSessions.filter(s => s.status === 'attended').length;
  const scheduledMonthSessions = monthSessions.filter(s => s.status === 'scheduled' && isFuture(parseISO(s.date))).length;
  const unpaidMonthSessions = monthSessions.filter(s => s.status === 'attended' && getSessionPaymentStatus(s) === 'to_pay').length;
  const nfseIssuedSessions = allSessions.filter(s => s.status === 'nfse_issued').length;
  
  // Additional stats for new cards
  const totalAllSessions = allSessions.length;
  const revenueMonth = monthSessions.reduce((sum, s) => sum + Number(s.value || 0), 0);
  const paidMonth = monthSessions.filter(s => s.paid).reduce((sum, s) => sum + Number(s.value || 0), 0);
  const missedMonthSessions = monthSessions.filter(s => s.status === 'missed').length;
  const attendanceRate = totalMonthSessions > 0 
    ? Math.round((attendedMonthSessions / totalMonthSessions) * 100) 
    : 0;
  const unscheduledMonthSessions = monthSessions.filter(s => s.status === 'unscheduled').length;
  
  const futureSessions = allSessions.filter(s => isFuture(parseISO(s.date)) && s.status === 'scheduled');
  const nextSession = futureSessions.length > 0 ? futureSessions[futureSessions.length - 1] : null;
  const recentSessions = allSessions.filter(s => s.notes).slice(0, 5);
  
  // Check if complaint needs review
  const needsComplaintReview = complaint && !complaint.dismissed_at && 
    new Date(complaint.next_review_date) <= now;

  // Render helper for stat cards
  const renderStatCard = (cardId: string) => {
    if (!isCardVisible(cardId)) return null;

    const statConfigs: Record<string, { label: string; value: number | string; sublabel: string; color?: string }> = {
      'patient-stat-total': { label: 'Total no Mês', value: totalMonthSessions, sublabel: 'sessões', color: 'text-foreground' },
      'patient-stat-attended': { label: 'Comparecidas', value: attendedMonthSessions, sublabel: 'no mês', color: 'text-accent' },
      'patient-stat-scheduled': { label: 'Agendadas', value: scheduledMonthSessions, sublabel: 'no mês', color: 'text-blue-500' },
      'patient-stat-unpaid': { label: 'A Pagar', value: unpaidMonthSessions, sublabel: 'no mês', color: 'text-orange-500' },
      'patient-stat-nfse': { label: 'A Receber', value: nfseIssuedSessions, sublabel: 'NFSe emitida', color: 'text-emerald-500' },
      'patient-stat-total-all': { label: 'Total Geral', value: totalAllSessions, sublabel: 'todas sessões', color: 'text-primary' },
      'patient-stat-revenue-month': { label: 'Faturado', value: formatBrazilianCurrency(revenueMonth), sublabel: 'no mês', color: 'text-green-600' },
      'patient-stat-paid-month': { label: 'Recebido', value: formatBrazilianCurrency(paidMonth), sublabel: 'no mês', color: 'text-green-500' },
      'patient-stat-missed-month': { label: 'Faltas', value: missedMonthSessions, sublabel: 'no mês', color: 'text-red-500' },
      'patient-stat-attendance-rate': { label: 'Taxa', value: `${attendanceRate}%`, sublabel: 'comparecimento', color: 'text-blue-600' },
      'patient-stat-unscheduled-month': { label: 'Desmarcadas', value: unscheduledMonthSessions, sublabel: 'no mês', color: 'text-gray-500' },
    };

    const config = statConfigs[cardId];
    if (!config) return null;

    return (
      <ResizableCard 
        key={cardId}
        id={cardId}
        isEditMode={isEditMode}
        defaultWidth={200}
        defaultHeight={120}
        tempSize={tempSizes[cardId]}
        onTempSizeChange={handleTempSizeChange}
        allCardSizes={tempSizes}
        className="p-4 relative"
      >
        {isEditMode && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 z-50"
            onClick={() => handleRemoveCard(cardId)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <div className="flex flex-col">
          <p className="text-sm text-muted-foreground mb-1">{config.label}</p>
          <p className={cn("text-3xl font-bold", config.color)}>{config.value}</p>
          <p className="text-xs text-muted-foreground mt-1">{config.sublabel}</p>
        </div>
      </ResizableCard>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/patients')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold text-lg">
                    {patient.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-foreground">{patient.name}</h1>
                    {patient.status === 'inactive' && (
                      <Badge variant="destructive" className="text-xs">Ficha Encerrada</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{patient.email || 'Email não informado'}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isEditMode && (
                <Button
                  onClick={() => setShowRestoreDialog(true)}
                  variant="outline"
                  size="sm"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restaurar Padrão
                </Button>
              )}
              <Button
                onClick={isEditMode ? handleExitEditMode : handleEnterEditMode}
                variant={isEditMode ? "default" : "outline"}
                size="sm"
              >
                <Settings className="w-4 h-4 mr-2" />
                {isEditMode ? 'Salvar Layout' : 'Editar Layout'}
              </Button>
              <Button
                onClick={() => navigate(`/patients/${id}/complaint/new`)}
                variant="outline"
              >
                <FileText className="w-4 h-4 mr-2" />
                Nova Queixa
              </Button>
              <Button
                onClick={() => navigate(`/patients/${id}/edit`)}
                variant="outline"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        <div className="mb-6">
          <ConsentReminder patientId={id} />
        </div>

        {/* Monthly Stats at Top - Always Visible */}
        <div className="mb-4">
          {isEditMode && (
            <div className="flex justify-end mb-4">
              <Button
                onClick={() => setIsAddCardDialogOpen(true)}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Adicionar Card
              </Button>
            </div>
          )}
          <ResizableSection
            id="patient-stats-section"
            isEditMode={isEditMode}
            defaultHeight={200}
            tempHeight={tempSectionHeights['patient-stats-section']}
            onTempHeightChange={handleTempSectionHeightChange}
          >
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {['patient-stat-total', 'patient-stat-attended', 'patient-stat-scheduled', 'patient-stat-unpaid', 'patient-stat-nfse',
                'patient-stat-total-all', 'patient-stat-revenue-month', 'patient-stat-paid-month', 'patient-stat-missed-month',
                'patient-stat-attendance-rate', 'patient-stat-unscheduled-month'].map(cardId => renderStatCard(cardId))}
            </div>
          </ResizableSection>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Tabs Menu and New Note Button aligned */}
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="evolution">Evolução Clínica</TabsTrigger>
              <TabsTrigger value="complaint">Queixa Clínica</TabsTrigger>
              <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
              {/* Aba Faturamento: apenas se usuário tem acesso financeiro */}
              {!loadingPermissions && autonomyPermissions?.hasFinancialAccess && (
                <TabsTrigger value="billing">Faturamento</TabsTrigger>
              )}
              <TabsTrigger value="files">Arquivos</TabsTrigger>
            </TabsList>
            <Button 
              onClick={() => setIsNoteDialogOpen(true)} 
              variant="outline" 
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <StickyNote className="w-4 h-4" />
              Nova Nota
            </Button>
          </div>

           {/* Overview Tab */}
           <TabsContent value="overview" className="space-y-6">
             {isEditMode && (
               <div className="flex justify-end mb-4">
                 <Button
                   onClick={() => setIsAddCardDialogOpen(true)}
                   size="sm"
                   variant="outline"
                   className="gap-2"
                 >
                   <Plus className="w-4 h-4" />
                   Adicionar Card
                 </Button>
               </div>
             )}

              {/* Functional Cards Section */}
              <ResizableSection
                id="patient-functional-section"
                isEditMode={isEditMode}
                defaultHeight={510}
                tempHeight={tempSectionHeights['patient-functional-section']}
                onTempHeightChange={handleTempSectionHeightChange}
              >
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {nextSession && isCardVisible('patient-next-appointment') && renderFunctionalCard(
                 'patient-next-appointment',
                 <div className="flex flex-col">
                   <p className="text-sm font-medium text-muted-foreground mb-2">Próximo Agendamento</p>
                   <div className="flex items-center gap-2 mb-1">
                     <Calendar className="w-5 h-5 text-primary" />
                     <p className="text-xl font-bold text-foreground">
                       {format(parseISO(nextSession.date), "EEE, dd 'de' MMM", { locale: ptBR })}
                     </p>
                   </div>
                   <div className="flex items-center gap-2 text-muted-foreground">
                     <Clock className="w-4 h-4" />
                     <p className="text-base">{nextSession.time || 'Horário não definido'}</p>
                   </div>
                   <Badge variant="secondary" className="bg-primary/10 text-primary mt-3 self-start">Agendada</Badge>
                 </div>,
                 { className: 'bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20' }
               )}

               {isCardVisible('patient-contact-info') && renderFunctionalCard(
                 'patient-contact-info',
                 <>
                   <h3 className="font-semibold text-lg mb-4">Informações de Contato</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                     {patient.phone && (
                       <div className="flex items-start gap-3">
                         <Phone className="w-4 h-4 text-muted-foreground mt-1" />
                         <div>
                           <p className="text-sm text-muted-foreground">Telefone</p>
                           <p className="font-medium">{patient.phone}</p>
                         </div>
                       </div>
                     )}
                     {patient.email && (
                       <div className="flex items-start gap-3">
                         <Mail className="w-4 h-4 text-muted-foreground mt-1" />
                         <div>
                           <p className="text-sm text-muted-foreground">Email</p>
                           <p className="font-medium text-sm">{patient.email}</p>
                         </div>
                       </div>
                     )}
                     {patient.address && (
                       <div className="flex items-start gap-3">
                         <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                         <div>
                           <p className="text-sm text-muted-foreground">Endereço</p>
                           <p className="font-medium text-sm">{patient.address}</p>
                         </div>
                       </div>
                     )}
                     {patient.cpf && (
                       <div className="flex items-start gap-3">
                         <User className="w-4 h-4 text-muted-foreground mt-1" />
                         <div>
                           <p className="text-sm text-muted-foreground">CPF</p>
                           <p className="font-medium">{patient.cpf}</p>
                         </div>
                       </div>
                     )}
                   </div>
                 </>
               )}

               {isCardVisible('patient-clinical-complaint') && renderFunctionalCard(
                 'patient-clinical-complaint',
                 <>
                   <div className="flex items-center justify-between mb-4">
                     <h3 className="font-semibold text-lg flex items-center gap-2">
                       <FileText className="w-5 h-5 text-primary" />
                       Queixa Clínica
                     </h3>
                     <Button 
                       onClick={() => setIsComplaintDialogOpen(true)} 
                       size="sm"
                       variant="ghost"
                     >
                       <Edit className="w-4 h-4" />
                     </Button>
                   </div>
                   {needsComplaintReview && (
                     <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-2">
                       <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                       <div className="flex-1">
                         <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                           Atualização necessária
                         </p>
                         <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                           Revisar queixa clínica
                         </p>
                       </div>
                     </div>
                   )}
                   <div className="text-sm text-muted-foreground">
                     {complaint?.complaint_text || 'Nenhuma queixa registrada'}
                   </div>
                  </>
                  )}

                   {isCardVisible('patient-clinical-info') && renderFunctionalCard(
                 'patient-clinical-info',
                 <>
                   <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                     <Tag className="w-5 h-5 text-primary" />
                     Informações Clínicas
                   </h3>
                   <div className="space-y-3">
                     <div className="flex items-center justify-between py-2 border-b">
                       <span className="text-muted-foreground">Profissional</span>
                       <span className="font-medium">{userProfile?.full_name || 'Não definido'}</span>
                     </div>
                     <div className="flex items-center justify-between py-2 border-b">
                       <span className="text-muted-foreground">Valor da Sessão</span>
                       <span className="font-medium">{formatBrazilianCurrency(patient.session_value)}</span>
                     </div>
                     <div className="flex items-center justify-between py-2 border-b">
                       <span className="text-muted-foreground">Modalidade</span>
                       <Badge variant="outline">{patient.monthly_price ? 'Mensal' : 'Por Sessão'}</Badge>
                     </div>
                     <div className="flex items-center justify-between py-2">
                       <span className="text-muted-foreground">Horário Padrão</span>
                       <span className="font-medium">{patient.session_time || 'Não definido'}</span>
                     </div>
                   </div>
                 </>,
                 { width: 700, height: 280, className: 'lg:col-span-2' }
                )}

                  {isCardVisible('patient-history') && renderFunctionalCard(
                   'patient-history',
                   <>
                     <div className="flex items-center justify-between mb-4">
                       <h3 className="font-semibold text-lg">Histórico</h3>
                     </div>
                     <div className={cn("space-y-3", !showFullHistory && "max-h-[200px] overflow-hidden relative")}>
                       {sessionHistory.length > 0 ? (
                         sessionHistory.slice(0, showFullHistory ? undefined : 3).map((history) => (
                           <div 
                             key={history.id}
                             className="p-3 rounded-lg border bg-card text-xs"
                           >
                             <p className="text-muted-foreground">
                               {format(new Date(history.changed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                             </p>
                             <p className="mt-1">
                               <span className="line-through text-muted-foreground">
                                 {history.old_day} {history.old_time}
                               </span>
                               {' → '}
                               <span className="font-medium">
                                 {history.new_day} {history.new_time}
                               </span>
                             </p>
                           </div>
                         ))
                       ) : (
                         <p className="text-sm text-muted-foreground text-center py-4">
                           Nenhuma alteração registrada
                         </p>
                       )}
                       {!showFullHistory && sessionHistory.length > 3 && (
                         <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card to-transparent" />
                       )}
                     </div>
                     {sessionHistory.length > 3 && (
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => setShowFullHistory(!showFullHistory)}
                         className="w-full mt-2 text-xs"
                       >
                         {showFullHistory ? (
                           <>
                             <ChevronUp className="w-3 h-3 mr-1" />
                             Mostrar menos
                           </>
                         ) : (
                           <>
                             <ChevronDown className="w-3 h-3 mr-1" />
                             Mostrar mais
                           </>
                         )}
                       </Button>
                     )}
                   </>,
                   { width: 350, height: 280 }
                 )}

                 {/* Recent Notes Card */}
                 {isCardVisible('recent-notes') && renderFunctionalCard(
                   'recent-notes',
                   <>
                     <h3 className="font-semibold text-lg mb-4">Últimas Notas</h3>
                     <ScrollArea className="h-[200px]">
                       <div className="space-y-3">
                         {recentSessions.length > 0 ? (
                           recentSessions.map((session) => (
                             <div key={session.id} className="p-3 rounded-lg border bg-card text-xs">
                               <p className="text-muted-foreground mb-1">
                                 {format(parseISO(session.date), 'dd/MM/yyyy')}
                               </p>
                               <p className="text-sm">{session.notes}</p>
                             </div>
                           ))
                         ) : (
                           <p className="text-sm text-muted-foreground text-center py-4">
                             Nenhuma nota registrada
                           </p>
                         )}
                       </div>
                     </ScrollArea>
                   </>,
                   { width: 350, height: 300 }
                 )}

                 {/* Quick Actions Card */}
                 {isCardVisible('quick-actions') && renderFunctionalCard(
                   'quick-actions',
                   <>
                     <h3 className="font-semibold text-lg mb-4">Ações Rápidas</h3>
                     <div className="space-y-2">
                       <Button 
                         onClick={openNewSessionDialog} 
                         className="w-full justify-start gap-2"
                         variant="outline"
                       >
                         <Plus className="w-4 h-4" />
                         Nova Sessão
                       </Button>
                       <Button 
                         onClick={() => setIsNoteDialogOpen(true)} 
                         className="w-full justify-start gap-2"
                         variant="outline"
                       >
                         <StickyNote className="w-4 h-4" />
                         Nova Nota
                       </Button>
                       <Button 
                         onClick={generateInvoice} 
                         className="w-full justify-start gap-2"
                         variant="outline"
                       >
                         <DollarSign className="w-4 h-4" />
                         Gerar Recibo
                       </Button>
                       <Button 
                         onClick={handleExportPatientData} 
                         className="w-full justify-start gap-2"
                         variant="outline"
                       >
                         <Download className="w-4 h-4" />
                         Exportar Dados
                       </Button>
                     </div>
                   </>,
                   { width: 350, height: 280 }
                 )}

                 {/* Payment Summary Card */}
                 {isCardVisible('payment-summary') && renderFunctionalCard(
                   'payment-summary',
                   <>
                     <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                       <CreditCard className="w-5 h-5 text-primary" />
                       Resumo de Pagamentos
                     </h3>
                     <div className="space-y-3">
                       <div className="flex justify-between items-center py-2 border-b">
                         <span className="text-sm text-muted-foreground">Total Faturado</span>
                         <span className="font-semibold text-green-600">
                           {formatBrazilianCurrency(revenueMonth)}
                         </span>
                       </div>
                       <div className="flex justify-between items-center py-2 border-b">
                         <span className="text-sm text-muted-foreground">Já Recebido</span>
                         <span className="font-semibold text-green-500">
                           {formatBrazilianCurrency(paidMonth)}
                         </span>
                       </div>
                       <div className="flex justify-between items-center py-2">
                         <span className="text-sm text-muted-foreground">Pendente</span>
                         <span className="font-semibold text-orange-500">
                           {formatBrazilianCurrency(revenueMonth - paidMonth)}
                         </span>
                       </div>
                       <div className="mt-4 pt-2 border-t">
                         <p className="text-xs text-muted-foreground">
                           {unpaidMonthSessions} sessão(ões) não paga(s)
                         </p>
                       </div>
                     </div>
                   </>,
                   { width: 350, height: 250 }
                 )}

                 {/* Session Frequency Card */}
                 {isCardVisible('session-frequency') && renderFunctionalCard(
                   'session-frequency',
                   <>
                     <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                       <Activity className="w-5 h-5 text-primary" />
                       Frequência de Sessões
                     </h3>
                     <div className="space-y-3">
                       <div className="flex justify-between items-center">
                         <span className="text-sm text-muted-foreground">Dia padrão</span>
                         <Badge variant="outline">{patient.session_day || 'Não definido'}</Badge>
                       </div>
                       <div className="flex justify-between items-center">
                         <span className="text-sm text-muted-foreground">Horário padrão</span>
                         <Badge variant="outline">{patient.session_time || 'Não definido'}</Badge>
                       </div>
                       <div className="mt-4 pt-3 border-t">
                         <div className="flex items-center gap-2 mb-2">
                           {attendanceRate >= 80 ? (
                             <TrendingUp className="w-4 h-4 text-green-500" />
                           ) : (
                             <TrendingDown className="w-4 h-4 text-orange-500" />
                           )}
                           <span className="text-sm font-medium">
                             {attendanceRate >= 80 ? 'Frequência excelente' : 'Atenção à frequência'}
                           </span>
                         </div>
                         <p className="text-xs text-muted-foreground">
                           Taxa de {attendanceRate}% de comparecimento
                         </p>
                       </div>
                     </div>
                     </>,
                       { width: 350, height: 250 }
                    )}
                </div>
              </ResizableSection>
           </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-4">
            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Período</Label>
                  <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Este Mês</SelectItem>
                      <SelectItem value="lastMonth">Último Mês</SelectItem>
                      <SelectItem value="last2Months">Últimos 2 Meses</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                      <SelectItem value="all">Todo Período</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {period === 'custom' ? (
                  <>
                    <div className="space-y-2">
                      <Label>Data Inicial</Label>
                      <Input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data Final</Label>
                      <Input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Filtros</Label>
                      <div className="flex items-center space-x-2 pt-2">
                        <Checkbox 
                          id="showScheduled" 
                          checked={showScheduled} 
                          onCheckedChange={(checked) => {
                            setShowScheduled(!!checked);
                            if (checked) setShowUnpaid(false);
                          }}
                        />
                        <label
                          htmlFor="showScheduled"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          Mostrar Agendadas
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="invisible">Filtros</Label>
                      <div className="flex items-center space-x-2 pt-2">
                        <Checkbox 
                          id="showUnpaid" 
                          checked={showUnpaid} 
                          onCheckedChange={(checked) => {
                            setShowUnpaid(!!checked);
                            if (checked) setShowScheduled(false);
                          }}
                        />
                        <label
                          htmlFor="showUnpaid"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          Mostrar A Pagar
                        </label>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>

            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-foreground">Histórico de Sessões</h2>
              <Button onClick={openNewSessionDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Sessão
              </Button>
            </div>

            <div className="space-y-3">
              {sessions.map(session => (
                <Card key={session.id} className="p-4 hover:bg-accent/5 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-semibold text-lg">{format(parseISO(session.date), 'dd/MM/yyyy')}</p>
                        <Badge 
                          variant={
                            session.status === 'attended' ? 'default' :
                            session.status === 'missed' ? 'destructive' :
                            session.status === 'unscheduled' ? 'secondary' :
                            'outline'
                          }
                          className="text-xs"
                        >
                          {session.status === 'attended' ? 'Compareceu' : 
                           session.status === 'missed' ? 'Não Compareceu' :
                           session.status === 'unscheduled' ? 'Desmarcada' : 'Agendada'}
                        </Badge>
                        {!session.show_in_schedule && (
                          <Badge variant="outline" className="text-xs">
                            Oculta da agenda
                          </Badge>
                        )}
                      </div>
                      {session.notes && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {session.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">
                          {patient.monthly_price ? 
                            `Valor Mensal (${formatBrazilianCurrency(patient.session_value)})` : 
                            formatBrazilianCurrency(session.value)
                          }
                        </p>
                        {session.status === 'missed' ? (
                          <p className="text-xs text-muted-foreground">Sem Cobrança</p>
                        ) : (() => {
                          const paymentStatus = getSessionPaymentStatus(session);
                          if (paymentStatus === 'paid') {
                            return <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">Paga</Badge>;
                          } else if (paymentStatus === 'nfse_issued') {
                            return <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">NFSe Emitida</Badge>;
                          } else {
                            return <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-600 border-orange-500/20">A Pagar</Badge>;
                          }
                        })()}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`status-${session.id}`}
                          checked={session.status === 'attended' || session.status === 'scheduled'}
                          onCheckedChange={(checked) => toggleStatus(session, checked)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(session)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Billing Tab - Apenas se tem acesso financeiro */}
          <TabsContent value="billing" className="space-y-4">
            {loadingPermissions ? (
              <div className="flex justify-center items-center py-8">
                <p className="text-muted-foreground">Carregando permissões...</p>
              </div>
            ) : autonomyPermissions?.hasFinancialAccess ? (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Faturamento</h2>
                  {patient.no_nfse ? (
                    <Button onClick={generateInvoice} variant="outline">
                      <FileText className="w-4 h-4 mr-2" />
                      Fazer Fechamento
                    </Button>
                  ) : (
                    <IssueNFSeDialog 
                      patientId={id!} 
                      patientName={patient.name}
                    />
                  )}
                </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6">
                <p className="text-sm text-muted-foreground mb-2">Sessões em Aberto</p>
                <p className="text-3xl font-bold">{allSessions.filter(s => s.status === 'attended' && getSessionPaymentStatus(s) === 'to_pay').length}</p>
              </Card>
              <Card className="p-6">
                <p className="text-sm text-muted-foreground mb-2">Valor Total em Aberto</p>
                <p className="text-3xl font-bold">
                  {formatBrazilianCurrency(
                    patient.monthly_price ? 
                      allSessions.filter(s => s.status === 'attended' && getSessionPaymentStatus(s) === 'to_pay').reduce((acc, session) => {
                        const monthYear = format(parseISO(session.date), 'MM/yyyy');
                        return acc;
                      }, 0) * Number(patient.session_value) :
                      allSessions.filter(s => s.status === 'attended' && getSessionPaymentStatus(s) === 'to_pay').reduce((sum, s) => sum + Number(s.value || 0), 0)
                  )}
                </p>
              </Card>
              <Card className="p-6">
                <p className="text-sm text-muted-foreground mb-2">Total Faturado</p>
                <p className="text-3xl font-bold">
                  {formatBrazilianCurrency(
                    sessions.filter(s => s.paid).reduce((sum, s) => sum + Number(s.value || 0), 0)
                  )}
                </p>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Sessões Não Pagas</h3>
              <div className="space-y-2">
                {allSessions.filter(s => s.status === 'attended' && getSessionPaymentStatus(s) === 'to_pay').length > 0 ? (
                  allSessions.filter(s => s.status === 'attended' && getSessionPaymentStatus(s) === 'to_pay').map(session => (
                    <div key={session.id} className="flex justify-between items-center py-3 border-b last:border-0">
                      <div>
                        <p className="font-medium">{format(parseISO(session.date), 'dd/MM/yyyy')}</p>
                        <p className="text-sm text-muted-foreground">
                          {session.time || 'Horário não definido'}
                        </p>
                      </div>
                      <p className="font-semibold">{formatBrazilianCurrency(session.value)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Não há sessões pendentes de pagamento
                  </p>
                )}
              </div>
            </Card>
              </>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  O controle financeiro deste paciente é gerenciado pelo terapeuta Full.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Clinical Complaint Tab */}
          <TabsContent value="complaint" className="space-y-6">
            {loadingPermissions ? (
              <div className="flex justify-center items-center py-8">
                <p className="text-muted-foreground">Carregando permissões...</p>
              </div>
            ) : autonomyPermissions?.canFullSeeClinic ? (
              <ClinicalComplaintSummary patientId={id!} />
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Este subordinado gerencia seus próprios pacientes. Você não tem acesso aos dados clínicos.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Clinical Evolution Tab */}
          <TabsContent value="evolution" className="space-y-6">
            {loadingPermissions ? (
              <div className="flex justify-center items-center py-8">
                <p className="text-muted-foreground">Carregando permissões...</p>
              </div>
            ) : autonomyPermissions?.canFullSeeClinic ? (
              <ClinicalEvolution patientId={id!} />
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Este subordinado gerencia seus próprios pacientes. Você não tem acesso aos dados clínicos.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files">
            <PatientFiles patientId={id!} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Session Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingSession ? 'Editar Sessão' : 'Nova Sessão'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Horário</Label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Agendada</SelectItem>
                  <SelectItem value="attended">Compareceu</SelectItem>
                  <SelectItem value="missed">Não Compareceu</SelectItem>
                  <SelectItem value="unscheduled">Desmarcada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notas da Sessão</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Registre observações sobre a sessão..."
                rows={6}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  required
                />
              </div>

              {/* NFSe Emitida Switch */}
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="nfseIssued"
                    checked={formData.nfseIssued}
                    disabled={formData.paid}
                    onCheckedChange={async (checked) => {
                      if (!checked && formData.nfseIssuedId) {
                        // Trying to unmark NFSe that has real nfse_issued_id
                        const { data: nfseData } = await supabase
                          .from('nfse_issued')
                          .select('nfse_number, issue_date, status')
                          .eq('id', formData.nfseIssuedId)
                          .single();
                        
                        setNfseDetails(nfseData);
                        setPendingNfseChange(checked);
                        setShowNfseUnmarkAlert(true);
                      } else {
                        // Either marking as issued or unmarking manual mark
                        setFormData({ 
                          ...formData, 
                          nfseIssued: checked,
                          manuallyMarkedNfse: checked && !formData.nfseIssuedId
                        });
                      }
                    }}
                  />
                  <Label htmlFor="nfseIssued" className="cursor-pointer">
                    NFSe Emitida
                  </Label>
                </div>
                {formData.paid && (
                  <span className="text-xs text-muted-foreground">
                    (Desabilitado - sessão já paga)
                  </span>
                )}
                {formData.nfseIssuedId && (
                  <Badge variant="outline" className="text-xs">
                    Com NFSe Real
                  </Badge>
                )}
              </div>

              {/* Paga Switch */}
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="paid"
                    checked={formData.paid}
                    onCheckedChange={async (checked) => {
                      if (!checked && hasPaymentProof) {
                        // Trying to unmark as paid when there's a payment proof
                        setPendingPaidChange(checked);
                        setShowPaidUnmarkAlert(true);
                      } else {
                        setFormData({ ...formData, paid: checked });
                      }
                    }}
                  />
                  <Label htmlFor="paid" className="cursor-pointer">
                    Sessão Paga
                  </Label>
                </div>
                {hasPaymentProof && (
                  <Badge variant="outline" className="text-xs">
                    Com Comprovante
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="showInSchedule"
                checked={formData.showInSchedule}
                onCheckedChange={(checked) => setFormData({ ...formData, showInSchedule: checked })}
              />
              <Label htmlFor="showInSchedule">Mostrar na Agenda</Label>
            </div>

            <div className="flex justify-between pt-4">
              <div>
                {editingSession && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => deleteSession(editingSession.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingSession ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invoice Dialog */}
      <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Fechamento de Sessões</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={invoiceText}
              readOnly
              rows={20}
              className="font-mono text-sm"
            />
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(invoiceText);
                  toast({ title: 'Copiado para área de transferência!' });
                }}
              >
                Copiar Texto
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsInvoiceDialogOpen(false)}>
                  Fechar
                </Button>
                <Button onClick={markSessionsAsPaid}>
                  Marcar como Pagas
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Complaint Dialog */}
      <Dialog open={isComplaintDialogOpen} onOpenChange={setIsComplaintDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Queixa Clínica</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={complaintText}
              onChange={(e) => setComplaintText(e.target.value)}
              placeholder="Descreva a razão pela qual o paciente buscou terapia..."
              rows={8}
            />
            <div className="flex justify-between">
              {needsComplaintReview && (
                <Button variant="outline" onClick={handleDismissComplaint}>
                  Ignorar (3 meses)
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={() => setIsComplaintDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveComplaint}>Salvar</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Note Dialog */}
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Nota Clínica</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Nota</Label>
              <Select value={noteType} onValueChange={(val: 'session' | 'general') => setNoteType(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Nota Geral do Paciente</SelectItem>
                  <SelectItem value="session">Nota de Sessão Específica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {noteType === 'session' && (
              <div className="space-y-2">
                <Label>Selecione a Sessão</Label>
                <Select value={selectedSessionForNote || ''} onValueChange={setSelectedSessionForNote}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha uma sessão" />
                  </SelectTrigger>
                  <SelectContent>
                    {allSessions.slice(0, 20).map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        {format(parseISO(session.date), "dd/MM/yyyy", { locale: ptBR })} - {session.time || 'Sem horário'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Conteúdo da Nota</Label>
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Digite o conteúdo da nota clínica..."
                rows={10}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveNote}>Salvar Nota</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* NFSe Unmark Confirmation Dialog */}
      <AlertDialog open={showNfseUnmarkAlert} onOpenChange={setShowNfseUnmarkAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ Atenção</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Esta sessão possui NFSe emitida:</p>
              {nfseDetails && (
                <div className="bg-muted p-3 rounded-md space-y-1 text-sm">
                  <div><strong>Número:</strong> {nfseDetails.nfse_number || 'Processando...'}</div>
                  <div><strong>Emitida em:</strong> {nfseDetails.issue_date ? format(parseISO(nfseDetails.issue_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '-'}</div>
                  <div><strong>Status:</strong> {nfseDetails.status}</div>
                </div>
              )}
              <p className="pt-2">
                Ao desmarcar, você estará <strong>despareando esta sessão da NFSe</strong>. 
                A NFSe permanecerá no sistema.
              </p>
              <p className="text-destructive font-medium">
                Deseja continuar?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowNfseUnmarkAlert(false);
              setPendingNfseChange(null);
              setNfseDetails(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setFormData({ 
                ...formData, 
                nfseIssued: false,
                manuallyMarkedNfse: false,
                nfseIssuedId: null
              });
              setShowNfseUnmarkAlert(false);
              setPendingNfseChange(null);
              setNfseDetails(null);
            }}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Paid Unmark Confirmation Dialog */}
      <AlertDialog open={showPaidUnmarkAlert} onOpenChange={setShowPaidUnmarkAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ Atenção</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Esta sessão possui <strong>comprovante de pagamento anexado</strong>.
              </p>
              <p>
                Ao desmarcar como paga, o comprovante permanecerá no sistema 
                (você pode excluí-lo separadamente na aba de Arquivos se desejar).
              </p>
              <p className="text-destructive font-medium">
                Deseja continuar?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowPaidUnmarkAlert(false);
              setPendingPaidChange(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setFormData({ ...formData, paid: false });
              setShowPaidUnmarkAlert(false);
              setPendingPaidChange(null);
            }}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Exit Edit Mode Confirmation Dialog */}
      <AlertDialog open={isExitEditDialogOpen} onOpenChange={setIsExitEditDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Salvar alterações no layout?</AlertDialogTitle>
            <AlertDialogDescription>
              Você fez alterações no tamanho dos cards. Deseja salvar essas mudanças ou descartá-las?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelChanges}>
              Cancelar (descartar mudanças)
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveChanges}>
              Salvar alterações
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Default Layout Dialog */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar layout padrão?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá restaurar o layout para as configurações padrão. Todas as personalizações atuais serão perdidas. A página será recarregada e você retornará à aba Visão Geral.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreDefault}>
              Sim, restaurar padrão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Card Dialog */}
      <AddCardDialog
        open={isAddCardDialogOpen}
        onOpenChange={setIsAddCardDialogOpen}
        onAddCard={handleAddCard}
        onRemoveCard={handleRemoveCard}
        existingCardIds={visibleCards}
      />
    </div>
  );
};

export default PatientDetailNew;
