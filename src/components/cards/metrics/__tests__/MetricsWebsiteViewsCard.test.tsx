/**
 * 🧪 TESTES UNITÁRIOS: MetricsWebsiteViewsCard
 * 
 * @phase C3-R.3 - Testes Unitários
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MetricsWebsiteViewsCard } from '../marketing/MetricsWebsiteViewsCard';

describe('MetricsWebsiteViewsCard', () => {
  const mockProps = {
    isLoading: false
  };

  it('renderiza número de visualizações (mockado)', () => {
    const { container } = render(<MetricsWebsiteViewsCard {...mockProps} />);
    expect(container.textContent).toMatch(/\d+/); // Deve ter algum número
  });

  it('mostra skeleton quando isLoading=true', () => {
    const { container } = render(<MetricsWebsiteViewsCard isLoading={true} />);
    expect(container.querySelector('.animate-pulse')).toBeTruthy();
  });
});
