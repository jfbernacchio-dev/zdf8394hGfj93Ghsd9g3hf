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

interface Organization {
  id: string;
  legal_name: string;
  cnpj: string;
  is_primary: boolean;
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
  organizations: Organization[]; // FASE 10.6
  activeOrganizationId: string | null; // FASE 10.6
  setActiveOrganizationId: (id: string) => void; // FASE 10.6
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
  const [organizations, setOrganizations] = useState<Organization[]>([]); // FASE 10.6
  const [activeOrganizationId, setActiveOrganizationIdState] = useState<string | null>(null); // FASE 10.6
  const isFetchingProfileRef = useRef(false); // ✅ Mutex síncrono
  const { toast } = useToast();

  // FASE 10.6: Wrapper para setActiveOrganizationId que salva no localStorage
  const setActiveOrganizationId = (id: string) => {
    setActiveOrganizationIdState(id);
    setOrganizationId(id);
    localStorage.setItem('activeOrganizationId', id);
  };

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
    if (isFetchingProfileRef.current) {
      return;
    }
    
    isFetchingProfileRef.current = true;
    setRolesLoaded(false);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[AUTH] Error fetching profile:', error);
        setRolesLoaded(true);
        return;
      }
      
      setProfile(data);

      // Load default layout template
      try {
        const defaultTemplate = await getDefaultTemplate(userId);
        if (defaultTemplate && defaultTemplate.layout_snapshot) {
          applyLayoutSnapshot(defaultTemplate.layout_snapshot as Record<string, string>);
        }
      } catch (error) {
        console.error('[AUTH] Erro ao carregar template padrão:', error);
      }

      // Buscar role global do usuário
      const { data: userRoleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      const role = userRoleData?.role;
      
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
      setRolesLoaded(true);
      
      // FASE 10.10: Carregar organizações do usuário
      try {
        console.log('[AUTH] Carregando organizações para userId:', userId);
        
        const { data: userOrgs, error: orgsError } = await supabase
          .from('organization_owners')
          .select(`
            organization_id,
            is_primary,
            organizations (
              id,
              legal_name,
              cnpj
            )
          `)
          .eq('user_id', userId);

        if (orgsError) {
          console.error('[AUTH] Erro ao buscar organization_owners:', orgsError);
        }

        console.log('[AUTH] userOrgs retornados:', userOrgs);

        if (userOrgs && userOrgs.length > 0) {
          const orgsArray: Organization[] = userOrgs
            .filter(o => o.organizations)
            .map(o => ({
              id: (o.organizations as any).id,
              legal_name: (o.organizations as any).legal_name,
              cnpj: (o.organizations as any).cnpj,
              is_primary: o.is_primary,
            }))
            .sort((a, b) => {
              if (a.is_primary && !b.is_primary) return -1;
              if (!a.is_primary && b.is_primary) return 1;
              return a.legal_name.localeCompare(b.legal_name);
            });

          console.log('[AUTH] Organizações processadas:', orgsArray);
          setOrganizations(orgsArray);

          const savedOrgId = localStorage.getItem('activeOrganizationId');
          let activeOrgId: string | null = null;

          if (savedOrgId && orgsArray.some(o => o.id === savedOrgId)) {
            console.log('[AUTH] Usando org salva:', savedOrgId);
            activeOrgId = savedOrgId;
          } else {
            const primaryOrg = orgsArray.find(o => o.is_primary);
            activeOrgId = primaryOrg ? primaryOrg.id : orgsArray[0].id;
            console.log('[AUTH] Usando org primária/primeira:', activeOrgId);
            localStorage.setItem('activeOrganizationId', activeOrgId);
          }

          setActiveOrganizationIdState(activeOrgId);
          setOrganizationId(activeOrgId);
        } else {
          // FALLBACK: Se não encontrou em organization_owners, tentar usar profiles.organization_id
          console.warn('[AUTH] Nenhuma org encontrada em organization_owners, tentando fallback...');
          
          if (data?.organization_id) {
            console.log('[AUTH] Usando organization_id do profile:', data.organization_id);
            
            // Buscar info da organização diretamente
            const { data: orgData } = await supabase
              .from('organizations')
              .select('id, legal_name, cnpj')
              .eq('id', data.organization_id)
              .maybeSingle();

            if (orgData) {
              const fallbackOrg: Organization = {
                id: orgData.id,
                legal_name: orgData.legal_name,
                cnpj: orgData.cnpj,
                is_primary: true,
              };

              console.log('[AUTH] Organização do profile encontrada:', fallbackOrg);
              setOrganizations([fallbackOrg]);
              setActiveOrganizationIdState(orgData.id);
              setOrganizationId(orgData.id);
              localStorage.setItem('activeOrganizationId', orgData.id);
            } else {
              console.warn('[AUTH] Organização do profile não encontrada no banco');
              setOrganizations([]);
              setActiveOrganizationIdState(null);
              setOrganizationId(null);
            }
          } else {
            console.warn('[AUTH] Usuário sem organization_id no profile e sem organization_owners');
            setOrganizations([]);
            setActiveOrganizationIdState(null);
            setOrganizationId(null);
          }
        }
      } catch (orgError) {
        console.error('[AUTH] Erro ao resolver organização:', orgError);
        setOrganizations([]);
        setActiveOrganizationIdState(null);
        setOrganizationId(null);
      }
      
    } catch (error) {
      console.error('[AUTH] Erro em fetchProfile:', error);
      setRolesLoaded(true);
    } finally {
      isFetchingProfileRef.current = false;
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
      organizations, // FASE 10.6
      activeOrganizationId, // FASE 10.6
      setActiveOrganizationId, // FASE 10.6
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
