import { createContext, useContext, useEffect, useState } from 'react';
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
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);
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
    // ✅ PROTEÇÃO 1: Verificar se já está executando
    if (isFetchingProfile) {
      console.log('⏸️ [AuthContext] fetchProfile já em execução, ignorando chamada duplicada');
      return; // Early return impede execução simultânea
    }

    console.log('🎯 [AuthContext] fetchProfile INICIADO para userId:', userId);
    
    // ✅ PROTEÇÃO 2: Bloquear novas execuções
    setIsFetchingProfile(true);
    setRolesLoaded(false);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      console.log('📋 [AuthContext] Profile buscado:', { sucesso: !error, hasData: !!data });

      if (error) {
        console.error('Error fetching profile:', error);
        setRolesLoaded(true);
        return;
      }

      setProfile(data);

    // Load default layout template
    try {
      const defaultTemplate = await getDefaultTemplate(userId);
      if (defaultTemplate && defaultTemplate.layout_snapshot) {
        applyLayoutSnapshot(defaultTemplate.layout_snapshot as Record<string, string>);
        console.log('[AuthContext] Template padrão carregado:', defaultTemplate.template_name);
      }
    } catch (error) {
      console.error('[AuthContext] Erro ao carregar template padrão:', error);
    }

    console.log('🔍 [AuthContext] Iniciando verificação de roles...');

    // Check if user is admin
    const { data: adminRoleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    console.log('👑 [AuthContext] Admin check:', !!adminRoleData);
    setIsAdmin(!!adminRoleData);

    // Check if user is fulltherapist
    const { data: fullTherapistRoleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'fulltherapist')
      .maybeSingle();

    console.log('🧑‍⚕️ [AuthContext] FullTherapist check:', !!fullTherapistRoleData);
    setIsFullTherapist(!!fullTherapistRoleData);

    // Check if user is accountant
    const { data: accountantRoleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'accountant')
      .maybeSingle();

    console.log('💼 [AuthContext] Accountant check:', !!accountantRoleData);
    setIsAccountant(!!accountantRoleData);

    // Check if user is subordinate (has a manager)
    const { data: subordinateData } = await supabase
      .from('therapist_assignments')
      .select('manager_id')
      .eq('subordinate_id', userId)
      .maybeSingle();

    console.log('👥 [AuthContext] Subordinate check:', !!subordinateData);
    setIsSubordinate(!!subordinateData);
    
    // ✅ Marcar roles como carregados após todas as verificações
    setRolesLoaded(true);
    
    // ✅ LOG FINAL COMPLETO
    console.log('====================================');
    console.log('🔍 [AuthContext] ROLES CARREGADOS');
    console.log('====================================');
    console.log('isAdmin:', !!adminRoleData);
    console.log('isFullTherapist:', !!fullTherapistRoleData);
    console.log('isAccountant:', !!accountantRoleData);
    console.log('isSubordinate:', !!subordinateData);
    console.log('rolesLoaded:', true);
    console.log('====================================');
    
  } catch (error) {
    // ✅ PROTEÇÃO 3: Tratamento de erro
    console.error('❌ [AuthContext] Erro em fetchProfile:', error);
    setRolesLoaded(true); // Marcar como carregado mesmo com erro
  } finally {
    // ✅ PROTEÇÃO 4: SEMPRE liberar a flag (crítico!)
    setIsFetchingProfile(false);
    console.log('🔓 [AuthContext] fetchProfile concluído, flag liberada');
  }
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
