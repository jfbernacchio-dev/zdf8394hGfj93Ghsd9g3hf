import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getDefaultTemplate, applyLayoutSnapshot } from '@/lib/layoutStorage';
import { sanitizeCPF } from '@/lib/brazilianFormat';

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
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  rolesLoaded: boolean;
  isAdmin: boolean;
  isFullTherapist: boolean;
  isAccountant: boolean;
  isSubordinate: boolean;
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
  const [isFullTherapist, setIsFullTherapist] = useState(false);
  const [isAccountant, setIsAccountant] = useState(false);
  const [isSubordinate, setIsSubordinate] = useState(false);
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
          setIsFullTherapist(false);
          setIsAccountant(false);
          setIsSubordinate(false);
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

      console.log('🔍 [LOG 14] ANTES da query admin');
      // Check if user is admin
      const { data: adminRoleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      console.log('🔍 [LOG 15] DEPOIS da query admin');
      console.log('👑 [AuthContext] Admin check:', !!adminRoleData);
      setIsAdmin(!!adminRoleData);
      console.log('🔍 [LOG 16] DEPOIS de setIsAdmin');

      console.log('🔍 [LOG 17] ANTES da query fulltherapist');
      // Check if user is fulltherapist (level_number === 1)
      const { data: levelData, error: levelErr } = await supabase
        .from('user_positions')
        .select(`
          position_id,
          organization_positions (
            id,
            level_id,
            parent_position_id,
            organization_levels (
              level_number
            )
          )
        `)
        .eq('user_id', userId)
        .maybeSingle();

      console.log('🔍 [LOG 18] DEPOIS da query fulltherapist');
      const isFullTherapist = levelData?.organization_positions?.organization_levels?.level_number === 1;
      console.log('🧑‍⚕️ [AuthContext] FullTherapist check:', isFullTherapist);
      console.log('🔍 [LOG 18.5] ANTES de setIsFullTherapist');
      try {
        setIsFullTherapist(isFullTherapist);
        console.log('🔍 [LOG 18.7] DENTRO do try após setIsFullTherapist');
      } catch (e) {
        console.error('🚨 [LOG 18.8] ERRO em setIsFullTherapist:', e);
      }
      console.log('🔍 [LOG 19] DEPOIS de setIsFullTherapist');

      console.log('🔍 [LOG 20] ANTES da query accountant');
      // Check if user is accountant
      const { data: accountantRoleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'accountant')
        .maybeSingle();

      console.log('🔍 [LOG 21] DEPOIS da query accountant');
      console.log('💼 [AuthContext] Accountant check:', !!accountantRoleData);
      setIsAccountant(!!accountantRoleData);
      console.log('🔍 [LOG 22] DEPOIS de setIsAccountant');

      console.log('🔍 [LOG 23] ANTES da query subordinate');
      // Check if user is subordinate (has parent_position_id)
      const parentId = levelData?.organization_positions?.parent_position_id;
      const isSubordinateUser = !!parentId;

      console.log('🔍 [LOG 24] DEPOIS da query subordinate');
      console.log('👥 [AuthContext] Subordinate check:', isSubordinateUser);
      setIsSubordinate(isSubordinateUser);
      console.log('🔍 [LOG 25] DEPOIS de setIsSubordinate');
      
      console.log('🔍 [LOG 26] ANTES de setRolesLoaded(true)');
      // ✅ Marcar roles como carregados após todas as verificações
      setRolesLoaded(true);
      console.log('🔍 [LOG 27] DEPOIS de setRolesLoaded(true)');
      
      // ✅ LOG FINAL COMPLETO
      console.log('====================================');
      console.log('🔍 [AuthContext] ROLES CARREGADOS');
      console.log('====================================');
      console.log('isAdmin:', !!adminRoleData);
      console.log('isFullTherapist:', isFullTherapist);
      console.log('isAccountant:', !!accountantRoleData);
      console.log('isSubordinate:', isSubordinateUser);
      console.log('rolesLoaded:', true);
      console.log('====================================');
      console.log('🔍 [LOG 28] FIM do bloco try (sucesso)');
      
    } catch (error) {
      // ✅ PROTEÇÃO 3: Tratamento de erro
      console.log('🔍 [LOG 29] DENTRO do bloco catch');
      console.error('❌ [AuthContext] Erro em fetchProfile:', error);
      setRolesLoaded(true); // Marcar como carregado mesmo com erro
      console.log('🔍 [LOG 30] FIM do bloco catch');
    } finally {
      // ✅ PROTEÇÃO 4: SEMPRE liberar a flag (crítico!)
      console.log('🔍 [LOG 31] DENTRO do bloco finally');
      isFetchingProfileRef.current = false;
      console.log('🔓 [AuthContext] fetchProfile concluído, flag liberada');
      console.log('🔍 [LOG 32] FIM do bloco finally');
    }
    console.log('🔍 [LOG 33] FIM ABSOLUTO da função fetchProfile');
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
    setIsSubordinate(false);
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

    // NOVO: Inserir explicitamente em therapist_assignments para redundância
    if (data?.user?.id && user?.id) {
      const { error: assignmentError } = await supabase
        .from('therapist_assignments')
        .insert({
          manager_id: user.id,
          subordinate_id: data.user.id,
        });

      if (assignmentError) {
        console.error('Error creating therapist assignment:', assignmentError);
        // Não falha a operação se o trigger já criou o registro
      }
    }

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
      isFullTherapist,
      isAccountant,
      isSubordinate,
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
