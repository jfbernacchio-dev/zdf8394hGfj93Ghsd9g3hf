import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getDefaultTemplate, applyLayoutSnapshot } from '@/lib/layoutStorage';
import { sanitizeCPF } from '@/lib/brazilianFormat';
import { resolveUserOrganization } from '@/lib/organizations';

interface Profile {
  id: string;
  full_name: string;
  cpf: string;
  crp: string;
  birth_date: string;
  created_by?: string;
  phone?: string;
  clinical_approach?: string;
  send_nfse_to_therapist?: boolean;
  work_days?: number[];
  work_start_time?: string;
  work_end_time?: string;
  slot_duration?: number;
  break_time?: number;
  organization_id?: string | null; // FASE 10.3
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  rolesLoaded: boolean;
  isAdmin: boolean;
  isAccountant: boolean;
  roleGlobal: 'admin' | 'psychologist' | 'assistant' | 'accountant' | null;
  organizationId: string | null; // FASE 10.3
  signUp: (email: string, password: string, userData: Omit<Profile, 'id'>) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  createTherapist: (
    email: string, 
    password: string, 
    userData: Omit<Profile, 'id' | 'created_by'>,
    workHours?: {
      work_days: number[];
      work_start_time: string;
      work_end_time: string;
      slot_duration: number;
      break_time: number;
    }
  ) => Promise<{ error: any; userId?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAccountant, setIsAccountant] = useState(false);
  const [roleGlobal, setRoleGlobal] = useState<'admin' | 'psychologist' | 'assistant' | 'accountant' | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null); // FASE 10.3
  const isFetchingProfileRef = useRef(false); // ✅ Mutex síncrono
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetching
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRolesLoaded(false);
          setIsAdmin(false);
          setIsAccountant(false);
          setRoleGlobal(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setRolesLoaded(false);
      }
      setLoading(false);
    });

    // 🔄 LISTENER para reload manual do profile
    const handleProfileUpdate = (event: CustomEvent) => {
      if (event.detail) {
        setProfile(event.detail);
      }
    };
    
    window.addEventListener('profile-updated', handleProfileUpdate as EventListener);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('profile-updated', handleProfileUpdate as EventListener);
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    // ✅ PROTEÇÃO 1: Mutex síncrono com useRef
    if (isFetchingProfileRef.current) {
      console.log('⏸️ [AuthContext] fetchProfile já em execução, ignorando chamada duplicada');
      return;
    }

    console.log('🎯 [AuthContext] fetchProfile INICIADO para userId:', userId);
    console.log('🔍 [LOG 1] ANTES de bloquear mutex');
    
    // ✅ Bloquear novas execuções INSTANTANEAMENTE
    isFetchingProfileRef.current = true;
    console.log('🔍 [LOG 2] DEPOIS de bloquear mutex');
    
    setRolesLoaded(false);
    console.log('🔍 [LOG 3] DEPOIS de setRolesLoaded(false)');
    
    console.log('🔍 [LOG 4] ANTES do bloco try');
    try {
      console.log('🔍 [LOG 5] DENTRO do bloco try');
      console.log('🔍 [LOG 6] ANTES da query profiles');
      
      // ✅ PROTEÇÃO 2: Query simples e direta (sem timeout complexo)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      console.log('🔍 [LOG 7] DEPOIS da query profiles', { hasData: !!data, hasError: !!error });

      console.log('📋 [AuthContext] Profile buscado:', { sucesso: !error, hasData: !!data });

      if (error) {
        console.error('Error fetching profile:', error);
        setRolesLoaded(true);
        return;
      }
      
      console.log('🔍 [LOG 8] ANTES de setProfile(data)');
      setProfile(data);
      console.log('🔍 [LOG 9] DEPOIS de setProfile(data)');

      console.log('🔍 [LOG 10] ANTES de carregar template padrão');
      // Load default layout template
      try {
        const defaultTemplate = await getDefaultTemplate(userId);
        console.log('🔍 [LOG 11] Template carregado:', { hasTemplate: !!defaultTemplate });
        if (defaultTemplate && defaultTemplate.layout_snapshot) {
          applyLayoutSnapshot(defaultTemplate.layout_snapshot as Record<string, string>);
          console.log('[AuthContext] Template padrão carregado:', defaultTemplate.template_name);
        }
      } catch (error) {
        console.error('[AuthContext] Erro ao carregar template padrão:', error);
      }
      console.log('🔍 [LOG 12] DEPOIS de carregar template padrão');

      console.log('🔍 [LOG 13] Iniciando verificação de roles...');

      console.log('🔍 [LOG 14] ANTES da query user_roles');
      // Buscar role global do usuário
      const { data: userRoleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('🔍 [LOG 15] DEPOIS da query user_roles');
      
      const role = userRoleData?.role;
      
      // Mapear roles antigos para novos (transição)
      let globalRole: 'admin' | 'psychologist' | 'assistant' | 'accountant' | null = null;
      
      if (role === 'admin') {
        globalRole = 'admin';
        setIsAdmin(true);
      } else if (role === 'accountant') {
        globalRole = 'accountant';
        setIsAccountant(true);
      } else if (role === 'therapist' || role === 'fulltherapist') {
        globalRole = 'psychologist';
      } else if (role === 'assistant') {
        globalRole = 'assistant';
      }
      
      setRoleGlobal(globalRole);
      
      console.log('🔍 [LOG 16] Role global determinado:', globalRole);
      
      console.log('🔍 [LOG 17] ANTES de setRolesLoaded(true)');
      // ✅ Marcar roles como carregados após todas as verificações
      setRolesLoaded(true);
      console.log('🔍 [LOG 18] DEPOIS de setRolesLoaded(true)');
      
      // FASE 10.3: Resolver organização do usuário
      try {
        console.log('🏢 [FASE 10.3] Resolvendo organização do usuário...');
        const orgId = await resolveUserOrganization(userId);
        setOrganizationId(orgId);
        console.log('🏢 [FASE 10.3] Organização resolvida:', orgId || 'nenhuma');
      } catch (orgError) {
        console.error('🏢 [FASE 10.3] Erro ao resolver organização:', orgError);
        setOrganizationId(null);
      }
      
      // ✅ LOG FINAL COMPLETO
      console.log('====================================');
      console.log('🔍 [AuthContext] ROLES CARREGADOS');
      console.log('====================================');
      console.log('isAdmin:', !!globalRole && globalRole === 'admin');
      console.log('isAccountant:', !!globalRole && globalRole === 'accountant');
      console.log('roleGlobal:', globalRole);
      console.log('rolesLoaded:', true);
      console.log('====================================');
      console.log('🔍 [LOG 19] FIM do bloco try (sucesso)');
      
    } catch (error) {
      // ✅ PROTEÇÃO 3: Tratamento de erro
      console.log('🔍 [LOG 20] DENTRO do bloco catch');
      console.error('❌ [AuthContext] Erro em fetchProfile:', error);
      setRolesLoaded(true); // Marcar como carregado mesmo com erro
      console.log('🔍 [LOG 21] FIM do bloco catch');
    } finally {
      // ✅ PROTEÇÃO 4: SEMPRE liberar a flag (crítico!)
      console.log('🔍 [LOG 22] DENTRO do bloco finally');
      isFetchingProfileRef.current = false;
      console.log('🔓 [AuthContext] fetchProfile concluído, flag liberada');
      console.log('🔍 [LOG 23] FIM do bloco finally');
    }
    console.log('🔍 [LOG 24] FIM ABSOLUTO da função fetchProfile');
  };

  const signUp = async (email: string, password: string, userData: Omit<Profile, 'id'>) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: userData.full_name,
          cpf: sanitizeCPF(userData.cpf), // Sanitize CPF before sending
          crp: userData.crp,
          birth_date: userData.birth_date,
        }
      }
    });

    if (error) {
      toast({
        title: "Erro no cadastro",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Cadastro realizado!",
        description: "Você já pode fazer login.",
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
    setIsAccountant(false);
    setRoleGlobal(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
    }

    return { error };
  };

  const createTherapist = async (
    email: string, 
    password: string, 
    userData: Omit<Profile, 'id' | 'created_by'>,
    workHours?: {
      work_days: number[];
      work_start_time: string;
      work_end_time: string;
      slot_duration: number;
      break_time: number;
    }
  ) => {
    if (!isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores podem criar terapeutas.",
        variant: "destructive",
      });
      return { error: new Error("Unauthorized") };
    }

    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: userData.full_name,
          cpf: sanitizeCPF(userData.cpf), // Sanitize CPF before sending
          crp: userData.crp,
          birth_date: userData.birth_date,
          created_by: user?.id,
          ...(workHours && {
            work_days: workHours.work_days,
            work_start_time: workHours.work_start_time,
            work_end_time: workHours.work_end_time,
            slot_duration: workHours.slot_duration,
            break_time: workHours.break_time,
          }),
        }
      }
    });

    if (error) {
      toast({
        title: "Erro ao criar terapeuta",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }

    // DEPRECATED: therapist_assignments não é mais usado no novo sistema
    // Mantido temporariamente apenas para compatibilidade com dados legados

    toast({
      title: "Terapeuta criado!",
      description: "O terapeuta foi criado com sucesso.",
    });

    return { error, userId: data?.user?.id };
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      profile, 
      loading,
      rolesLoaded,
      isAdmin,
      isAccountant,
      roleGlobal,
      organizationId, // FASE 10.3
      signUp, 
      signIn, 
      signOut, 
      resetPassword,
      createTherapist 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
