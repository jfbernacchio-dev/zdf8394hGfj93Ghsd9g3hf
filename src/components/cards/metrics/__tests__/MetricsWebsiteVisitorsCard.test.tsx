/**
 * 🧪 TESTES UNITÁRIOS: MetricsWebsiteVisitorsCard
 * 
 * @phase C3-R.3 - Testes Unitários
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MetricsWebsiteVisitorsCard } from '../marketing/MetricsWebsiteVisitorsCard';

describe('MetricsWebsiteVisitorsCard', () => {
  const mockProps = {
    isLoading: false
  };

  it('renderiza número de visitantes (mockado)', () => {
    const { container } = render(<MetricsWebsiteVisitorsCard {...mockProps} />);
    expect(container.textContent).toMatch(/\d+/); // Deve ter algum número
  });

  it('mostra skeleton quando isLoading=true', () => {
    const { container } = render(<MetricsWebsiteVisitorsCard isLoading={true} />);
    expect(container.querySelector('.animate-pulse')).toBeTruthy();
  });
});
