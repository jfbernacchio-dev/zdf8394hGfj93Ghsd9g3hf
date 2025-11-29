import { ReactElement, createContext } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a mock AuthContext for testing
export const MockAuthContext = createContext<any>(null);

// Create a custom render function that includes all providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  authValue?: any;
}

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { initialEntries = ['/'], authValue, ...renderOptions } = options;

  // Create a fresh QueryClient for each test
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  // Default auth value
  const defaultAuthValue = {
    user: { id: 'test-user-id', email: 'test@example.com' },
    organizationId: 'test-org-id',
    roleGlobal: 'therapist',
    loading: false,
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
  };
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react';
