/**
 * ============================================================================
 * RENDER WITH PROVIDERS - Testes de Integração
 * ============================================================================
 * 
 * Helper para renderizar componentes com todos os providers necessários
 * para testes de integração completos.
 * 
 * Inclui:
 * - AuthContext (mock completo)
 * - QueryClientProvider (react-query)
 * - BrowserRouter (react-router-dom)
 * - Permissões mockadas
 * 
 * @phase C3-R.3 - Fase 3: Testes de Integração
 */

import { ReactElement, createContext } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ============================================================================
// Mock AuthContext completo
// ============================================================================
export const MockAuthContext = createContext<any>(null);

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  authValue?: any;
  queryClient?: QueryClient;
}

/**
 * Renderiza componente com todos os providers necessários
 */
export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { initialEntries = ['/'], authValue, queryClient: customQueryClient, ...renderOptions } = options;

  // QueryClient com configurações de teste
  const queryClient = customQueryClient || new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  // AuthContext mock completo com todas as props necessárias
  const defaultAuthValue = {
    // User data
    user: { id: 'test-user-id', email: 'test@example.com' },
    session: { access_token: 'test-token', user: { id: 'test-user-id' } },
    profile: {
      id: 'test-user-id',
      full_name: 'Test User',
      cpf: '000.000.000-00',
      crp: '00/00000',
      birth_date: '1990-01-01',
      organization_id: 'test-org-id',
      professional_role_id: 'test-role-id',
    },
    
    // Loading states
    loading: false,
    rolesLoaded: true,
    organizationsLoading: false,
    
    // Roles e permissões
    isAdmin: false,
    isAccountant: false,
    roleGlobal: 'psychologist' as const,
    professionalRoleSlug: 'psychologist',
    isClinicalProfessional: true,
    isAdministrativeProfessional: false,
    
    // Organization
    organizationId: 'test-org-id',
    organizations: [
      { id: 'test-org-id', legal_name: 'Test Org', cnpj: '00.000.000/0000-00', is_primary: true }
    ],
    activeOrganizationId: 'test-org-id',
    setActiveOrganizationId: () => {},
    
    // Auth methods
    signUp: async () => ({ error: null }),
    signIn: async () => ({ error: null }),
    signOut: async () => {},
    resetPassword: async () => ({ error: null }),
    createTherapist: async () => ({ error: null }),
    
    // Override com valores customizados
    ...authValue,
  };

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <MockAuthContext.Provider value={defaultAuthValue}>
            {children}
          </MockAuthContext.Provider>
        </QueryClientProvider>
      </BrowserRouter>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
    authValue: defaultAuthValue,
  };
}

// Re-export tudo do @testing-library/react
export * from '@testing-library/react';
