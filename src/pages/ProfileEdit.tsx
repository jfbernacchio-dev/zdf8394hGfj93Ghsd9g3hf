import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Users, Building2 } from 'lucide-react';
import { AccessManagement } from '@/components/AccessManagement';
import { LayoutTemplateManager } from '@/components/LayoutTemplateManager';
import { PermissionManagementCompact } from '@/components/PermissionManagementCompact';
import { 
  getOrganizationByUser, 
  createOrganization, 
  updateOrganization, 
  addOwner 
} from '@/lib/organizations';
import { getUserIdsInOrganization } from '@/lib/organizationFilters';
import { getUserRoleLabelForUI } from '@/lib/professionalRoles';

const WEEKDAYS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
];

const ProfileEdit = () => {
  const { user, profile, isAdmin, isAccountant } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient(); // ⭐ Para invalidar cache após updates
  
  // Dados Pessoais
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [crp, setCrp] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [sendNfseToTherapist, setSendNfseToTherapist] = useState(false);
  
  // Dados Clínicos
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [workStartTime, setWorkStartTime] = useState('08:00');
  const [workEndTime, setWorkEndTime] = useState('18:00');
  const [slotDuration, setSlotDuration] = useState(60);
  const [breakTime, setBreakTime] = useState(15);
  const [clinicalApproach, setClinicalApproach] = useState('');
  
  // Subordinação de contador
  const [showSubordinationDialog, setShowSubordinationDialog] = useState(false);
  const [availableTherapists, setAvailableTherapists] = useState<Array<{ id: string; full_name: string }>>([]);
  const [selectedTherapists, setSelectedTherapists] = useState<string[]>([]);
  const [loadingSubordination, setLoadingSubordination] = useState(false);
  
  // Para Terapeuta Full escolher seu contador
  const [availableAccountants, setAvailableAccountants] = useState<Array<{ id: string; full_name: string }>>([]);
  const [selectedAccountantId, setSelectedAccountantId] = useState<string>('');
  const [accountantRequestStatus, setAccountantRequestStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  
  // Log sempre que selectedAccountantId mudar
  useEffect(() => {
    console.log('🔄 [selectedAccountantId CHANGED] Novo valor:', selectedAccountantId);
  }, [selectedAccountantId]);
  const [isSubordinate, setIsSubordinate] = useState(false);
  
  // FASE 10.2: Estados para empresa/CNPJ
  const [useCompany, setUseCompany] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [companyCnpj, setCompanyCnpj] = useState('');
  const [companyLegalName, setCompanyLegalName] = useState('');
  const [companyNotes, setCompanyNotes] = useState('');
  const [loadingCompany, setLoadingCompany] = useState(false);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkSubordinate = async () => {
      if (profile) {
        console.log('🔍 [PROFILE LOAD] Dados carregados do banco:', {
          userId: profile.id,
          send_nfse_to_therapist: profile.send_nfse_to_therapist,
          fullProfile: profile
        });
        
        setFullName(profile.full_name || '');
        setCpf(profile.cpf || '');
        setCrp(profile.crp || '');
        setPhone(profile.phone || '');
        setBirthDate(profile.birth_date || '');
        
        const sendNfseValue = profile.send_nfse_to_therapist ?? false;
        console.log('🔄 [CHECKBOX SET] Setando checkbox para:', sendNfseValue);
        setSendNfseToTherapist(sendNfseValue);
        
        setClinicalApproach(profile.clinical_approach || '');
        
        setWorkDays(profile.work_days || [1, 2, 3, 4, 5]);
        setWorkStartTime(profile.work_start_time || '08:00');
        setWorkEndTime(profile.work_end_time || '18:00');
        setSlotDuration(profile.slot_duration || 60);
        setBreakTime(profile.break_time || 15);
        
        // Verificar se é subordinado via therapist_assignments
        const { data: assignment } = await supabase
          .from('therapist_assignments')
          .select('manager_id')
          .eq('subordinate_id', profile.id)
          .maybeSingle();
        
        setIsSubordinate(!!assignment);
      }
      if (user) {
        setEmail(user.email || '');
      }
    };

    checkSubordinate();
  }, [profile, user]);

  // FASE 10.2: Carregar dados da organização
  useEffect(() => {
    const loadOrganization = async () => {
      if (!user) return;
      
      const org = await getOrganizationByUser(user.id);
      if (org) {
        setUseCompany(true);
        setOrganizationId(org.id);
        setCompanyCnpj(org.cnpj || '');
        setCompanyLegalName(org.legal_name || '');
        setCompanyNotes(org.notes || '');
      }
    };
    
    loadOrganization();
  }, [user]);

  // Primeiro useEffect: Carrega lista de contadores disponíveis
  useEffect(() => {
    console.log('🔄 UseEffect loadAccountants - isAccountant:', isAccountant, 'isSubordinate:', isSubordinate, 'user:', !!user);
    if (!isAccountant && !isSubordinate && user) {
      console.log('✅ Chamando loadAccountants');
      loadAccountants();
      
      // Polling para detectar rejeições
      checkForRejectedRequests();
      const interval = setInterval(checkForRejectedRequests, 30000); // 30s
      
      return () => clearInterval(interval);
    }
  }, [isAccountant, isSubordinate, user, profile]);

  // Segundo useEffect: Carrega contador atual SOMENTE após lista estar disponível
  useEffect(() => {
    console.log('🔄 UseEffect loadCurrentAccountant - availableAccountants length:', availableAccountants.length, 'user:', !!user);
    if (!isAccountant && !isSubordinate && user && availableAccountants.length > 0) {
      console.log('✅ Lista de contadores carregada, chamando loadCurrentAccountant');
      loadCurrentAccountant();
    }
  }, [availableAccountants, isAccountant, isSubordinate, user]);

  const loadAccountants = async () => {
    try {
      console.log('🔍 Carregando contadores...');
      
      if (!organizationId) {
        console.log('⚠️ Organização não definida');
        setAvailableAccountants([]);
        return;
      }
      
      const orgUserIds = await getUserIdsInOrganization(organizationId);
      
      // Buscar todos os usuários com role accountant
      const { data: accountantRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'accountant');

      console.log('📋 Roles encontradas:', accountantRoles);
      if (rolesError) {
        console.error('❌ Erro ao buscar roles:', rolesError);
        throw rolesError;
      }

      const accountantIds = accountantRoles?.map(r => r.user_id) || [];
      
      // Filtrar apenas contadores da organização ativa
      const orgAccountantIds = accountantIds.filter(id => orgUserIds.includes(id));
      console.log('👥 IDs de contadores na organização:', orgAccountantIds);

      if (orgAccountantIds.length === 0) {
        console.log('⚠️ Nenhum contador encontrado na organização ativa');
        setAvailableAccountants([]);
        return;
      }

      const { data: accountants, error: accountantsError } = await supabase
        .from('profiles')
        .select('id, full_name, professional_role_id, professional_roles(*)')
        .in('id', orgAccountantIds)
        .order('full_name');

      console.log('✅ Contadores carregados:', accountants);
      if (accountantsError) {
        console.error('❌ Erro ao buscar profiles:', accountantsError);
        throw accountantsError;
      }

      setAvailableAccountants(accountants || []);
    } catch (error: any) {
      console.error('❌ Erro ao carregar contadores:', error);
    }
  };

  const loadCurrentAccountant = async () => {
    try {
      console.log('🔍 [loadCurrentAccountant] Iniciando busca...');
      console.log('🔍 [loadCurrentAccountant] user.id:', user!.id);
      console.log('🔍 [loadCurrentAccountant] selectedAccountantId ANTES:', selectedAccountantId);
      
      const { data, error } = await supabase
        .from('accountant_therapist_assignments')
        .select('accountant_id')
        .eq('therapist_id', user!.id)
        .maybeSingle();

      console.log('🔍 [loadCurrentAccountant] Query assignments retornou:', data);
      console.log('🔍 [loadCurrentAccountant] Erro na query assignments:', error);

      if (error) throw error;

      if (data) {
        console.log('✅ [loadCurrentAccountant] Assignment encontrado! accountant_id:', data.accountant_id);
        console.log('✅ [loadCurrentAccountant] Chamando setSelectedAccountantId com:', data.accountant_id);
        setSelectedAccountantId(data.accountant_id);
        
        // Buscar o status do request
        const { data: requestData } = await supabase
          .from('accountant_requests')
          .select('status')
          .eq('therapist_id', user!.id)
          .eq('accountant_id', data.accountant_id)
          .maybeSingle();
        
        console.log('🔍 [loadCurrentAccountant] Status do request:', requestData?.status);
        const status = requestData?.status as 'pending' | 'approved' | 'rejected' | undefined;
        setAccountantRequestStatus(status || null);
        console.log('✅ [loadCurrentAccountant] setSelectedAccountantId executado');
      } else {
        console.log('⚠️ [loadCurrentAccountant] Nenhum assignment encontrado, verificando pedidos pendentes...');
        // Se não tem assignment, verificar se há um pedido pendente
        const { data: pendingRequest } = await supabase
          .from('accountant_requests')
          .select('accountant_id')
          .eq('therapist_id', user!.id)
          .eq('status', 'pending')
          .maybeSingle();

        console.log('🔍 [loadCurrentAccountant] Query requests retornou:', pendingRequest);

        if (pendingRequest) {
          console.log('✅ [loadCurrentAccountant] Pedido pendente encontrado! accountant_id:', pendingRequest.accountant_id);
          setSelectedAccountantId(pendingRequest.accountant_id);
        } else {
          console.log('⚠️ [loadCurrentAccountant] Nenhum pedido pendente encontrado');
          console.log('⚠️ [loadCurrentAccountant] selectedAccountantId permanecerá:', selectedAccountantId);
        }
      }
    } catch (error: any) {
      console.error('❌ [loadCurrentAccountant] Erro:', error);
    }
  };

  const checkForRejectedRequests = async () => {
    if (!user) return;
    
    try {
      // Buscar requests rejeitados
      const { data: rejected } = await supabase
        .from('accountant_requests')
        .select('accountant_id')
        .eq('therapist_id', user.id)
        .eq('status', 'rejected')
        .order('responded_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (rejected) {
        console.log('❌ Request rejeitado detectado, limpando assignment...');
        
        // Deletar o assignment correspondente
        await supabase
          .from('accountant_therapist_assignments')
          .delete()
          .eq('therapist_id', user.id)
          .eq('accountant_id', rejected.accountant_id);

        // Deletar o request rejeitado
        await supabase
          .from('accountant_requests')
          .delete()
          .eq('therapist_id', user.id)
          .eq('status', 'rejected');

        // Limpar seleção
        setSelectedAccountantId('');
        setAccountantRequestStatus(null);

        toast({
          title: 'Pedido rejeitado',
          description: 'O contador rejeitou seu pedido de subordinação.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Erro ao verificar rejeições:', error);
    }
  };

  const handleWorkDayToggle = (day: number) => {
    setWorkDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const handleSubmitPersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Atualizar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          cpf,
          crp,
          phone,
          birth_date: birthDate,
          send_nfse_to_therapist: sendNfseToTherapist,
        })
        .eq('id', user!.id);

      if (profileError) throw profileError;

      // ⭐ Invalidar cache do React Query para forçar reload
      await queryClient.invalidateQueries({ queryKey: ['profile', user!.id] });
      
      // 🔄 FORÇAR RELOAD do profile no AuthContext
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*, professional_roles(*)') // FASE 1.4: carregar professional role
        .eq('id', user!.id)
        .single();
      
      if (updatedProfile) {
        // Disparar evento customizado para AuthContext recarregar
        window.dispatchEvent(new CustomEvent('profile-updated', { detail: updatedProfile }));
      }

      // Atualizar email se mudou
      if (email !== user?.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: email,
        });
        if (emailError) throw emailError;
      }

      // Atualizar senha se fornecida
      if (newPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (passwordError) throw passwordError;
      }

      // FASE 2: Verificar se terapeuta está tentando remover contador
      if (!isAccountant && !isSubordinate) {
        const { data: existingAssignment } = await supabase
          .from('accountant_therapist_assignments')
          .select('accountant_id')
          .eq('therapist_id', user!.id)
          .maybeSingle();

        // Se estava com contador e quer remover (selectedAccountantId vazio)
        if (existingAssignment && !selectedAccountantId) {
          // Verificar se é subordinado manager_company
          const { data: subordinates } = await supabase
            .from('subordinate_autonomy_settings')
            .select('nfse_emission_mode')
            .eq('subordinate_id', user!.id)
            .eq('nfse_emission_mode', 'manager_company')
            .maybeSingle();

          if (subordinates) {
            toast({
              title: `Não é possível remover ${getUserRoleLabelForUI(null, 'accountant').toLowerCase()}`,
              description: 'Você está em modo "NFSe da Empresa do Gestor". Primeiro altere o modo de emissão de NFSe para "Própria Empresa" nas configurações de autonomia.',
              variant: 'destructive',
            });
            setLoading(false);
            return;
          }

          // Se não é manager_company, pode remover
          await supabase
            .from('accountant_therapist_assignments')
            .delete()
            .eq('therapist_id', user!.id);
          
          setSelectedAccountantId(null);
          setAccountantRequestStatus(null);
        }

        // Se selecionou um contador (novo ou mudança)
        if (selectedAccountantId) {
          // Se mudou o contador ou não tinha contador
          if (!existingAssignment || existingAssignment.accountant_id !== selectedAccountantId) {
          // 1. CRIAR ASSIGNMENT PRIMEIRO (permanente)
          const { error: assignmentError } = await supabase
            .from('accountant_therapist_assignments')
            .insert({
              therapist_id: user!.id,
              accountant_id: selectedAccountantId,
            });
          
          if (assignmentError) throw assignmentError;

          // 2. CRIAR REQUEST PENDENTE
          const { error: requestError } = await supabase
            .from('accountant_requests')
            .insert({
              therapist_id: user!.id,
              accountant_id: selectedAccountantId,
              status: 'pending',
            });
            
          if (requestError) {
            // Se request falhar, rollback do assignment criado
            await supabase
              .from('accountant_therapist_assignments')
              .delete()
              .eq('therapist_id', user!.id)
              .eq('accountant_id', selectedAccountantId);
            throw requestError;
          }

          // Atualizar status para pending
          setAccountantRequestStatus('pending');

            toast({
              title: 'Pedido enviado',
              description: 'O contador receberá uma notificação e deverá aprovar o pedido.',
            });
          }
        }
      }

      toast({
        title: 'Dados atualizados',
        description: 'Seus dados pessoais foram salvos com sucesso.',
      });

      setNewPassword('');
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar dados',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitClinical = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          work_days: workDays,
          work_start_time: workStartTime,
          work_end_time: workEndTime,
          slot_duration: slotDuration,
          break_time: breakTime,
          clinical_approach: clinicalApproach,
        })
        .eq('id', user!.id);

      if (error) throw error;

      toast({
        title: 'Configurações atualizadas',
        description: 'Suas configurações clínicas foram salvas com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar configurações',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSubordinationData = async () => {
    if (!isAccountant || !user) return;

    setLoadingSubordination(true);
    try {
      // Buscar therapists que ainda não têm contador
      const { data: allTherapists, error: therapistsError } = await supabase
        .from('profiles')
        .select('id, full_name, professional_role_id, professional_roles(*)')
        .neq('id', user.id);

      if (therapistsError) throw therapistsError;

      // Buscar therapists que já têm contador
      const { data: assignedTherapists, error: assignedError } = await supabase
        .from('accountant_therapist_assignments')
        .select('therapist_id');

      if (assignedError) throw assignedError;

      const assignedIds = new Set(assignedTherapists?.map(a => a.therapist_id) || []);

      // Buscar subordinados atuais deste contador
      const { data: currentAssignments, error: currentError } = await supabase
        .from('accountant_therapist_assignments')
        .select('therapist_id')
        .eq('accountant_id', user.id);

      if (currentError) throw currentError;

      const currentIds = currentAssignments?.map(a => a.therapist_id) || [];
      setSelectedTherapists(currentIds);

      // Filtrar: mostrar disponíveis + os já subordinados a este contador
      const available = allTherapists?.filter(
        t => !assignedIds.has(t.id) || currentIds.includes(t.id)
      ) || [];

      setAvailableTherapists(available);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar dados',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingSubordination(false);
    }
  };

  const handleOpenSubordination = () => {
    loadSubordinationData();
    setShowSubordinationDialog(true);
  };

  const handleToggleTherapist = (therapistId: string) => {
    setSelectedTherapists(prev =>
      prev.includes(therapistId)
        ? prev.filter(id => id !== therapistId)
        : [...prev, therapistId]
    );
  };

  const handleSaveSubordination = async () => {
    if (selectedTherapists.length === 0) {
      toast({
        title: 'Validação',
        description: 'Selecione pelo menos um terapeuta para subordinar.',
        variant: 'destructive',
      });
      return;
    }

    setLoadingSubordination(true);
    try {
      // Remover todas as atribuições existentes
      const { error: deleteError } = await supabase
        .from('accountant_therapist_assignments')
        .delete()
        .eq('accountant_id', user!.id);

      if (deleteError) throw deleteError;

      // Inserir novas atribuições
      const assignments = selectedTherapists.map(therapistId => ({
        accountant_id: user!.id,
        therapist_id: therapistId,
      }));

      const { error: insertError } = await supabase
        .from('accountant_therapist_assignments')
        .insert(assignments);

      if (insertError) throw insertError;

      toast({
        title: 'Subordinação atualizada',
        description: 'Terapeutas subordinados foram atualizados com sucesso.',
      });

      setShowSubordinationDialog(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar subordinação',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingSubordination(false);
    }
  };

  // FASE 10.2: Salvar empresa/CNPJ
  const handleSaveCompany = async () => {
    if (!user) return;
    
    setLoadingCompany(true);
    try {
      if (organizationId) {
        // Atualizar organização existente
        const success = await updateOrganization(organizationId, {
          cnpj: companyCnpj,
          legal_name: companyLegalName,
          notes: companyNotes,
        });
        
        if (!success) throw new Error('Erro ao atualizar organização');
      } else {
        // Criar nova organização
        const org = await createOrganization({
          cnpj: companyCnpj,
          legal_name: companyLegalName,
          notes: companyNotes,
          created_by: user.id,
        });
        
        if (!org) throw new Error('Erro ao criar organização');
        
        // Adicionar usuário como dono
        const ownerSuccess = await addOwner(org.id, user.id, true);
        if (!ownerSuccess) throw new Error('Erro ao adicionar dono');
        
        setOrganizationId(org.id);
      }
      
      toast({
        title: 'Empresa salva',
        description: 'Os dados da empresa foram salvos com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar empresa',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingCompany(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Editar Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-4' : isAccountant ? 'grid-cols-2' : 'grid-cols-3'}`}>
              <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
              {!isAccountant && <TabsTrigger value="clinical">Clínica</TabsTrigger>}
              <TabsTrigger value="layouts">Layouts</TabsTrigger>
              {isAdmin && <TabsTrigger value="access">Configurações</TabsTrigger>}
            </TabsList>

            <TabsContent value="personal">
              <form onSubmit={handleSubmitPersonal} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full-name">Nome Completo</Label>
                    <Input
                      id="full-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                      required
                    />
                  </div>

                  {!isAccountant && (
                    <div>
                      <Label htmlFor="crp">CRP</Label>
                      <Input
                        id="crp"
                        value={crp}
                        onChange={(e) => setCrp(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="birth-date">Data de Nascimento</Label>
                    <Input
                      id="birth-date"
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="new-password">Nova Senha (deixe em branco para não alterar)</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                {!isAccountant && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="send-nfse"
                      checked={sendNfseToTherapist}
                      onCheckedChange={(checked) => {
                        console.log('🖱️ [CHECKBOX CLICK] Usuário clicou no checkbox. Novo valor:', checked);
                        setSendNfseToTherapist(checked as boolean);
                      }}
                    />
                    <Label htmlFor="send-nfse" className="cursor-pointer">
                      Enviar NFSe para terapeuta (cópia no email e telefone)
                    </Label>
                  </div>
                )}

                {!isAccountant && !isSubordinate && (
                  <div className="pt-4 border-t">
                    <Label htmlFor="accountant-select" className="mb-2 block">Contador Responsável (opcional)</Label>
                    <div className="space-y-2">
                      <Select value={selectedAccountantId} onValueChange={setSelectedAccountantId}>
                        <SelectTrigger id="accountant-select">
                          <SelectValue placeholder="Nenhum contador selecionado" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableAccountants.map((accountant) => (
                            <SelectItem key={accountant.id} value={accountant.id}>
                              {accountant.full_name}
                              {selectedAccountantId === accountant.id && ' ✓'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedAccountantId && accountantRequestStatus && (
                        <div className="flex items-center gap-2">
                          {accountantRequestStatus === 'pending' && (
                            <Badge className="bg-yellow-500">
                              ⏳ Ativação Pendente
                            </Badge>
                          )}
                          {accountantRequestStatus === 'approved' && (
                            <Badge className="bg-green-600">
                              ✓ Contador Ativo
                            </Badge>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedAccountantId('');
                              setAccountantRequestStatus(null);
                            }}
                            className="text-xs"
                          >
                            Remover contador
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      O contador precisa aprovar o pedido antes de ter acesso aos seus dados financeiros.
                    </p>
                  </div>
                )}

                {isAccountant && (
                  <div className="pt-4 border-t">
                    <Label className="mb-2 block">Gestão de Subordinação</Label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleOpenSubordination}
                      className="w-full"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Subordinar Usuário
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">
                      Gerencie quais terapeutas e admins este contador pode visualizar.
                    </p>
                  </div>
                )}

                {/* FASE 10.2: Seção de Empresa/CNPJ */}
                <div className="pt-4 border-t space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="use-company" className="text-base font-medium">
                        Usa CNPJ / Empresa
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Configure os dados da sua empresa para emissão de notas fiscais
                      </p>
                    </div>
                    <Switch
                      id="use-company"
                      checked={useCompany}
                      onCheckedChange={setUseCompany}
                    />
                  </div>

                  {useCompany && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Building2 className="w-4 h-4" />
                        Dados da Empresa
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="company-cnpj">CNPJ</Label>
                          <Input
                            id="company-cnpj"
                            value={companyCnpj}
                            onChange={(e) => setCompanyCnpj(e.target.value)}
                            placeholder="00.000.000/0000-00"
                          />
                        </div>

                        <div>
                          <Label htmlFor="company-legal-name">Razão Social</Label>
                          <Input
                            id="company-legal-name"
                            value={companyLegalName}
                            onChange={(e) => setCompanyLegalName(e.target.value)}
                            placeholder="Nome da empresa"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="company-notes">Observações</Label>
                        <Textarea
                          id="company-notes"
                          value={companyNotes}
                          onChange={(e) => setCompanyNotes(e.target.value)}
                          placeholder="Notas e observações sobre a empresa"
                          rows={3}
                        />
                      </div>

                      <Button
                        type="button"
                        onClick={handleSaveCompany}
                        disabled={loadingCompany}
                        className="w-full"
                      >
                        {loadingCompany ? 'Salvando...' : 'Salvar Empresa'}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </TabsContent>

            {!isAccountant && (
              <TabsContent value="clinical">
                <form onSubmit={handleSubmitClinical} className="space-y-6">
                  <div>
                    <Label>Abordagem Clínica</Label>
                    <Select value={clinicalApproach} onValueChange={setClinicalApproach}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a abordagem" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TCC">Terapia Cognitivo-Comportamental (TCC)</SelectItem>
                        <SelectItem value="Psicologia Analítica">Psicologia Analítica</SelectItem>
                        <SelectItem value="Psicanálise">Psicanálise</SelectItem>
                        <SelectItem value="Fenomenologia">Fenomenologia</SelectItem>
                        <SelectItem value="Behaviorismo">Behaviorismo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="mb-3 block">Dias de Trabalho</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {WEEKDAYS.map((day) => (
                        <div key={day.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`day-${day.value}`}
                            checked={workDays.includes(day.value)}
                            onCheckedChange={() => handleWorkDayToggle(day.value)}
                          />
                          <Label
                            htmlFor={`day-${day.value}`}
                            className="cursor-pointer"
                          >
                            {day.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start-time">Horário de Início</Label>
                      <Input
                        id="start-time"
                        type="time"
                        value={workStartTime}
                        onChange={(e) => setWorkStartTime(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="end-time">Horário de Término</Label>
                      <Input
                        id="end-time"
                        type="time"
                        value={workEndTime}
                        onChange={(e) => setWorkEndTime(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="slot-duration">Duração de Cada Sessão (minutos)</Label>
                      <Input
                        id="slot-duration"
                        type="number"
                        min="15"
                        step="15"
                        value={slotDuration}
                        onChange={(e) => setSlotDuration(Number(e.target.value))}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="break-time">Tempo de Descanso Entre Sessões (minutos)</Label>
                      <Input
                        id="break-time"
                        type="number"
                        min="0"
                        step="5"
                        value={breakTime}
                        onChange={(e) => setBreakTime(Number(e.target.value))}
                        required
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Tempo de intervalo entre atendimentos para recomposição.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(-1)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </TabsContent>
            )}

            <TabsContent value="layouts">
              <LayoutTemplateManager />
            </TabsContent>

            {isAdmin && (
              <TabsContent value="access">
                <Tabs defaultValue="access-management" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="access-management">Gerenciamento de Acessos</TabsTrigger>
                    <TabsTrigger value="permissions">Gerenciamento de Permissões</TabsTrigger>
                  </TabsList>

                  <TabsContent value="access-management" className="mt-4">
                    <AccessManagement />
                  </TabsContent>

                  <TabsContent value="permissions" className="mt-4">
                    <PermissionManagementCompact />
                  </TabsContent>
                </Tabs>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={showSubordinationDialog} onOpenChange={setShowSubordinationDialog}>
        <DialogContent className="max-w-2xl max-h-[600px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Subordinar Terapeutas</DialogTitle>
          </DialogHeader>

          {loadingSubordination ? (
            <div className="py-8 text-center text-muted-foreground">Carregando...</div>
          ) : availableTherapists.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Nenhum terapeuta disponível para subordinação.
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Selecione os terapeutas e admins que este contador poderá visualizar.
                Pelo menos um deve estar selecionado.
              </p>
              <div className="grid grid-cols-1 gap-3">
                {availableTherapists.map((therapist) => (
                  <div
                    key={therapist.id}
                    className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <Checkbox
                      id={`therapist-${therapist.id}`}
                      checked={selectedTherapists.includes(therapist.id)}
                      onCheckedChange={() => handleToggleTherapist(therapist.id)}
                    />
                    <Label
                      htmlFor={`therapist-${therapist.id}`}
                      className="cursor-pointer flex-1"
                    >
                      {therapist.full_name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSubordinationDialog(false)}
              disabled={loadingSubordination}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveSubordination}
              disabled={loadingSubordination || selectedTherapists.length === 0}
            >
              {loadingSubordination ? 'Salvando...' : 'Salvar Subordinação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileEdit;
