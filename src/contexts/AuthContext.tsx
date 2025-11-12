import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getDefaultTemplate, applyLayoutSnapshot } from '@/lib/layoutStorage';

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
  isAdmin: boolean;
  isAccountant: boolean;
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAccountant, setIsAccountant] = useState(false);
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
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
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

    // Check if user is admin
    const { data: adminRoleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    setIsAdmin(!!adminRoleData);

    // Check if user is accountant
    const { data: accountantRoleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'accountant')
      .maybeSingle();

    setIsAccountant(!!accountantRoleData);
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
          cpf: userData.cpf,
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
          cpf: userData.cpf,
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
    } else {
      toast({
        title: "Terapeuta criado!",
        description: "O terapeuta foi criado com sucesso.",
      });
    }

    return { error, userId: data?.user?.id };
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, isAdmin, isAccountant, signUp, signIn, signOut, resetPassword, createTherapist }}>
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
